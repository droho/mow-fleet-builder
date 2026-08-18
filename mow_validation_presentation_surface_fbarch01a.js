(function(root){
  "use strict";
  const BUILD=Object.freeze({work_package:"FB-ARCH-01A",increment:"B9",component:"validation_presentation_surface",version:"0.1.0-private",build:"1.8.1-dev.9+fb-arch-01a-b9"});
  const OWNER_ID="fbarch01a.validation_presentation_surface";
  const FILTER_KEY="mow_checks_filter";
  let mounted=false,bound=false,renderCount=0,bindCount=0,lastReason="",controller=null,currentProjection=null,lastError=null;
  let mode="fail";

  function doc(){return root.document||null;}
  function clean(value){return String(value==null?"":value);}
  function i18n(){return root.MOW_I18N||null;}
  function lang(){try{return i18n()?.getLang?.()==="en"?"en":"pl";}catch(e){return "pl";}}
  function labelAll(){return lang()==="en"?"All":"OK";}
  function labelFail(){return lang()==="en"?"Only FAIL":"Tylko FAIL";}
  function loadMode(){try{const v=root.localStorage?.getItem(FILTER_KEY);mode=v==="all"?"all":"fail";}catch(e){mode="fail";}return mode;}
  function saveMode(){try{root.localStorage?.setItem(FILTER_KEY,mode);}catch(e){}return mode;}
  function legacyItems(projection){
    const surface=projection&&projection.surface_models&&projection.surface_models.validation_presentation;
    return Array.isArray(surface&&surface.items)?surface.items.map(item=>({text:clean(item&&item.text),statusText:clean(item&&item.statusText),klass:clean(item&&item.klass)})):[];
  }
  function extensionIssues(projection){
    const issues=Array.isArray(projection&&projection.validation&&projection.validation.issues)?projection.validation.issues:[];
    return issues.map(issue=>{
      const severity=clean(issue&&issue.severity).toLowerCase();
      const klass=severity==="error"||severity==="fatal"?"fail":severity==="warning"||severity==="warn"?"warn":"ok";
      const statusText=klass==="fail"?"FAIL":klass==="warn"?"WARN":"OK";
      const message=clean(issue&&issue.message)||clean(issue&&issue.code)||"Validation issue";
      return {text:message,statusText,klass,extension:true,validator_id:clean(issue&&issue.validator_id)};
    });
  }
  function ensureControls(){
    const d=doc(),host=d&&d.getElementById("checksCtl");if(!host)return false;
    let failCount=d.getElementById("failCount"),all=d.getElementById("chkAll"),fail=d.getElementById("chkFail");
    if(!failCount||!all||!fail){
      host.innerHTML='';
      failCount=d.createElement("span");failCount.className="failCount";failCount.id="failCount";
      all=d.createElement("button");all.type="button";all.className="filterBtn";all.id="chkAll";
      fail=d.createElement("button");fail.type="button";fail.className="filterBtn";fail.id="chkFail";
      host.append(failCount,all,fail);
    }
    [failCount,all,fail].forEach(el=>{el.dataset.fbarchOwner=OWNER_ID;});
    all.textContent=labelAll();fail.textContent=labelFail();
    return true;
  }
  function isFailRow(item){return clean(item&&item.klass).toLowerCase()==="fail"||clean(item&&item.statusText).trim().toUpperCase()==="FAIL";}
  function renderRows(items){
    const d=doc(),host=d&&d.getElementById("checks");if(!host)return {count:0,fail_count:0};
    host.innerHTML="";let failCount=0;
    items.forEach(item=>{
      const fail=isFailRow(item);if(fail)failCount+=1;
      const row=d.createElement("div");row.className=`check ${clean(item.klass)}`.trim();row.dataset.fbarchOwner=OWNER_ID;if(item.extension)row.dataset.fbarchValidationSource="extension";
      const text=d.createElement("div");text.className="check-text";text.textContent=clean(item.text);
      const pill=d.createElement("div");pill.className=`check-pill ${clean(item.klass)}`.trim();pill.textContent=clean(item.statusText);
      row.append(text,pill);row.style.display=mode==="fail"&&!fail?"none":"";host.appendChild(row);
    });
    try{i18n()?.refresh?.(host);}catch(e){}
    const count=d.getElementById("failCount"),all=d.getElementById("chkAll"),fail=d.getElementById("chkFail");
    if(count){count.textContent=`FAIL: ${failCount}`;if(failCount===0){count.style.background="color-mix(in srgb, var(--ok-color) 15%, rgba(0,0,0,0.14))";count.style.borderColor="color-mix(in srgb, var(--ok-color) 35%, rgba(255,255,255,0.18))";count.style.color="color-mix(in srgb, var(--ok-color) 80%, white)";}else{count.style.background="";count.style.borderColor="";count.style.color="";}}
    all?.classList.toggle("active",mode==="all");fail?.classList.toggle("active",mode==="fail");
    return {count:items.length,fail_count:failCount};
  }
  function projectWizard(){try{return root.MOW_FBMAINT02C_PROJECTION?.project?.()!==false;}catch(error){lastError=String(error&&error.message||error);return false;}}
  function render(projection,options){
    currentProjection=projection||currentProjection;lastReason=String(options&&options.reason||"");if(!ensureControls())return status();
    const items=legacyItems(currentProjection).concat(extensionIssues(currentProjection));renderRows(items);projectWizard();mounted=true;renderCount+=1;return status();
  }
  function onClick(event){const target=event&&event.target&&event.target.closest&&event.target.closest("#chkAll,#chkFail");if(!target)return;mode=target.id==="chkAll"?"all":"fail";saveMode();render(currentProjection,{reason:"validation_filter"});}
  function onLegacyValidationChange(){if(controller?.rebuild)controller.rebuild("validation_compatibility_change");else render(currentProjection,{reason:"validation_compatibility_change"});}
  function onLanguageChange(){render(currentProjection,{reason:"validation_language_change"});}
  function bind(context){if(bound)return status();const d=doc();if(!d)throw new Error("Central validation presentation surface requires document.");controller=context&&context.controller||null;loadMode();d.addEventListener("click",onClick,false);d.addEventListener("mow:legacyvalidationchange",onLegacyValidationChange,false);d.addEventListener("mow:languagechange",onLanguageChange,false);bound=true;bindCount+=1;return status();}
  function status(){
    const d=doc(),surface=currentProjection&&currentProjection.surface_models&&currentProjection.surface_models.validation_presentation,issues=Array.isArray(currentProjection&&currentProjection.validation&&currentProjection.validation.issues)?currentProjection.validation.issues:[];
    return Object.freeze({build:BUILD,owner_id:OWNER_ID,mounted,bound,render_count:renderCount,bind_count:bindCount,last_reason:lastReason,mode,projection_revision:Number(currentProjection&&currentProjection.official&&currentProjection.official.revision||0),captured_checks:Number(surface&&surface.count||0),extension_issue_count:issues.length,rendered_row_count:d?.querySelectorAll?.(`#checks .check[data-fbarch-owner="${OWNER_ID}"]`)?.length||0,fail_count:Number(clean(d?.getElementById?.("failCount")?.textContent).replace(/\D+/g,""))||0,filter_controls:d?.querySelectorAll?.(`#checksCtl [data-fbarch-owner="${OWNER_ID}"]`)?.length||0,legacy_core_validation_autonomous:root.MOW_VALIDATION_PRESENTATION_SERVICE?.autonomous!==false,legacy_filter_autonomous:root.MOW_LEGACY_CHECK_FILTER?.autonomous!==false,legacy_wizard_projection_autonomous:root.MOW_FBMAINT02C_PROJECTION?.autonomous!==false,last_error:lastError});
  }
  const api=Object.freeze({BUILD,OWNER_ID,render,bind,status});
  root.MowValidationPresentationSurface=api;root.MOW_FB_ARCH_01A_VALIDATION_PRESENTATION_SURFACE=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
