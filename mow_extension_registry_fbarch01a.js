(function(root){
  "use strict";

  const BUILD=Object.freeze({
    work_package:"FB-ARCH-01A",
    increment:"B10",
    component:"extension_registry",
    version:"0.2.0-private",
    product_version:"1.8.1",
    build:"1.8.1-dev.10+fb-arch-01a-b10"
  });
  const ID_RE=/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)+$/;
  const RELATION_TYPES=Object.freeze(["ally","borrowed","captured","mercenary","shared_native"]);
  const MODULE_MATURITY=Object.freeze(["draft","experimental","accepted","official"]);
  const SUPPORT_SCOPES=Object.freeze(["builder_only","portable","cross_tool"]);
  const PURCHASE_SCOPES=Object.freeze(["unit","squadron","role","resource","card","upgrade","mixed"]);
  const NAMEABILITY=Object.freeze(["inherit","nameable","fixed","restricted","none"]);
  const COMPOSITION_PRIMITIVES=Object.freeze(["min_max","ratio","point_band","prerequisite","exclusion","replacement","uniqueness","host_derived_cap"]);

  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function isObject(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function stableValue(value){
    if(Array.isArray(value))return value.map(stableValue);
    if(isObject(value))return Object.keys(value).sort().reduce((out,key)=>{out[key]=stableValue(value[key]);return out;},{});
    return value;
  }
  function stableJson(value){return JSON.stringify(stableValue(value));}
  function deepFreeze(value){
    if(value&&typeof value==="object"&&!Object.isFrozen(value)){
      Object.freeze(value);
      Object.keys(value).forEach(key=>deepFreeze(value[key]));
    }
    return value;
  }
  function fail(code,message,details){
    const error=new Error(message);error.name="MowExtensionRegistryError";error.code=code;
    if(details!==undefined)error.details=details;
    throw error;
  }
  function requireStableId(value,label){
    const id=String(value||"").trim();
    if(!ID_RE.test(id))fail("INVALID_STABLE_ID",`${label} must be a stable dotted identifier.`,{label,value});
    return id;
  }
  function requireEnum(value,allowed,label){
    const normalized=String(value||"").trim();
    if(!allowed.includes(normalized))fail("INVALID_ENUM",`${label} is not supported.`,{label,value,allowed});
    return normalized;
  }
  function normalizePackage(input){
    if(!isObject(input))fail("INVALID_PACKAGE","Package definition must be an object.");
    return {
      package_id:requireStableId(input.package_id,"package_id"),
      version:String(input.version||"").trim()||"0.0.0",
      title:String(input.title||input.package_id||"").trim(),
      source:clone(input.source||null),
      status:String(input.status||"experimental"),
      official:input.official===true,
      builder_only:input.builder_only!==false,
      extensions:clone(input.extensions||{})
    };
  }
  function normalizeFleet(input){
    if(!isObject(input))fail("INVALID_FLEET","Fleet definition must be an object.");
    return {
      fleet_id:requireStableId(input.fleet_id,"fleet_id"),
      package_id:requireStableId(input.package_id,"package_id"),
      label:String(input.label||input.fleet_id||"").trim(),
      support_scope:requireEnum(input.support_scope||"builder_only",SUPPORT_SCOPES,"support_scope"),
      official:input.official===true,
      enabled_default:input.enabled_default===true,
      source_refs:Array.isArray(input.source_refs)?clone(input.source_refs):[],
      extensions:clone(input.extensions||{})
    };
  }
  function normalizeModule(input){
    if(!isObject(input))fail("INVALID_MODULE","Module definition must be an object.");
    const maturity=requireEnum(input.maturity||"draft",MODULE_MATURITY,"maturity");
    const complete=input.complete===true;
    const activeDefault=(maturity==="official"||maturity==="accepted")&&complete&&input.active_default===true;
    return {
      module_id:requireStableId(input.module_id,"module_id"),
      package_id:requireStableId(input.package_id,"package_id"),
      version:String(input.version||"").trim()||"0.0.0",
      label:String(input.label||input.module_id||"").trim(),
      maturity,
      complete,
      active_default:activeDefault,
      dependencies:Array.isArray(input.dependencies)?input.dependencies.map(id=>requireStableId(id,"dependency module_id")):[],
      conflicts:Array.isArray(input.conflicts)?input.conflicts.map(id=>requireStableId(id,"conflict module_id")):[],
      source_refs:Array.isArray(input.source_refs)?clone(input.source_refs):[],
      extensions:clone(input.extensions||{})
    };
  }
  function normalizeProfile(input){
    if(!isObject(input))fail("INVALID_PROFILE","Profile definition must be an object.");
    return {
      profile_id:requireStableId(input.profile_id,"profile_id"),
      package_id:requireStableId(input.package_id,"package_id"),
      label:String(input.label||input.profile_id||"").trim(),
      category:String(input.category||"unit"),
      purchase_group_id:input.purchase_group_id?requireStableId(input.purchase_group_id,"purchase_group_id"):null,
      nameability:requireEnum(input.nameability||"inherit",NAMEABILITY,"nameability"),
      unique:input.unique===true,
      source_ref:clone(input.source_ref||null),
      extensions:clone(input.extensions||{})
    };
  }
  function optionalCount(value,label){
    if(value===undefined||value===null||value==="")return null;
    const n=Number(value);if(!Number.isFinite(n)||n<0||Math.floor(n)!==n)fail("INVALID_COUNT",`${label} must be a non-negative integer.`,{label,value});return n;
  }
  function positiveNumber(value,label,defaultValue){
    const raw=value===undefined||value===null||value===""?defaultValue:value,n=Number(raw);
    if(!Number.isFinite(n)||n<=0)fail("INVALID_NUMBER",`${label} must be greater than zero.`,{label,value});return n;
  }
  function normalizePurchaseGroup(input){
    if(!isObject(input))fail("INVALID_PURCHASE_GROUP","Purchase group definition must be an object.");
    const min=optionalCount(input.min,"purchase_group.min"),max=optionalCount(input.max,"purchase_group.max");
    if(min!==null&&max!==null&&min>max)fail("INVALID_PURCHASE_GROUP","purchase_group min cannot exceed max.",{min,max});
    return {group_id:requireStableId(input.group_id,"group_id"),label:String(input.label||input.group_id||"").trim(),purchase_scope:requireEnum(input.purchase_scope||"unit",PURCHASE_SCOPES,"purchase_scope"),members:Array.isArray(input.members)?clone(input.members):[],min,max,extensions:clone(input.extensions||{})};
  }
  function normalizeCompositionRule(input){
    if(!isObject(input))fail("INVALID_COMPOSITION_RULE","Composition rule must be an object.");
    const primitive=requireEnum(input.primitive,COMPOSITION_PRIMITIVES,"composition primitive");
    const out={rule_id:requireStableId(input.rule_id,"rule_id"),primitive,severity:String(input.severity||"error"),message:String(input.message||"").trim()||null,extensions:clone(input.extensions||{})};
    const ref=(value,label)=>requireStableId(value,label);
    if(primitive==="min_max"){out.subject_id=ref(input.subject_id,"subject_id");out.min=optionalCount(input.min,"min");out.max=optionalCount(input.max,"max");if(out.min===null&&out.max===null)fail("INVALID_COMPOSITION_RULE","min_max requires min and/or max.");}
    if(primitive==="ratio"){out.subject_id=ref(input.subject_id,"subject_id");out.basis_id=ref(input.basis_id,"basis_id");out.max_per=positiveNumber(input.max_per,"max_per",1);out.basis_per=positiveNumber(input.basis_per,"basis_per",1);}
    if(primitive==="point_band"){out.subject_id=ref(input.subject_id,"subject_id");out.bands=(Array.isArray(input.bands)?input.bands:[]).map((band,index)=>{if(!isObject(band))fail("INVALID_COMPOSITION_RULE","point_band entries must be objects.",{index});const min_points=optionalCount(band.min_points??0,"min_points"),max_points=optionalCount(band.max_points,"max_points"),max=optionalCount(band.max,"max");if(max===null)fail("INVALID_COMPOSITION_RULE","point_band entry requires max.",{index});return {min_points:min_points||0,max_points,max};});if(!out.bands.length)fail("INVALID_COMPOSITION_RULE","point_band requires bands.");}
    if(primitive==="prerequisite"){out.subject_id=ref(input.subject_id,"subject_id");out.target_id=ref(input.target_id,"target_id");out.min_target=optionalCount(input.min_target??1,"min_target");}
    if(primitive==="exclusion"){out.subject_ids=(Array.isArray(input.subject_ids)?input.subject_ids:[]).map((id,index)=>ref(id,`subject_ids[${index}]`));if(out.subject_ids.length<2)fail("INVALID_COMPOSITION_RULE","exclusion requires at least two subject_ids.");out.max_active=optionalCount(input.max_active??1,"max_active");}
    if(primitive==="replacement"){out.base_id=ref(input.base_id,"base_id");out.replacement_id=ref(input.replacement_id,"replacement_id");out.mode=requireEnum(input.mode||"whole_group",["whole_group","partial"],"replacement mode");}
    if(primitive==="uniqueness"){out.subject_id=ref(input.subject_id,"subject_id");}
    if(primitive==="host_derived_cap"){out.subject_id=ref(input.subject_id,"subject_id");out.host_id=ref(input.host_id,"host_id");out.per_host=positiveNumber(input.per_host,"per_host",1);out.offset=Number(input.offset||0);if(!Number.isFinite(out.offset))fail("INVALID_COMPOSITION_RULE","offset must be numeric.");}
    return out;
  }
  function normalizeComposition(input){
    if(!isObject(input))fail("INVALID_COMPOSITION","Composition definition must be an object.");
    const groups=(Array.isArray(input.purchase_groups)?input.purchase_groups:[]).map(normalizePurchaseGroup);
    const seen=new Set();groups.forEach(group=>{if(seen.has(group.group_id))fail("DUPLICATE_ID_CONFLICT",`Purchase group '${group.group_id}' is duplicated.`);seen.add(group.group_id);});
    const rules=(Array.isArray(input.rules)?input.rules:[]).map(normalizeCompositionRule),ruleIds=new Set();rules.forEach(rule=>{if(ruleIds.has(rule.rule_id))fail("DUPLICATE_ID_CONFLICT",`Composition rule '${rule.rule_id}' is duplicated.`);ruleIds.add(rule.rule_id);});
    return {composition_id:requireStableId(input.composition_id,"composition_id"),fleet_id:requireStableId(input.fleet_id,"fleet_id"),version:String(input.version||"0.1.0-private"),purchase_groups:groups,rules,source_refs:Array.isArray(input.source_refs)?clone(input.source_refs):[],extensions:clone(input.extensions||{})};
  }
  function evaluateComposition(definition,state,context){
    const composition=normalizeComposition(definition),input=isObject(state)?state:{},counts=isObject(input.counts)?input.counts:{},points=Number(input.points_limit||0),issues=[];
    const count=id=>{const value=Number(counts[id]||0);return Number.isFinite(value)&&value>=0?value:0;};
    const issue=(rule,code,details,message)=>issues.push({rule_id:rule.rule_id||null,primitive:rule.primitive||"group",code,severity:String(rule.severity||"error"),message:rule.message||message,details:clone(details||{})});
    composition.purchase_groups.forEach(group=>{const c=count(group.group_id),pseudo={rule_id:null,primitive:"group",severity:"error"};if(group.min!==null&&c<group.min)issue(pseudo,"COMPOSITION_GROUP_MIN",{group_id:group.group_id,count:c,min:group.min},`${group.label} requires at least ${group.min}.`);if(group.max!==null&&c>group.max)issue(pseudo,"COMPOSITION_GROUP_MAX",{group_id:group.group_id,count:c,max:group.max},`${group.label} allows at most ${group.max}.`);});
    composition.rules.forEach(rule=>{
      if(rule.primitive==="min_max"){const c=count(rule.subject_id);if(rule.min!==null&&c<rule.min)issue(rule,"COMPOSITION_MIN",{subject_id:rule.subject_id,count:c,min:rule.min},`Minimum ${rule.min} required.`);if(rule.max!==null&&c>rule.max)issue(rule,"COMPOSITION_MAX",{subject_id:rule.subject_id,count:c,max:rule.max},`Maximum ${rule.max} allowed.`);}
      if(rule.primitive==="ratio"){const c=count(rule.subject_id),basis=count(rule.basis_id),cap=Math.floor((basis/rule.basis_per)*rule.max_per+1e-9);if(c>cap)issue(rule,"COMPOSITION_RATIO",{subject_id:rule.subject_id,count:c,basis_id:rule.basis_id,basis_count:basis,cap},`Ratio cap exceeded.`);}
      if(rule.primitive==="point_band"){const band=rule.bands.find(x=>points>=x.min_points&&(x.max_points===null||points<=x.max_points));if(band&&count(rule.subject_id)>band.max)issue(rule,"COMPOSITION_POINT_BAND",{subject_id:rule.subject_id,count:count(rule.subject_id),points_limit:points,max:band.max},`Point-band cap exceeded.`);}
      if(rule.primitive==="prerequisite"&&count(rule.subject_id)>0&&count(rule.target_id)<rule.min_target)issue(rule,"COMPOSITION_PREREQUISITE",{subject_id:rule.subject_id,target_id:rule.target_id,min_target:rule.min_target},`Prerequisite is not satisfied.`);
      if(rule.primitive==="exclusion"){const active=rule.subject_ids.filter(id=>count(id)>0);if(active.length>rule.max_active)issue(rule,"COMPOSITION_EXCLUSION",{active,max_active:rule.max_active},`Mutually exclusive choices are active together.`);}
      if(rule.primitive==="replacement"){const base=count(rule.base_id),replacement=count(rule.replacement_id);if(replacement>base)issue(rule,"COMPOSITION_REPLACEMENT_OVERFLOW",{base_id:rule.base_id,base,replacement_id:rule.replacement_id,replacement},`Replacement count exceeds base count.`);if(rule.mode==="whole_group"&&replacement>0&&replacement!==base)issue(rule,"COMPOSITION_REPLACEMENT_WHOLE_GROUP",{base_id:rule.base_id,base,replacement_id:rule.replacement_id,replacement},`Whole-group replacement must cover the complete base purchase group.`);}
      if(rule.primitive==="uniqueness"&&count(rule.subject_id)>1)issue(rule,"COMPOSITION_UNIQUE",{subject_id:rule.subject_id,count:count(rule.subject_id)},`Unique selection exceeds one.`);
      if(rule.primitive==="host_derived_cap"){const cap=Math.max(0,Math.floor(count(rule.host_id)*rule.per_host+rule.offset));if(count(rule.subject_id)>cap)issue(rule,"COMPOSITION_HOST_CAP",{subject_id:rule.subject_id,count:count(rule.subject_id),host_id:rule.host_id,host_count:count(rule.host_id),cap},`Host-derived cap exceeded.`);}
    });
    return deepFreeze({schema:"mow.builder.composition_evaluation",schema_version:"0.1.0-private",composition_id:composition.composition_id,ok:issues.length===0,issues,context:clone(context||{})});
  }
  function normalizeRelation(input){
    if(!isObject(input))fail("INVALID_RELATION","Relation definition must be an object.");
    return {
      relation_id:requireStableId(input.relation_id,"relation_id"),
      relation_type:requireEnum(input.relation_type,RELATION_TYPES,"relation_type"),
      source_ref:clone(input.source_ref||null),
      target_ref:clone(input.target_ref||null),
      eligibility:clone(input.eligibility||{}),
      limits:clone(input.limits||{}),
      provenance:clone(input.provenance||{}),
      active_default:input.active_default===true,
      extensions:clone(input.extensions||{})
    };
  }
  function normalizeSource(input){
    if(!isObject(input))fail("INVALID_SOURCE","Source metadata must be an object.");
    return {
      source_id:requireStableId(input.source_id,"source_id"),
      package_id:requireStableId(input.package_id,"package_id"),
      title:String(input.title||input.source_id||"").trim(),
      author:String(input.author||"").trim()||null,
      version:String(input.version||"").trim()||null,
      date:String(input.date||"").trim()||null,
      status:String(input.status||"source"),
      notes:String(input.notes||"").trim()||null,
      extensions:clone(input.extensions||{})
    };
  }

  function createRegistry(){
    const maps={
      packages:new Map(),fleets:new Map(),modules:new Map(),profiles:new Map(),relations:new Map(),sources:new Map(),compositions:new Map(),validators:new Map()
    };
    function put(kind,id,value){
      const map=maps[kind],frozen=deepFreeze(clone(value));
      if(map.has(id)){
        const current=map.get(id);
        if(stableJson(current)!==stableJson(frozen))fail("DUPLICATE_ID_CONFLICT",`${kind} identifier '${id}' was registered with different content.`,{kind,id});
        return current;
      }
      map.set(id,frozen);return frozen;
    }
    function registerPackage(value){const v=normalizePackage(value);return put("packages",v.package_id,v);}
    function registerFleet(value){const v=normalizeFleet(value);return put("fleets",v.fleet_id,v);}
    function registerModule(value){const v=normalizeModule(value);return put("modules",v.module_id,v);}
    function registerProfile(value){const v=normalizeProfile(value);return put("profiles",v.profile_id,v);}
    function registerRelation(value){const v=normalizeRelation(value);return put("relations",v.relation_id,v);}
    function registerSource(value){const v=normalizeSource(value);return put("sources",v.source_id,v);}
    function registerComposition(value){const v=normalizeComposition(value);return put("compositions",v.composition_id,v);}
    function registerValidator(value){
      if(!isObject(value)||typeof value.validate!=="function")fail("INVALID_VALIDATOR","Validator registration requires a validate function.");
      const validator_id=requireStableId(value.validator_id,"validator_id");
      const metadata=deepFreeze({validator_id,scopes:Array.isArray(value.scopes)?value.scopes.map(String):[],description:String(value.description||"")});
      if(maps.validators.has(validator_id)){
        const existing=maps.validators.get(validator_id);
        if(stableJson(existing.metadata)!==stableJson(metadata)||existing.validate!==value.validate)fail("DUPLICATE_ID_CONFLICT",`Validator '${validator_id}' was registered twice with different content.`);
        return existing.metadata;
      }
      maps.validators.set(validator_id,{metadata,validate:value.validate});
      return metadata;
    }
    function validateGraph(){
      const errors=[];
      maps.fleets.forEach(v=>{if(!maps.packages.has(v.package_id))errors.push({code:"FLEET_PACKAGE_MISSING",fleet_id:v.fleet_id,package_id:v.package_id});});
      maps.modules.forEach(v=>{
        if(!maps.packages.has(v.package_id))errors.push({code:"MODULE_PACKAGE_MISSING",module_id:v.module_id,package_id:v.package_id});
        v.dependencies.forEach(id=>{if(!maps.modules.has(id))errors.push({code:"MODULE_DEPENDENCY_MISSING",module_id:v.module_id,dependency:id});});
        v.conflicts.forEach(id=>{if(!maps.modules.has(id))errors.push({code:"MODULE_CONFLICT_TARGET_MISSING",module_id:v.module_id,conflict:id});});
      });
      maps.profiles.forEach(v=>{if(!maps.packages.has(v.package_id))errors.push({code:"PROFILE_PACKAGE_MISSING",profile_id:v.profile_id,package_id:v.package_id});});
      maps.sources.forEach(v=>{if(!maps.packages.has(v.package_id))errors.push({code:"SOURCE_PACKAGE_MISSING",source_id:v.source_id,package_id:v.package_id});});
      maps.compositions.forEach(v=>{if(!maps.fleets.has(v.fleet_id))errors.push({code:"COMPOSITION_FLEET_MISSING",composition_id:v.composition_id,fleet_id:v.fleet_id});});
      return deepFreeze({ok:errors.length===0,errors});
    }
    function runValidators(projection,context){
      const issues=[];
      maps.validators.forEach(entry=>{
        try{
          const result=entry.validate(projection,context||{});
          if(Array.isArray(result))result.forEach(issue=>issues.push(Object.assign({validator_id:entry.metadata.validator_id},clone(issue))));
          else if(result&&typeof result==="object")issues.push(Object.assign({validator_id:entry.metadata.validator_id},clone(result)));
        }catch(error){issues.push({validator_id:entry.metadata.validator_id,code:"VALIDATOR_EXCEPTION",severity:"error",message:String(error&&error.message||error)});}
      });
      return deepFreeze(issues);
    }
    function snapshot(){
      const out={schema:"mow.builder.extension_registry",schema_version:"0.1.0-private",build:BUILD,
        packages:Array.from(maps.packages.values()).map(clone),fleets:Array.from(maps.fleets.values()).map(clone),
        modules:Array.from(maps.modules.values()).map(clone),profiles:Array.from(maps.profiles.values()).map(clone),
        relations:Array.from(maps.relations.values()).map(clone),sources:Array.from(maps.sources.values()).map(clone),compositions:Array.from(maps.compositions.values()).map(clone),
        validators:Array.from(maps.validators.values()).map(entry=>clone(entry.metadata))};
      Object.keys(out).forEach(key=>{if(Array.isArray(out[key]))out[key].sort((a,b)=>stableJson(a).localeCompare(stableJson(b)));});
      return deepFreeze(out);
    }
    function reset(){Object.values(maps).forEach(map=>map.clear());}
    return Object.freeze({BUILD,RELATION_TYPES,MODULE_MATURITY,SUPPORT_SCOPES,PURCHASE_SCOPES,NAMEABILITY,COMPOSITION_PRIMITIVES,registerPackage,registerFleet,registerModule,registerProfile,registerRelation,registerSource,registerComposition,registerValidator,normalizeComposition,evaluateComposition,validateGraph,runValidators,snapshot,reset});
  }

  const registry=createRegistry();
  const api=Object.freeze({BUILD,RELATION_TYPES,MODULE_MATURITY,SUPPORT_SCOPES,PURCHASE_SCOPES,NAMEABILITY,COMPOSITION_PRIMITIVES,createRegistry,normalizeComposition,evaluateComposition,registry,stableJson,deepFreeze});
  root.MowExtensionRegistry=api;
  root.MOW_FB_ARCH_01A_EXTENSION_REGISTRY=registry;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
