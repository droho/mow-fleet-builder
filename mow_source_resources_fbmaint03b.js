/* FB-MAINT-03 / MAINT03B — presentation-only external rules & game-resources action. */
(function(root){
  "use strict";
  const BUILD=Object.freeze({work_package:"FB-MAINT-03",stage:"MAINT03B",component:"source_resources",version:"0.1.0-private",build:"1.8.1-dev.12.1+fb-maint-03-maint03b-r2",owner:"fbmaint03b.source_resources"});
  const ACTION_ID="rules_game_resources";
  const URL="https://krakenswake.wordpress.com/2024/03/03/print-and-play/";
  let registered=false,lastError=null;
  function label(){return root.MOW_I18N?.getLang?.()==="en"?"Rules & game resources ↗":"Zasady i materiały do gry ↗";}
  function invoke(){
    try{
      const popup=root.open?.(URL,"_blank","noopener,noreferrer");
      try{if(popup)popup.opener=null;}catch(_){/* best effort only */}
      lastError=null;
      return Object.freeze({ok:true,external:true,url:URL,popup_opened:!!popup});
    }catch(error){
      lastError=String(error&&error.message||error);
      console.warn("[FB-MAINT-03B] External resource link could not be opened.",error);
      return Object.freeze({ok:false,external:true,url:URL,error:lastError});
    }
  }
  function register(){
    const surface=root.MowImportExportShareSurface;
    if(!surface||typeof surface.registerAction!=="function")throw new Error("MowImportExportShareSurface.registerAction is unavailable.");
    const existing=surface.actionRegistry?.().external_actions?.find(x=>x.id===ACTION_ID);
    if(existing){
      if(existing.owner!==BUILD.owner)throw new Error(`Action '${ACTION_ID}' is already owned by '${existing.owner}'.`);
      registered=true;return existing;
    }
    const action=surface.registerAction({id:ACTION_ID,owner:BUILD.owner,order:460,label,invoke});
    registered=true;return action;
  }
  function status(){return Object.freeze({build:BUILD,registered,action_id:ACTION_ID,url:URL,last_error:lastError,runtime_dependency:false});}
  const api=Object.freeze({BUILD,ACTION_ID,URL,label,invoke,register,status});
  root.MowSourceResourcesFBMaint03B=api;root.MOW_FB_MAINT_03B_SOURCE_RESOURCES=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root.document)register();
})(typeof window!=="undefined"?window:globalThis);
