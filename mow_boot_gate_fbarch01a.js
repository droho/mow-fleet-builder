(function(root){
  "use strict";
  const BUILD=Object.freeze({work_package:"FB-ARCH-01A",increment:"PHASE-C-CORR3",component:"boot_gate",version:"0.3.0-private",product_version:"1.8.1",build:"1.8.1-dev.10.3+fb-arch-01a-phase-c-corr3"});
  root.MOW_FB_ARCH_01A_CENTRAL_STARTUP_STABILIZATION=true;
  const doc=root.document,html=doc&&doc.documentElement;
  let state="booting",controllerReady=false,storageReady=false,released=false,failedOpen=false,releaseReason=null;
  let controllerReadyAt=null,storageReadyAt=null,releasedAt=null;
  const startedAt=(root.performance&&typeof root.performance.now==="function")?root.performance.now():Date.now();
  function now(){return (root.performance&&typeof root.performance.now==="function")?root.performance.now():Date.now();}
  function stamp(name,value){try{if(html)html.dataset[name]=String(value);}catch(e){}}
  function emit(type,detail){try{doc&&doc.dispatchEvent(new root.CustomEvent(type,{detail:detail||{}}));}catch(e){}}
  function reveal(reason,failed){
    if(released)return status();
    released=true;failedOpen=!!failed;state=failed?"failed-open":"ready";releaseReason=String(reason||state);releasedAt=now();
    try{html&&html.classList.remove("fbarch01a-booting");}catch(e){}
    try{html&&html.classList.add(failed?"fbarch01a-boot-failed":"fbarch01a-boot-ready");}catch(e){}
    stamp("fbarchBootState",state);stamp("fbarchBootReason",releaseReason);
    emit("mow:fbarchbootreleased",{ok:!failed,state,reason:releaseReason,status:status()});
    return status();
  }
  function maybeRelease(reason){
    if(released||!controllerReady||!storageReady)return status();
    const run=()=>reveal(reason||"controller_and_storage_ready",false);
    if(typeof root.requestAnimationFrame==="function")root.requestAnimationFrame(run);else run();
    return status();
  }
  function markControllerReady(detail){
    if(released)return status();controllerReady=true;controllerReadyAt=now();stamp("fbarchControllerReady","true");emit("mow:fbarchbootcontrollerready",detail||{});return maybeRelease("controller_and_storage_ready");
  }
  function markStorageReady(detail){
    if(released)return status();
    if(detail&&detail.ok===false)return failOpen("storage_error",detail.error||null);
    storageReady=true;storageReadyAt=now();stamp("fbarchStorageReady","true");return maybeRelease("controller_and_storage_ready");
  }
  function failOpen(reason,error){
    if(released)return status();
    stamp("fbarchBootError",error?String(error):"");
    return reveal(reason||"fail_open",true);
  }
  function status(){return Object.freeze({build:BUILD,state,started_at:startedAt,controller_ready:controllerReady,controller_ready_at:controllerReadyAt,storage_ready:storageReady,storage_ready_at:storageReadyAt,released,released_at:releasedAt,failed_open:failedOpen,release_reason:releaseReason,html_gate_active:!!(html&&html.classList.contains("fbarch01a-booting")),central_startup_stabilization:!!root.MOW_FB_ARCH_01A_CENTRAL_STARTUP_STABILIZATION});}
  if(html){html.classList.add("fbarch01a-booting");stamp("fbarchBootState","booting");}
  if(doc)doc.addEventListener("mow:fbarchstorageready",event=>markStorageReady(event&&event.detail||{}),{once:true});
  root.addEventListener&&root.addEventListener("error",event=>{
    if(released)return;
    const target=event&&event.target;
    /* Resource-load failure is deterministic evidence that the central runtime cannot complete.
       Do not fail-open on arbitrary legacy runtime errors/rejections: a non-fatal compatibility
       error must not expose the pre-central view while the controller can still reach ready. */
    if(target&&target!==root&&(target.tagName==="SCRIPT"||target.tagName==="LINK"))failOpen("resource_error",target.src||target.href||target.tagName);
  },true);
  root.addEventListener&&root.addEventListener("load",()=>{if(!released&&!controllerReady)failOpen("window_load_without_controller_ready",null);},{once:true});
  const api=Object.freeze({BUILD,markControllerReady,markStorageReady,maybeRelease,failOpen,status});
  root.MowBootGate=api;root.MOW_FB_ARCH_01A_BOOT_GATE=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
