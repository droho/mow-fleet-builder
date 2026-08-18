(function(root){
  "use strict";

  const BUILD=Object.freeze({work_package:"FB-ARCH-01A",increment:"B10",component:"resolved_fleet_projection",version:"0.10.0-private",build:"1.8.1-dev.10+fb-arch-01a-b10"});
  const ENTITY_MAP=Object.freeze({selections:"selection",squadrons:"squadron",units:"unit",roles:"role",resources:"resource"});

  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function isObject(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function deepFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);Object.keys(value).forEach(key=>deepFreeze(value[key]));}return value;}
  function stableValue(value){if(Array.isArray(value))return value.map(stableValue);if(isObject(value))return Object.keys(value).sort().reduce((out,key)=>{out[key]=stableValue(value[key]);return out;},{});return value;}
  function stableJson(value){return JSON.stringify(stableValue(value));}
  function fingerprint(value){let hash=2166136261,text=stableJson(value);for(let i=0;i<text.length;i+=1){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}return `fnv1a32-${(hash>>>0).toString(16).padStart(8,"0")}`;}
  function idFor(kind,item){
    const keys={selection:["selection_instance_id","selection_id"],squadron:["squadron_instance_id"],unit:["unit_instance_id","unit_definition_id"],role:["role_instance_id","role_definition_id"],resource:["resource_instance_id","resource_definition_id"]};
    for(const key of keys[kind]||[]){const value=String(item&&item[key]||"").trim();if(value)return value;}
    return "";
  }
  function labelFor(kind,item){
    const candidates=[item&&item.custom_name,item&&item.name,item&&item.label,item&&item.selection_id,item&&item.unit_definition_id,item&&item.role_definition_id,item&&item.resource_definition_id,idFor(kind,item)];
    return String(candidates.find(value=>String(value||"").trim())||"").trim();
  }
  function projectEntity(kind,item){
    return {
      id:idFor(kind,item),
      kind,
      label:labelFor(kind,item),
      custom_name:String(item&&item.custom_name||"").trim()||null,
      definition_id:String(item&&item[`${kind}_definition_id`]||item&&item.selection_id||"").trim()||null,
      channel:String(item&&item.channel||item&&item.context&&item.context.channel||"").trim()||null,
      source_ref:clone(item&&item.source_ref||null),
      result_refs:clone(item&&item.result_refs||null),
      extensions:clone(item&&item.extensions||{})
    };
  }
  function projectEntities(model){
    const out={selections:[],squadrons:[],units:[],roles:[],resources:[]};
    Object.keys(ENTITY_MAP).forEach(source=>{const kind=ENTITY_MAP[source];out[source]=(Array.isArray(model&&model[source])?model[source]:[]).map(item=>projectEntity(kind,item)).filter(item=>item.id);});
    return out;
  }
  function normalizeOfficialAssignment(item){
    if(!isObject(item))return null;
    return {
      assignment_id:String(item.assignment_instance_id||item.assignment_id||"").trim(),
      assignment_type:String(item.assignment_type||"").trim(),
      subject_ref:clone(item.subject_ref||null),
      target_ref:clone(item.target_ref||null),
      status:String(item.status||"resolved"),
      source:"mow.fleet",
      extensions:clone(item.extensions||{})
    };
  }
  function registryModules(snapshot,activeIds){
    const active=new Set(activeIds||[]);
    return (snapshot&&Array.isArray(snapshot.modules)?snapshot.modules:[]).map(module=>{
      const aliases=module&&module.extensions&&module.extensions.aliases&&Array.isArray(module.extensions.aliases.ruleset_module_ids)?module.extensions.aliases.ruleset_module_ids:[];
      return {module_id:module.module_id,package_id:module.package_id,version:module.version,label:module.label,maturity:module.maturity,complete:module.complete,
        active:active.has(module.module_id)||aliases.some(id=>active.has(id)),active_default:module.active_default,dependencies:clone(module.dependencies||[]),conflicts:clone(module.conflicts||[]),aliases:clone(aliases)};
    });
  }
  function currentRegistryFleet(snapshot,primaryFactionId){
    const primary=String(primaryFactionId||"");
    return clone((snapshot&&Array.isArray(snapshot.fleets)?snapshot.fleets:[]).find(fleet=>fleet&&fleet.extensions&&fleet.extensions.aliases&&fleet.extensions.aliases.primary_faction_id===primary)||null);
  }
  function byId(items,key,id){return (Array.isArray(items)?items:[]).find(item=>item&&item[key]===id)||null;}
  function originSelection(model,item){return item&&item.origin_selection_instance_id?byId(model&&model.selections,"selection_instance_id",item.origin_selection_instance_id):null;}
  function sourceControlId(selection){const source=selection&&selection.source_ref||{},direct=String(source.external_id||"").trim();return direct||String(source.raw_external_key||"").trim().split(".").pop()||"";}
  function assignmentFor(model,type,id){return (Array.isArray(model&&model.assignments)?model.assignments:[]).find(item=>item&&item.subject_ref&&item.subject_ref.type===type&&item.subject_ref.id===id)||null;}
  function clean(value){return String(value==null?"":value).replace(/[\r\n\t]+/g," ").replace(/\s{2,}/g," ").trim();}
  function human(value){return clean(String(value||"").split(".").pop().replace(/_/g," ")).replace(/\b\w/g,char=>char.toUpperCase());}
  function chaosVariant(model){
    const raw=clean(model&&model.identity&&model.identity.fleet_variant&&model.identity.fleet_variant.chaos_variant).toLowerCase();
    return ({khorne:"dedicated_khorne",nurgle:"dedicated_nurgle",slaanesh:"dedicated_slaanesh",tzeentch:"dedicated_tzeentch",plaguefleet:"plaguefleet"})[raw]||raw||null;
  }
  const RESOURCE_NAME_PROFILE=Object.freeze({"upgrade.skaven.eshin_assassin":"skaven.eshin_assassin","upgrade.skaven.rat_ogres":"skaven.rat_ogre"});
  function characterNameCapability(model,kind,item){
    if(kind==="resource"){const profile=RESOURCE_NAME_PROFILE[item&&item.definition_id];return {nameable:!!profile,generatorAvailable:!!profile,profileId:profile||null};}
    if(kind!=="role")return {nameable:false,generatorAvailable:false};
    const selection=originSelection(model,item),generator=root.MowCharacterNameGenerator;
    if(!generator||typeof generator.resolve!=="function")return {nameable:!!clean(item&&item.custom_name),generatorAvailable:false};
    try{
      const resolved=generator.resolve({
        faction:String(selection&&selection.context&&selection.context.selection_fleet_context_id||model&&model.identity&&model.identity.primary_faction_id||""),
        roleId:item&&item.role_id||null,roleVariant:item&&item.variant_id||null,fleetVariant:chaosVariant(model),commanderType:null,isAllied:selection&&selection.channel==="ally"
      });
      return {nameable:!!(resolved&&["nameable_person","alias_or_variant_of_profile"].includes(resolved.status)),generatorAvailable:!!(resolved&&resolved.available),profileId:resolved&&resolved.profileId||null};
    }catch(error){return {nameable:!!clean(item&&item.custom_name),generatorAvailable:false};}
  }
  function characterNamesSurface(model){
    const result=[];
    function add(kind,item,idKey,subjectType){
      const id=String(item&&item[idKey]||"").trim();if(!id)return;const selection=originSelection(model,item),capability=characterNameCapability(model,kind,item),assignment=assignmentFor(model,subjectType,id),commands=root.MOW_FLEET_RELEASE90_SETUP_COMMANDS||root.MowFleetSetupCommands||null;let label="";
      try{label=commands&&typeof commands.labelFromSource==="function"?String(commands.labelFromSource(model,item)||""):"";}catch(error){}
      const definitionId=kind==="role"?String(item&&item.role_id||"").trim():String(item&&item.definition_id||"").trim();
      result.push({kind,id,definition_id:definitionId||null,custom_name:String(item&&item.custom_name||"").trim()||null,nameable:!!capability.nameable,generator_available:!!capability.generatorAvailable,control_id:sourceControlId(selection),label:label||human(definitionId)||labelFor(kind,item),assignment_id:String(assignment&&(assignment.assignment_instance_id||assignment.assignment_id)||"").trim()||null,assignment_status:String(assignment&&assignment.status||"").trim()||null,target_ref:clone(assignment&&assignment.target_ref||null),channel:String(selection&&selection.channel||"").trim()||null});
    }
    (Array.isArray(model&&model.roles)?model.roles:[]).forEach(item=>add("role",item,"role_instance_id","role_instance"));
    (Array.isArray(model&&model.resources)?model.resources:[]).forEach(item=>add("resource",item,"resource_instance_id","resource_instance"));
    return {available:!!model,revision:Number(model&&model.revision||0),items:result,nameable_items:result.filter(item=>item.nameable),named_items:result.filter(item=>item.custom_name)};
  }
  function validationPresentationSnapshot(){
    try{
      const service=root.MOW_VALIDATION_PRESENTATION_SERVICE;
      const snapshot=service&&typeof service.snapshot==="function"?service.snapshot():null;
      return {items:clone(snapshot&&snapshot.items||[]),count:Number(snapshot&&snapshot.count||0),source:"MOW_VALIDATION_PRESENTATION_SERVICE"};
    }catch(error){return {items:[],count:0,source:"MOW_VALIDATION_PRESENTATION_SERVICE",error:String(error&&error.message||error)};}
  }
  function build(input){
    const options=input||{},model=isObject(options.model)?clone(options.model):null,registrySnapshot=clone(options.registry_snapshot||{packages:[],fleets:[],modules:[],profiles:[],relations:[],sources:[],validators:[]}),envelope=clone(options.extension_state||null);
    const official={
      available:!!model,
      schema:model&&model.schema||null,
      schema_version:model&&model.schema_version||null,
      fleet_id:model&&model.fleet_id||null,
      revision:Number(model&&model.revision||0),
      document_profile:model&&model.document_profile||null,
      identity:clone(model&&model.identity||null),
      ruleset_ref:clone(model&&model.ruleset_ref||null),
      planning:clone(model&&model.planning||null),
      points:clone(model&&model.points||null)
    };
    const entities=projectEntities(model||{});
    const surfaceModels={
      fleet_setup:{available:!!model,revision:Number(model&&model.revision||0),model:clone(model)},
      character_names:characterNamesSurface(model),
      roster:{available:!!model,revision:Number(model&&model.revision||0),model:clone(model),formatter:"MOW_BATCH90C_ROSTER.buildRoster",base_text_source:"mainline_roster_base_adapter"},
      print:{available:!!model,revision:Number(model&&model.revision||0),source_surface:"roster",format:"text/plain",presentation:"preformatted_roster"},
      validation_presentation:Object.assign({available:!!model,revision:Number(model&&model.revision||0)},validationPresentationSnapshot())
    };
    const assignments=(Array.isArray(model&&model.assignments)?model.assignments:[]).map(normalizeOfficialAssignment).filter(Boolean);
    (envelope&&Array.isArray(envelope.assignments)?envelope.assignments:[]).forEach(item=>assignments.push(Object.assign({source:"private_extension"},clone(item))));
    const projection={
      schema:"mow.builder.resolved_fleet_projection",
      schema_version:"0.1.0-private",
      build:BUILD,
      ready:!!model,
      official,
      extension:{
        support_scope:model?"portable":"builder_only",
        package_states:clone(envelope&&envelope.package_states||[]),
        module_states:clone(envelope&&envelope.module_states||[]),
        relations:clone(envelope&&envelope.relations||[]),
        migration:clone(envelope&&envelope.migration||null),
        quarantine_count:Array.isArray(envelope&&envelope.quarantine)?envelope.quarantine.length:0
      },
      registry:{
        packages:clone(registrySnapshot.packages||[]),fleets:clone(registrySnapshot.fleets||[]),profiles:clone(registrySnapshot.profiles||[]),
        relations:clone(registrySnapshot.relations||[]),sources:clone(registrySnapshot.sources||[]),compositions:clone(registrySnapshot.compositions||[]),modules:registryModules(registrySnapshot,model&&model.ruleset_ref&&model.ruleset_ref.modules),
        current_fleet:currentRegistryFleet(registrySnapshot,model&&model.identity&&model.identity.primary_faction_id)
      },
      entities,
      assignments,
      surface_models:surfaceModels,
      validation:{issues:[]},
      metadata:{reason:String(options.reason||"explicit"),language:String(model&&model.identity&&model.identity.language||""),generated_at:String(options.generated_at||"")||null}
    };
    projection.fingerprint=fingerprint({official:projection.official,extension:projection.extension,registry:projection.registry,entities:projection.entities,assignments:projection.assignments,surface_models:projection.surface_models});
    return deepFreeze(projection);
  }
  function entityIndex(projection){
    const map=new Map(),entities=projection&&projection.entities||{};
    Object.keys(entities).forEach(collection=>{(entities[collection]||[]).forEach(item=>map.set(`${item.kind}:${item.id}`,item));});
    return map;
  }
  function withValidation(projection,issues){
    const copy=clone(projection||{});copy.validation={issues:Array.isArray(issues)?clone(issues):[]};copy.fingerprint=fingerprint({official:copy.official,extension:copy.extension,registry:copy.registry,entities:copy.entities,assignments:copy.assignments,surface_models:copy.surface_models,validation:copy.validation});return deepFreeze(copy);
  }

  const api=Object.freeze({BUILD,build,entityIndex,withValidation,fingerprint,stableJson});
  root.MowResolvedFleetProjection=api;
  root.MOW_FB_ARCH_01A_PROJECTION=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
