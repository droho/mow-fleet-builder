(function(root){
  "use strict";

  const BUILD=Object.freeze({work_package:"FB-ARCH-01A",increment:"PHASE-C-CORR3",component:"application_controller",version:"0.10.3-private",product_version:"1.8.1",build:"1.8.1-dev.10.3+fb-arch-01a-phase-c-corr3"});
  const STAGES=Object.freeze(["idle","load","resolve","project","render","bind","ready","stopped","failed"]);
  const PROTECTED_SURFACES=Object.freeze(["application_lifecycle","fleet_setup","character_names","roster","theme","localization","storage","import_export_share","print","validation_presentation","source_module_metadata"]);

  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function deepFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);Object.keys(value).forEach(key=>deepFreeze(value[key]));}return value;}
  function fail(code,message,details){const error=new Error(message);error.name="MowApplicationControllerError";error.code=code;if(details!==undefined)error.details=details;throw error;}
  function createSurfaceRegistry(){
    const owners=new Map(),conflicts=[];
    function claim(surface,ownerId,adapter,options){
      const name=String(surface||"").trim(),owner_id=String(ownerId||"").trim();
      if(!PROTECTED_SURFACES.includes(name))fail("UNKNOWN_SURFACE",`Unknown protected surface '${name}'.`);
      if(!owner_id)fail("OWNER_ID_REQUIRED",`Owner ID is required for '${name}'.`);
      const record=deepFreeze({surface:name,owner_id,available:adapter!=null,adapter_name:String(options&&options.adapter_name||owner_id),transitional:!!(options&&options.transitional),notes:String(options&&options.notes||"")});
      if(owners.has(name)){
        const current=owners.get(name);
        if(current.owner_id!==owner_id){const conflict={surface:name,current_owner:current.owner_id,rejected_owner:owner_id};conflicts.push(conflict);fail("SURFACE_OWNER_CONFLICT",`Protected surface '${name}' already has owner '${current.owner_id}'.`,conflict);}
        return current;
      }
      owners.set(name,record);return record;
    }
    function snapshot(){return deepFreeze({schema:"mow.builder.shared_surface_owners",schema_version:"0.2.0-private",owners:PROTECTED_SURFACES.map(surface=>owners.get(surface)||{surface,owner_id:null,available:false,adapter_name:null,transitional:false,notes:"unclaimed"}),conflicts:clone(conflicts)});}
    function get(surface){return owners.get(String(surface||""))||null;}
    return Object.freeze({claim,get,snapshot,protected_surfaces:PROTECTED_SURFACES});
  }
  function defaultDependencies(target){
    return {
      registry:target.MOW_FB_ARCH_01A_EXTENSION_REGISTRY||null,
      state:target.MOW_FB_ARCH_01A_EXTENSION_STATE||target.MowExtensionState||null,
      projection:target.MOW_FB_ARCH_01A_PROJECTION||target.MowResolvedFleetProjection||null,
      fleetSetup:target.MOW_FB_ARCH_01A_FLEET_SETUP_SURFACE||target.MowFleetSetupSurface||null,
      characterNames:target.MOW_FB_ARCH_01A_CHARACTER_NAMES_SURFACE||target.MowCharacterNamesSurface||null,
      roster:target.MOW_FB_ARCH_01A_ROSTER_SURFACE||target.MowRosterSurface||null,
      print:target.MOW_FB_ARCH_01A_PRINT_SURFACE||target.MowPrintSurface||null,
      themeLocalization:target.MOW_FB_ARCH_01A_THEME_LOCALIZATION_SURFACE||target.MowThemeLocalizationSurface||null,
      storage:target.MOW_FB_ARCH_01A_STORAGE_SURFACE||target.MowStorageSurface||null,
      importExportShare:target.MOW_FB_ARCH_01A_IMPORT_EXPORT_SHARE_SURFACE||target.MowImportExportShareSurface||null,
      validationPresentation:target.MOW_FB_ARCH_01A_VALIDATION_PRESENTATION_SURFACE||target.MowValidationPresentationSurface||null
    };
  }
  function createController(target,provided){
    const host=target||{},doc=host.document||null,deps=Object.assign(defaultDependencies(host),provided||{}),surfaces=createSurfaceRegistry();
    let stage="idle",started=false,bound=false,rebuilding=false,pendingReason=null,currentProjection=null,lastError=null,renderSequence=0;
    const history=[],listeners=[];
    function transition(next,reason){if(!STAGES.includes(next))fail("INVALID_STAGE",`Invalid lifecycle stage '${next}'.`);stage=next;history.push({stage:next,reason:String(reason||""),sequence:history.length+1});}
    function authorityModel(){try{return host.MOW_FLEET_INT1C_STEP83&&typeof host.MOW_FLEET_INT1C_STEP83.getCurrentModel==="function"?host.MOW_FLEET_INT1C_STEP83.getCurrentModel():null;}catch(error){lastError=String(error&&error.message||error);return null;}}
    function claimOwners(){
      surfaces.claim("application_lifecycle","fbarch01a.application_controller",api,{adapter_name:"MowApplicationController"});
      surfaces.claim("fleet_setup","fbarch01a.fleet_setup_surface",deps.fleetSetup,{adapter_name:"MowFleetSetupSurface",transitional:false,notes:"B2 central owner; renders only from ResolvedFleetProjection and binds once through the application lifecycle."});
      surfaces.claim("character_names","fbarch01a.character_names_surface",deps.characterNames,{adapter_name:"MowCharacterNamesSurface",transitional:false,notes:"B3 central owner; renders controls and builder summaries from ResolvedFleetProjection and binds once through the application lifecycle."});
      surfaces.claim("roster","fbarch01a.roster_surface",deps.roster,{adapter_name:"MowRosterSurface",transitional:false,notes:"B4 central owner; writes the hierarchical roster from the immutable ResolvedFleetProjection using the accepted formatter as a pure compatibility adapter."});
      surfaces.claim("theme","fbarch01a.theme_localization_surface",deps.themeLocalization,{adapter_name:"MowThemeLocalizationSurface",transitional:false,notes:"B6 central theme owner."});
      surfaces.claim("localization","fbarch01a.theme_localization_surface",deps.themeLocalization,{adapter_name:"MowThemeLocalizationSurface",transitional:false,notes:"B6 central localization owner."});
      surfaces.claim("storage","fbarch01a.storage_surface",deps.storage,{adapter_name:"MowStorageSurface",transitional:false,notes:"B7 central owner; starts persistence migration/restore/autosave binding exactly once while retaining accepted persistence services."});
      surfaces.claim("import_export_share","fbarch01a.import_export_share_surface",deps.importExportShare,{adapter_name:"MowImportExportShareSurface",transitional:false,notes:"B8 central owner; owns shared action presentation and import/export/share event routing while retaining accepted business services."});
      surfaces.claim("print","fbarch01a.print_surface",deps.print,{adapter_name:"MowPrintSurface",transitional:false,notes:"B5 central owner; projects the central roster text into the print-only presentation node and binds once without timers or observers."});
      surfaces.claim("validation_presentation","fbarch01a.validation_presentation_surface",deps.validationPresentation,{adapter_name:"MowValidationPresentationSurface",transitional:false,notes:"B9 central owner; renders Live Checks/filter presentation and Wizard description from bounded compatibility/validator inputs without business DOM ownership."});
      surfaces.claim("source_module_metadata","fbarch01a.resolved_projection",deps.projection||null,{adapter_name:"MowResolvedFleetProjection"});
    }
    function resolve(reason){
      const model=authorityModel();
      const registrySnapshot=deps.registry&&typeof deps.registry.snapshot==="function"?deps.registry.snapshot():{packages:[],fleets:[],modules:[],profiles:[],relations:[],sources:[],validators:[]};
      const extensionState=deps.state&&typeof deps.state.fromModel==="function"?deps.state.fromModel(model,{now:"1970-01-01T00:00:00.000Z"}):null;
      return {model,registrySnapshot,extensionState,reason};
    }
    function buildProjection(resolved){
      if(!deps.projection||typeof deps.projection.build!=="function")fail("PROJECTION_UNAVAILABLE","Resolved projection component is unavailable.");
      let projection=deps.projection.build({model:resolved.model,registry_snapshot:resolved.registrySnapshot,extension_state:resolved.extensionState,reason:resolved.reason,generated_at:null});
      if(deps.registry&&typeof deps.registry.runValidators==="function"&&typeof deps.projection.withValidation==="function")projection=deps.projection.withValidation(projection,deps.registry.runValidators(projection,{reason:resolved.reason}));
      return projection;
    }
    function renderSurfaces(projection,reason){
      if(!deps.themeLocalization||typeof deps.themeLocalization.render!=="function")fail("THEME_LOCALIZATION_SURFACE_UNAVAILABLE","Central theme/localization surface is unavailable.");
      deps.themeLocalization.render(projection,{reason:String(reason||"")});
      if(!deps.storage||typeof deps.storage.render!=="function")fail("STORAGE_SURFACE_UNAVAILABLE","Central storage surface is unavailable.");
      deps.storage.render(projection,{reason:String(reason||"")});
      if(!deps.importExportShare||typeof deps.importExportShare.render!=="function")fail("IMPORT_EXPORT_SHARE_SURFACE_UNAVAILABLE","Central import/export/share surface is unavailable.");
      deps.importExportShare.render(projection,{reason:String(reason||"")});
      if(!deps.validationPresentation||typeof deps.validationPresentation.render!=="function")fail("VALIDATION_PRESENTATION_SURFACE_UNAVAILABLE","Central validation presentation surface is unavailable.");
      deps.validationPresentation.render(projection,{reason:String(reason||"")});
      if(!deps.fleetSetup||typeof deps.fleetSetup.render!=="function")fail("FLEET_SETUP_SURFACE_UNAVAILABLE","Central Fleet Setup surface is unavailable.");
      deps.fleetSetup.render(projection,{reason:String(reason||"")});
      if(!deps.characterNames||typeof deps.characterNames.render!=="function")fail("CHARACTER_NAMES_SURFACE_UNAVAILABLE","Central Character Names surface is unavailable.");
      deps.characterNames.render(projection,{reason:String(reason||"")});
      if(!deps.roster||typeof deps.roster.render!=="function")fail("ROSTER_SURFACE_UNAVAILABLE","Central roster surface is unavailable.");
      deps.roster.render(projection,{reason:String(reason||"")});
      if(!deps.print||typeof deps.print.render!=="function")fail("PRINT_SURFACE_UNAVAILABLE","Central print surface is unavailable.");
      deps.print.render(projection,{reason:String(reason||"")});renderSequence+=1;return projection;
    }
    function publish(projection,reason){
      currentProjection=projection;host.MOW_FB_ARCH_01A_CURRENT_PROJECTION=projection;
      if(doc&&typeof doc.dispatchEvent==="function"){
        const EventCtor=host.CustomEvent||function(type,init){this.type=type;this.detail=init&&init.detail;};
        doc.dispatchEvent(new EventCtor("mow:fbarchprojectionchange",{detail:{reason:String(reason||""),fingerprint:projection&&projection.fingerprint||null,revision:projection&&projection.official&&projection.official.revision||0,render_sequence:renderSequence}}));
      }
      return projection;
    }
    function rebuild(reason){
      const why=String(reason||"explicit");
      if(rebuilding){pendingReason=why;return currentProjection;}
      rebuilding=true;
      try{const resolved=resolve(why),projection=buildProjection(resolved);renderSurfaces(projection,why);publish(projection,why);}
      catch(error){lastError=String(error&&error.message||error);transition("failed",why);throw error;}
      finally{rebuilding=false;}
      if(pendingReason){const next=pendingReason;pendingReason=null;return rebuild(next);}return currentProjection;
    }
    function addListener(type,handler,options){if(!doc||typeof doc.addEventListener!=="function")return;doc.addEventListener(type,handler,options);listeners.push({type,handler,options});}
    function bind(){
      if(bound)return;
      if(!deps.themeLocalization||typeof deps.themeLocalization.bind!=="function")fail("THEME_LOCALIZATION_BIND_UNAVAILABLE","Central theme/localization bind adapter is unavailable.");
      deps.themeLocalization.bind({controller:api});
      if(!deps.storage||typeof deps.storage.bind!=="function")fail("STORAGE_BIND_UNAVAILABLE","Central storage bind adapter is unavailable.");
      deps.storage.bind({controller:api});
      if(!deps.importExportShare||typeof deps.importExportShare.bind!=="function")fail("IMPORT_EXPORT_SHARE_BIND_UNAVAILABLE","Central import/export/share bind adapter is unavailable.");
      deps.importExportShare.bind({controller:api});
      if(!deps.validationPresentation||typeof deps.validationPresentation.bind!=="function")fail("VALIDATION_PRESENTATION_BIND_UNAVAILABLE","Central validation presentation bind adapter is unavailable.");
      deps.validationPresentation.bind({controller:api});
      if(!deps.fleetSetup||typeof deps.fleetSetup.bind!=="function")fail("FLEET_SETUP_BIND_UNAVAILABLE","Central Fleet Setup bind adapter is unavailable.");
      deps.fleetSetup.bind({controller:api});
      if(!deps.characterNames||typeof deps.characterNames.bind!=="function")fail("CHARACTER_NAMES_BIND_UNAVAILABLE","Central Character Names bind adapter is unavailable.");
      deps.characterNames.bind({controller:api});
      if(!deps.roster||typeof deps.roster.bind!=="function")fail("ROSTER_BIND_UNAVAILABLE","Central roster bind adapter is unavailable.");
      deps.roster.bind({controller:api});
      if(!deps.print||typeof deps.print.bind!=="function")fail("PRINT_BIND_UNAVAILABLE","Central print bind adapter is unavailable.");
      deps.print.bind({controller:api});
      addListener("mow:nativefleetmodelchange",()=>rebuild("native_model_change"));
      addListener("mow:shipnameschange",()=>rebuild("ship_names_change"));
      addListener("mow:wizardmasterymodulechange",()=>rebuild("module_change"));
      bound=true;
    }
    function start(){
      if(started)return api;started=true;
      try{
        transition("load","start");claimOwners();
        transition("resolve","start");const resolved=resolve("initial");
        transition("project","start");const projection=buildProjection(resolved);
        transition("render","start");renderSurfaces(projection,"initial");publish(projection,"initial");
        transition("bind","start");bind();
        transition("ready","start");
        try{host.MowBootGate?.markControllerReady?.({stage:"ready",build:BUILD.build});}catch(error){lastError=String(error&&error.message||error);}
      }catch(error){lastError=String(error&&error.message||error);if(stage!=="failed")transition("failed","start");try{host.MowBootGate?.failOpen?.("controller_failed",lastError);}catch(e){}throw error;}return api;
    }
    function stop(){
      if(doc&&typeof doc.removeEventListener==="function")listeners.splice(0).forEach(item=>doc.removeEventListener(item.type,item.handler,item.options));
      bound=false;started=false;transition("stopped","stop");return true;
    }
    function status(){return deepFreeze({build:BUILD,stage,started,bound,history:clone(history),last_error:lastError,render_sequence:renderSequence,projection_fingerprint:currentProjection&&currentProjection.fingerprint||null,official_revision:currentProjection&&currentProjection.official&&currentProjection.official.revision||0,surfaces:surfaces.snapshot(),fleet_setup:deps.fleetSetup&&typeof deps.fleetSetup.status==="function"?deps.fleetSetup.status():null,character_names:deps.characterNames&&typeof deps.characterNames.status==="function"?deps.characterNames.status():null,roster:deps.roster&&typeof deps.roster.status==="function"?deps.roster.status():null,print:deps.print&&typeof deps.print.status==="function"?deps.print.status():null,theme_localization:deps.themeLocalization&&typeof deps.themeLocalization.status==="function"?deps.themeLocalization.status():null,storage:deps.storage&&typeof deps.storage.status==="function"?deps.storage.status():null,import_export_share:deps.importExportShare&&typeof deps.importExportShare.status==="function"?deps.importExportShare.status():null,validation_presentation:deps.validationPresentation&&typeof deps.validationPresentation.status==="function"?deps.validationPresentation.status():null});}
    const api=Object.freeze({BUILD,start,stop,rebuild,status,currentProjection:()=>currentProjection,surfaceOwners:()=>surfaces.snapshot(),surfaceRegistry:surfaces});
    return api;
  }

  const controller=createController(root);
  const api=Object.freeze({BUILD,STAGES,PROTECTED_SURFACES,createSurfaceRegistry,createController,controller,start:()=>controller.start(),status:()=>controller.status(),currentProjection:()=>controller.currentProjection(),surfaceOwners:()=>controller.surfaceOwners(),rebuild:reason=>controller.rebuild(reason)});
  root.MowApplicationController=api;root.MOW_FB_ARCH_01A_PHASE_C_CORR3=api;root.MOW_FB_ARCH_01A_PHASE_C_CORR2=api;root.MOW_FB_ARCH_01A_PHASE_C_CORR1=api;root.MOW_FB_ARCH_01A_B10=api;root.MOW_FB_ARCH_01A_B9=api;root.MOW_FB_ARCH_01A_B8=api;root.MOW_FB_ARCH_01A_B7=api;root.MOW_FB_ARCH_01A_B6=api;root.MOW_FB_ARCH_01A_B5=api;root.MOW_FB_ARCH_01A_B4=api;root.MOW_FB_ARCH_01A_B3=api;root.MOW_FB_ARCH_01A_B2=api;root.MOW_FB_ARCH_01A_B1=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",()=>controller.start(),{once:true});else controller.start();}
})(typeof window!=="undefined"?window:globalThis);
