(function(root){
  "use strict";

  const BUILD=Object.freeze({work_package:"FB-ARCH-01A",increment:"B1",component:"private_extension_state",version:"0.1.0-private",build:"1.8.1-dev.1+fb-arch-01a-b1"});
  const NAMESPACE="mow.builder.extension_platform";
  const SCHEMA="mow.builder.extension_state";
  const SCHEMA_VERSION="0.1.0-private";
  const LEGACY_KEYS=Object.freeze({library:"mow_builder_experimental_fleets_v1",autosave:"mow_builder_experimental_autosave_v1",active_id:"mow_builder_experimental_active_id_v1"});

  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function isObject(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function deepFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);Object.keys(value).forEach(key=>deepFreeze(value[key]));}return value;}
  function nowIso(options){return String(options&&options.now||new Date().toISOString());}
  function normalizeRef(value){if(!isObject(value))return null;const type=String(value.type||"").trim(),id=String(value.id||"").trim();return type&&id?{type,id}:null;}
  function normalizeAssignment(value){
    const input=isObject(value)?value:{};
    return {
      assignment_id:String(input.assignment_id||"").trim(),
      assignment_type:String(input.assignment_type||"extension_relation").trim(),
      subject_ref:normalizeRef(input.subject_ref),
      target_ref:normalizeRef(input.target_ref),
      status:String(input.status||"pending").trim(),
      subject_name:String(input.subject_name||"").trim()||null,
      conflict_code:String(input.conflict_code||"").trim()||null,
      source_ref:clone(input.source_ref||null),
      extensions:clone(input.extensions||{})
    };
  }
  function emptyEnvelope(options){
    return {schema:SCHEMA,schema_version:SCHEMA_VERSION,updated_at:nowIso(options),package_states:[],module_states:[],assignments:[],relations:[],migration:null,quarantine:[],extensions:{}};
  }
  function normalizeEnvelope(value,options){
    const input=isObject(value)&&value.schema===SCHEMA?value:{};
    const out=emptyEnvelope(options);
    out.updated_at=String(input.updated_at||out.updated_at);
    out.package_states=Array.isArray(input.package_states)?clone(input.package_states):[];
    out.module_states=Array.isArray(input.module_states)?clone(input.module_states):[];
    out.assignments=Array.isArray(input.assignments)?input.assignments.map(normalizeAssignment).filter(item=>item.assignment_id&&item.subject_ref):[];
    out.relations=Array.isArray(input.relations)?clone(input.relations):[];
    out.migration=isObject(input.migration)?clone(input.migration):null;
    out.quarantine=Array.isArray(input.quarantine)?clone(input.quarantine):[];
    out.extensions=isObject(input.extensions)?clone(input.extensions):{};
    return deepFreeze(out);
  }
  function fromModel(model,options){
    const raw=isObject(model)&&isObject(model.extensions)?model.extensions[NAMESPACE]:null;
    return normalizeEnvelope(raw,options);
  }
  function applyToModel(model,envelope,options){
    const copy=clone(model||{});copy.extensions=isObject(copy.extensions)?copy.extensions:{};
    const normalized=clone(normalizeEnvelope(envelope,options));normalized.updated_at=nowIso(options);
    copy.extensions[NAMESPACE]=normalized;
    return copy;
  }
  function parseMaybeJson(value){if(value==null)return null;if(typeof value!=="string")return clone(value);try{return JSON.parse(value);}catch(error){return {__parse_error__:String(error&&error.message||error),raw:String(value)};}}
  function migrateLegacyExperimental(raw,options){
    const source=isObject(raw)?raw:{};
    const envelope=clone(emptyEnvelope(options));
    const library=parseMaybeJson(source.library);
    const autosave=parseMaybeJson(source.autosave);
    const activeId=source.active_id==null?null:String(source.active_id);
    const migrated=[];
    function quarantine(kind,value){
      if(value==null)return;
      const states=kind==="library"&&Array.isArray(value&&value.fleets)?value.fleets.map(entry=>entry&&entry.state).filter(Boolean):[value];
      states.forEach((state,index)=>{
        const fleetKey=String(state&&state.fleet_key||"unknown");
        const record={record_id:`legacy.${kind}.${index}`,legacy_kind:kind,fleet_key:fleetKey,status:"quarantined_fixture",active:false,raw:clone(state)};
        envelope.quarantine.push(record);migrated.push(record.record_id);
      });
    }
    quarantine("library",library);quarantine("autosave",autosave);
    envelope.migration={schema:"mow.builder.extension_migration",schema_version:"0.1.0-private",source:"mow.builder_experimental_persistence/0.1",migrated_at:nowIso(options),legacy_keys:LEGACY_KEYS,active_id:activeId,migrated_records:migrated,activation_policy:"none_without_fleet_readmission"};
    return deepFreeze(envelope);
  }
  function entityIds(projection){
    const set=new Set();
    const entities=projection&&projection.entities||{};
    Object.keys(entities).forEach(collection=>{(Array.isArray(entities[collection])?entities[collection]:[]).forEach(item=>{const id=String(item&&item.id||""),kind=String(item&&item.kind||collection).replace(/s$/,"");if(id)set.add(`${kind}:${id}`);});});
    return set;
  }
  function reconcileAssignments(envelope,projection,options){
    const out=clone(normalizeEnvelope(envelope,options));
    const ids=entityIds(projection),events=[];
    out.assignments=out.assignments.map(item=>{
      const next=clone(item),subjectKey=next.subject_ref?`${next.subject_ref.type}:${next.subject_ref.id}`:null,targetKey=next.target_ref?`${next.target_ref.type}:${next.target_ref.id}`:null;
      if(subjectKey&&!ids.has(subjectKey)){
        next.status="orphaned_subject";next.conflict_code="SUBJECT_MISSING";
        events.push({assignment_id:next.assignment_id,code:"SUBJECT_MISSING",subject_ref:clone(next.subject_ref)});
        return next;
      }
      if(targetKey&&!ids.has(targetKey)){
        const previous=clone(next.target_ref);next.target_ref=null;next.status="conflict";next.conflict_code="TARGET_MISSING";
        events.push({assignment_id:next.assignment_id,code:"TARGET_MISSING",previous_target_ref:previous,subject_preserved:true,subject_name:next.subject_name});
      }
      return next;
    });
    out.updated_at=nowIso(options);
    return deepFreeze({envelope:out,events});
  }

  const api=Object.freeze({BUILD,NAMESPACE,SCHEMA,SCHEMA_VERSION,LEGACY_KEYS,emptyEnvelope,normalizeEnvelope,fromModel,applyToModel,migrateLegacyExperimental,reconcileAssignments});
  root.MowExtensionState=api;
  root.MOW_FB_ARCH_01A_EXTENSION_STATE=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
