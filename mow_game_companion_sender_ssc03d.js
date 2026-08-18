/* GC-SSC-03 / SSC03D — delegated Fleet Builder -> Game Companion sender integration. */
(function(root){
  "use strict";
  const CONFIG=Object.freeze({"mode":"production","source_origin":"https://mowfleetbuilder.com","target_origin":"https://game-companion.mowfleetbuilder.com","target_url":"https://game-companion.mowfleetbuilder.com/?handoff=1","producer_app":"Man O' War Fleet Builder","receiver_app":"Man O' War Game Companion","offer_ttl_seconds":300,"future_clock_skew_seconds":60,"ready_timeout_seconds":15,"sender_result_timeout_minutes":31});
  const BUILD=Object.freeze({
    work_package:"GC-SSC-03",stage:"SSC03D",component:"fleet_builder_sender",version:"0.1.0-private",
    product_version:"1.8.1",build:"1.8.1-dev.11.2+gc-ssc-03-ssc03d-r5",owner:"gc-ssc-03.ssc03d"
  });
  const ACTION_ID="open_in_game_companion";
  const READY_TYPE="mow.gc.handoff.ready";
  const OFFER_TYPE="mow.gc.fleet_handoff.offer";
  const RESULT_TYPE="mow.gc.fleet_handoff.result";
  const VERSION="1.0.0";
  const MEDIA_TYPE="application/vnd.mow.fleet+json";
  const NONCE=/^[A-Za-z0-9_-]{22,86}$/;
  const RESULT_STATES=new Set(["received","cancelled","rejected","expired","committed"]);
  const TEXT=Object.freeze({
    en:Object.freeze({
      label:"Open in Game Companion",
      opening:"Opening Game Companion…",
      waiting:"Waiting for the secure Game Companion handshake…",
      sent:"Fleet offer sent securely. Waiting for Game Companion to prepare the review…",
      received:"Fleet received by Game Companion. Review it in the Game Companion window.",
      committed:"Fleet accepted by Game Companion.",
      cancelled:"Game Companion handoff cancelled. Your Builder fleet was not changed.",
      rejected:"Game Companion rejected the handoff.",
      expired:"Game Companion handoff expired. Your Builder fleet was not changed.",
      unavailable:"Game Companion could not be opened. The normal file export is available instead.",
      origin:"Secure browser handoff is available only from mowfleetbuilder.com. Use the normal file export in this local/review copy.",
      notOfficial:"This fleet is not admitted for Game Companion browser handoff. Use the normal file export if you need a portable copy.",
      exportBlocked:"The canonical builder_export document is not ready. Review the existing Export fleet report before sending it to Game Companion.",
      active:"A Game Companion handoff is already open. Finish or close that window before starting another one.",
      protocol:"Game Companion returned an incompatible handoff response. Use the normal file export instead.",
      fallback:"Opening the existing Export fleet fallback."
    }),
    pl:Object.freeze({
      label:"Otwórz w Game Companionie",
      opening:"Otwieranie Game Companiona…",
      waiting:"Oczekiwanie na bezpieczny handshake Game Companiona…",
      sent:"Oferta floty została bezpiecznie wysłana. Oczekiwanie na przygotowanie przeglądu w Game Companionie…",
      received:"Flota została odebrana przez Game Companion. Sprawdź ją w oknie Game Companiona.",
      committed:"Flota została przyjęta przez Game Companion.",
      cancelled:"Przekazanie do Game Companiona anulowano. Flota w Builderze nie została zmieniona.",
      rejected:"Game Companion odrzucił przekazanie floty.",
      expired:"Przekazanie do Game Companiona wygasło. Flota w Builderze nie została zmieniona.",
      unavailable:"Nie udało się otworzyć Game Companiona. Zamiast tego możesz użyć zwykłego eksportu do pliku.",
      origin:"Bezpieczne przekazanie przez przeglądarkę działa wyłącznie z mowfleetbuilder.com. W tej lokalnej/testowej kopii użyj zwykłego eksportu do pliku.",
      notOfficial:"Ta flota nie jest dopuszczona do przekazania przez przeglądarkę do Game Companiona. W razie potrzeby użyj zwykłego eksportu do pliku.",
      exportBlocked:"Kanoniczny dokument builder_export nie jest gotowy. Przed wysłaniem do Game Companiona sprawdź istniejący raport Eksportuj flotę.",
      active:"Przekazanie do Game Companiona jest już otwarte. Zakończ albo zamknij tamto okno przed rozpoczęciem kolejnego.",
      protocol:"Game Companion zwrócił niezgodną odpowiedź protokołu. Użyj zwykłego eksportu do pliku.",
      fallback:"Otwieram istniejący Eksport floty jako rozwiązanie awaryjne."
    })
  });
  let active=null,registered=false,lastResult=null,lastError=null,statusTimer=null;
  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function language(){try{return root.MOW_I18N?.getLang?.()==="en"?"en":"pl";}catch(_){return "pl";}}
  function tr(key){return TEXT[language()]?.[key]||TEXT.en[key]||key;}
  function exactKeys(obj,keys){return !!obj&&typeof obj==="object"&&!Array.isArray(obj)&&Object.keys(obj).every(key=>keys.includes(key));}
  function iso(ms){return new Date(ms).toISOString();}
  function parseTime(value){const n=Date.parse(value);return Number.isFinite(n)?n:null;}
  function uuid(){
    if(root.crypto?.randomUUID)return root.crypto.randomUUID();
    const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
    const h=Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
    return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
  }
  function injectUi(){
    const d=root.document;if(!d||d.getElementById("mowGcSsc03dStyle"))return;
    const style=d.createElement("style");style.id="mowGcSsc03dStyle";style.textContent=`
      #mowGcSsc03dStatus{position:fixed;right:16px;bottom:16px;z-index:2147483000;max-width:min(430px,calc(100vw - 32px));padding:12px 14px;border:1px solid var(--stroke,#41546a);border-radius:12px;background:var(--card,#111c28);color:var(--text,#edf4fb);box-shadow:0 12px 32px rgba(0,0,0,.35);font:600 12px/1.45 var(--font-main,system-ui,sans-serif)}
      #mowGcSsc03dStatus[data-kind="ok"]{border-color:#4a8964}#mowGcSsc03dStatus[data-kind="error"]{border-color:#a75d68}#mowGcSsc03dStatus[data-kind="info"]{border-color:var(--accent,#5aa8ff)}
      #mowGcSsc03dStatus strong{display:block;margin-bottom:3px;font-size:13px}#mowGcSsc03dStatus code{font:inherit;font-family:var(--mono,monospace);opacity:.9}`;
    d.head.appendChild(style);
  }
  function showStatus(kind,message,detail="",ttl=9000){
    const d=root.document;if(!d)return;injectUi();let box=d.getElementById("mowGcSsc03dStatus");if(!box){box=d.createElement("div");box.id="mowGcSsc03dStatus";box.setAttribute("role","status");box.setAttribute("aria-live","polite");d.body.appendChild(box);}box.dataset.kind=kind;box.innerHTML="";const strong=d.createElement("strong");strong.textContent=String(message||"");box.appendChild(strong);if(detail){const span=d.createElement("span");span.textContent=String(detail);box.appendChild(span);}box.hidden=false;if(statusTimer)clearTimeout(statusTimer);if(ttl>0)statusTimer=setTimeout(()=>{box.hidden=true;},ttl);
  }
  function fallback(io,message,detail=""){
    showStatus("error",message,detail?`${detail} ${tr("fallback")}`:tr("fallback"),12000);
    try{io?.openCentralExport?.();}catch(error){lastError=String(error?.message||error);}
  }
  function currentOfficialProjection(projection){
    const fleet=projection?.registry?.current_fleet,official=projection?.official;
    return !!(projection?.ready&&official?.available&&official.schema==="mow.fleet"&&official.schema_version==="0.1.2"&&fleet?.official===true&&["portable","cross_tool"].includes(String(fleet.support_scope||"")));
  }
  function buildDescriptor(context){
    const model=context?.projection?.surface_models?.fleet_setup?.model;
    if(!model)throw Object.assign(new Error("Central fleet model projection is unavailable."),{code:"CENTRAL_MODEL_UNAVAILABLE"});
    const descriptor=context?.io?.buildExportDocument?.(model,"builder_export");
    if(!descriptor||descriptor.profile!=="builder_export"||descriptor.document?.schema!=="mow.fleet"||descriptor.document?.schema_version!=="0.1.2")throw Object.assign(new Error("Canonical builder_export generation failed."),{code:"CANONICAL_EXPORT_FAILED"});
    return descriptor;
  }
  function readyValidation(event,popup,nowMs){
    if(event.origin!==CONFIG.target_origin)return{ok:false,code:"READY_ORIGIN_MISMATCH"};
    if(event.source!==popup)return{ok:false,code:"READY_SOURCE_MISMATCH"};
    const msg=event.data;
    if(!exactKeys(msg,["type","version","receiver","receiver_nonce","issued_at","expires_at"]))return{ok:false,code:"READY_SHAPE_INVALID"};
    if(msg.type!==READY_TYPE||msg.version!==VERSION)return{ok:false,code:"READY_PROTOCOL_MISMATCH"};
    if(!exactKeys(msg.receiver,["app","version","build","origin"])||msg.receiver.app!==CONFIG.receiver_app||msg.receiver.origin!==CONFIG.target_origin||typeof msg.receiver.version!=="string"||!msg.receiver.version||typeof msg.receiver.build!=="string"||!msg.receiver.build)return{ok:false,code:"READY_RECEIVER_INVALID"};
    if(!NONCE.test(String(msg.receiver_nonce||"")))return{ok:false,code:"READY_NONCE_INVALID"};
    const issued=parseTime(msg.issued_at),expires=parseTime(msg.expires_at);
    if(issued===null||expires===null||expires<=issued||expires-issued>CONFIG.offer_ttl_seconds*1000||issued>nowMs+CONFIG.future_clock_skew_seconds*1000||nowMs>expires)return{ok:false,code:"READY_TIME_INVALID"};
    return{ok:true,message:msg,issued,expires};
  }
  function resultValidation(event,transfer){
    if(event.origin!==CONFIG.target_origin||event.source!==transfer.popup)return{ok:false,ignore:true};
    const msg=event.data;if(!msg||msg.type!==RESULT_TYPE)return{ok:false,ignore:true};
    if(!exactKeys(msg,["type","version","handoff_id","receiver_nonce","status","code","at"]))return{ok:false,code:"RESULT_SHAPE_INVALID"};
    if(msg.version!==VERSION||msg.handoff_id!==transfer.handoffId||msg.receiver_nonce!==transfer.receiverNonce||!RESULT_STATES.has(msg.status)||parseTime(msg.at)===null)return{ok:false,code:"RESULT_BINDING_INVALID"};
    return{ok:true,message:msg};
  }
  function offerFrom(document,ready,nowMs,handoffId){
    const expires=Math.min(nowMs+CONFIG.offer_ttl_seconds*1000,parseTime(ready.expires_at)||nowMs+CONFIG.offer_ttl_seconds*1000);
    return{
      type:OFFER_TYPE,version:VERSION,handoff_id:handoffId,receiver_nonce:ready.receiver_nonce,created_at:iso(nowMs),expires_at:iso(expires),
      producer:{app:CONFIG.producer_app,version:BUILD.product_version,build:BUILD.build,origin:CONFIG.source_origin},
      target:{app:CONFIG.receiver_app,origin:CONFIG.target_origin},ruleset_ref:clone(document.ruleset_ref),
      payload:{media_type:MEDIA_TYPE,encoding:"structured-clone",document:clone(document)},return_route:{mode:"postMessage",request_result:true}
    };
  }
  function cleanup(transfer){
    if(!transfer)return;if(transfer.handshakeTimer)clearTimeout(transfer.handshakeTimer);if(transfer.reviewTimer)clearTimeout(transfer.reviewTimer);if(active===transfer)active=null;
  }
  function handleResult(event,transfer){
    const valid=resultValidation(event,transfer);if(valid.ignore)return false;if(!valid.ok){lastError=valid.code;fallback(transfer.io,tr("protocol"),valid.code);cleanup(transfer);return true;}
    const msg=valid.message;lastResult=clone(msg);
    if(msg.status==="received"){showStatus("info",tr("received"),msg.code||"",0);return true;}
    if(msg.status==="committed")showStatus("ok",tr("committed"),msg.code||"");
    else if(msg.status==="cancelled")showStatus("info",tr("cancelled"),msg.code||"");
    else if(msg.status==="expired")fallback(transfer.io,tr("expired"),msg.code||"");
    else if(msg.status==="rejected")fallback(transfer.io,tr("rejected"),msg.code||"");
    cleanup(transfer);return true;
  }
  function handleMessage(event){
    const transfer=active;if(!transfer)return;
    if(!transfer.ready){
      const valid=readyValidation(event,transfer.popup,Date.now());
      if(!valid.ok){if(event.source===transfer.popup&&event.origin===CONFIG.target_origin&&event.data?.type===READY_TYPE){lastError=valid.code;fallback(transfer.io,tr("protocol"),valid.code);cleanup(transfer);}return;}
      transfer.ready=clone(valid.message);transfer.receiverNonce=valid.message.receiver_nonce;if(transfer.handshakeTimer)clearTimeout(transfer.handshakeTimer);
      const now=Date.now(),offer=offerFrom(transfer.document,valid.message,now,transfer.handoffId);transfer.offer=offer;
      try{transfer.popup.postMessage(offer,CONFIG.target_origin);showStatus("info",tr("sent"),"SUMMARY_PENDING",0);}
      catch(error){lastError=String(error?.message||error);fallback(transfer.io,tr("unavailable"),lastError);cleanup(transfer);return;}
      transfer.reviewTimer=setTimeout(()=>{if(active===transfer){lastError="SENDER_RESULT_TIMEOUT";fallback(transfer.io,tr("expired"),"SENDER_RESULT_TIMEOUT");cleanup(transfer);}},CONFIG.sender_result_timeout_minutes*60*1000);
      return;
    }
    handleResult(event,transfer);
  }
  function ensureListener(){if(root.__MOW_GC_SSC03D_MESSAGE_BOUND)return;root.addEventListener?.("message",handleMessage,false);root.__MOW_GC_SSC03D_MESSAGE_BOUND=true;}
  async function invoke(context){
    lastError=null;const projection=context?.projection;
    if(active&&active.popup?.closed)cleanup(active);
    if(active){try{active.popup?.focus?.();}catch(_){}showStatus("info",tr("active"),active.handoffId||"");return{ok:false,code:"HANDOFF_ALREADY_ACTIVE"};}
    if(!currentOfficialProjection(projection)){fallback(context?.io,tr("notOfficial"),"FLEET_NOT_ADMITTED");return{ok:false,code:"FLEET_NOT_ADMITTED"};}
    if(String(root.location?.origin||"")!==CONFIG.source_origin){fallback(context?.io,tr("origin"),"SOURCE_ORIGIN_MISMATCH");return{ok:false,code:"SOURCE_ORIGIN_MISMATCH"};}
    let descriptor;try{descriptor=buildDescriptor(context);}catch(error){lastError=String(error?.message||error);fallback(context?.io,tr("exportBlocked"),error?.code||lastError);return{ok:false,code:error?.code||"CANONICAL_EXPORT_FAILED"};}
    if(!descriptor.ok){fallback(context?.io,tr("exportBlocked"),descriptor.errors?.[0]?.code||"EXPORT_NOT_READY");return{ok:false,code:"EXPORT_NOT_READY",descriptor};}
    const handoffId=uuid();showStatus("info",tr("opening"),handoffId,0);let popup=null;
    const popupName=`mowGcHandoff_${handoffId.replace(/-/g,"")}`;
    try{popup=root.open?.("",popupName,"popup=yes,width=1180,height=900,resizable=yes,scrollbars=yes")||null;}catch(error){lastError=String(error?.message||error);}
    if(!popup){fallback(context?.io,tr("unavailable"),"POPUP_BLOCKED");return{ok:false,code:"POPUP_BLOCKED"};}
    const transfer={handoffId,popup,io:context.io,document:clone(descriptor.document),descriptor,ready:null,receiverNonce:null,offer:null,handshakeTimer:null,reviewTimer:null};active=transfer;
    showStatus("info",tr("waiting"),handoffId,0);
    transfer.handshakeTimer=setTimeout(()=>{if(active===transfer&&!transfer.ready){lastError="READY_TIMEOUT";fallback(transfer.io,tr("unavailable"),"READY_TIMEOUT");cleanup(transfer);}},CONFIG.ready_timeout_seconds*1000);
    try{popup.location.replace(CONFIG.target_url);popup.focus?.();}
    catch(error){lastError=String(error?.message||error);fallback(transfer.io,tr("unavailable"),"TARGET_NAVIGATION_FAILED");try{popup.close?.();}catch(_){}cleanup(transfer);return{ok:false,code:"TARGET_NAVIGATION_FAILED"};}
    return{ok:true,code:"HANDOFF_OPENED",handoff_id:handoffId,descriptor};
  }
  function register(){
    const surface=root.MowImportExportShareSurface;if(!surface||typeof surface.registerAction!=="function")throw new Error("MowImportExportShareSurface.registerAction is unavailable.");
    const existing=surface.actionRegistry?.().external_actions?.find(x=>x.id===ACTION_ID);
    if(existing){if(existing.owner!==BUILD.owner)throw new Error(`Action '${ACTION_ID}' is already owned by '${existing.owner}'.`);registered=true;return existing;}
    const action=surface.registerAction({id:ACTION_ID,owner:BUILD.owner,order:450,label:()=>tr("label"),invoke});registered=true;return action;
  }
  function status(){return Object.freeze({build:BUILD,config:clone(CONFIG),registered,action_id:ACTION_ID,active:active?{handoff_id:active.handoffId,ready:!!active.ready,popup_closed:!!active.popup?.closed}:null,last_result:clone(lastResult),last_error:lastError});}
  ensureListener();
  const api=Object.freeze({BUILD,CONFIG,ACTION_ID,register,invoke,status,currentOfficialProjection,buildDescriptor,readyValidation,resultValidation,offerFrom});
  root.MowGameCompanionSenderSSC03D=api;root.MOW_GC_SSC03D_SENDER=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root.document)register();
})(typeof window!=="undefined"?window:globalThis);
