(function(root){
  "use strict";
  const BUILD=Object.freeze({work_package:"FB-MAINT-03",increment:"MAINT03C-R2",component:"roster_surface",version:"0.3.1-private",product_version:"1.8.1",build:"1.8.1-dev.12.3+fb-maint-03-maint03c-r2"});
  const OWNER="fbarch01a.roster_surface";
  const MOW_CARD_POOL_ID="card_pool.mow_card";
  let mounted=false,bound=false,bindCount=0,renderCount=0,lastReason="",lastFingerprint=null,lastBase="",lastRendered="",controller=null;
  function doc(){return root.document;}
  function clean(value){return String(value==null?"":value);}
  function compact(value){return clean(value).replace(/[\r\n\t]+/g," ").replace(/\s{2,}/g," ").trim();}
  function fail(code,message){const error=new Error(message);error.name="MowRosterSurfaceError";error.code=code;throw error;}
  function output(){return doc()&&doc().getElementById("out")||null;}
  function writer(out,value){if(root.MOW_ROSTER_PREVIEW_WRITE&&typeof root.MOW_ROSTER_PREVIEW_WRITE.write==="function")return root.MOW_ROSTER_PREVIEW_WRITE.write(out,value);const next=clean(value);if(out&&out.value!==next){out.value=next;return true;}return false;}
  function surfaceModel(projection){return projection&&projection.surface_models&&projection.surface_models.roster||null;}
  function isEnglish(modelValue){try{const lang=root.MOW_I18N&&typeof root.MOW_I18N.getLang==="function"?root.MOW_I18N.getLang():modelValue&&modelValue.identity&&modelValue.identity.language;return String(lang||"en").toLowerCase().startsWith("en");}catch(error){return true;}}
  function tr(modelValue,english,polish){return isEnglish(modelValue)?english:polish;}
  function byId(items,key,id){return (Array.isArray(items)?items:[]).find(item=>item&&item[key]===id)||null;}
  function human(value){return compact(String(value||"").split(".").pop().replace(/_/g," ")).replace(/\b\w/g,char=>char.toUpperCase());}
  function sourceControlId(selection){
    const source=selection&&selection.source_ref||{},direct=compact(source.external_id),d=doc();
    if(direct&&d&&typeof d.getElementById==="function"&&d.getElementById(direct))return direct;
    return compact(source.raw_external_key).split(".").pop();
  }
  function rowForControl(controlId){
    if(!controlId)return null;const d=doc();if(!d)return null;
    const control=typeof d.getElementById==="function"?d.getElementById(controlId):null;if(control&&typeof control.closest==="function")return control.closest(".row");
    try{return typeof d.querySelector==="function"?d.querySelector(`[data-uid="${String(controlId).replace(/"/g,'\\"')}"]`):null;}catch(error){return null;}
  }
  function titleText(row){
    const title=row&&typeof row.querySelector==="function"?row.querySelector(".title"):null;if(!title)return "";
    const direct=Array.from(title.childNodes||[]).filter(node=>node.nodeType===3).map(node=>node.textContent).join(" ");return compact(direct||title.textContent);
  }
  function selectionLabel(selection){
    if(!selection)return "";const controlId=sourceControlId(selection),row=rowForControl(controlId);return titleText(row)||human(selection.selection_id||controlId);
  }
  function pointsForSelection(selection){return Math.max(0,Math.round(Number(selection&&selection.points&&selection.points.total)||0));}
  function escapeRegex(value){return String(value||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
  function polishPurchased(count){
    const n=Math.max(0,Math.trunc(Number(count)||0)),mod10=n%10,mod100=n%100;
    if(n===1)return "1 zakupiona";
    if(mod10>=2&&mod10<=4&&!(mod100>=12&&mod100<=14))return `${n} zakupione`;
    return `${n} zakupionych`;
  }
  function mowCardBreakdownLine(modelValue,resource){
    const quantity=Math.max(1,Math.trunc(Number(resource&&resource.quantity)||1)),purchased=Math.max(0,quantity-1),selection=byId(modelValue&&modelValue.selections,"selection_instance_id",resource&&resource.origin_selection_instance_id),points=pointsForSelection(selection),label=selectionLabel(selection)||tr(modelValue,"Men O' War Cards","Men O' War Cards");
    const detail=isEnglish(modelValue)?`1 free + ${purchased} purchased`:`1 gratis + ${polishPurchased(purchased)}`;
    return {label,quantity,points,text:`  • ${label} ×${quantity} — ${detail} = ${points} ${tr(modelValue,"pts","pkt")}`};
  }
  function enhanceMowCards(modelValue,rendered){
    let text=clean(rendered);const pools=(modelValue&&modelValue.resources||[]).filter(resource=>resource&&resource.resource_kind==="card_pool_entitlement"&&resource.definition_id===MOW_CARD_POOL_ID);
    pools.forEach(resource=>{
      const line=mowCardBreakdownLine(modelValue,resource),unit=tr(modelValue,"pts","pkt"),exact=new RegExp(`^\\s*•\\s*${escapeRegex(line.label)}\\s+x${line.quantity}\\s*=\\s*${line.points}\\s+${escapeRegex(unit)}\\s*$`,`m`);
      if(exact.test(text)){text=text.replace(exact,line.text);return;}
      const fallback=new RegExp(`^\\s*•\\s*([^\\n]+?)\\s+x${line.quantity}\\s*=\\s*${line.points}\\s+${escapeRegex(unit)}\\s*$`,`gm`),matches=Array.from(text.matchAll(fallback));
      if(matches.length===1)text=text.slice(0,matches[0].index)+line.text+text.slice(matches[0].index+matches[0][0].length);
    });
    return text;
  }
  function enhanceRosterText(modelValue,rendered){return enhanceMowCards(modelValue,rendered);}
  function resolveBase(out,options){if(options&&options.base_text!=null){lastBase=clean(options.base_text);out.dataset.mowBatch90bBase=lastBase;return lastBase;}if(out&&out.dataset.mowHotfix90gBase!=null){lastBase=clean(out.dataset.mowHotfix90gBase);out.dataset.mowBatch90bBase=lastBase;delete out.dataset.mowHotfix90gBase;return lastBase;}if(out&&out.dataset.mowBatch90bBase!=null){lastBase=clean(out.dataset.mowBatch90bBase);return lastBase;}if(lastBase)return lastBase;lastBase=clean(out&&out.value||"");return lastBase;}
  function dispatchChange(projection,changed){const d=doc();if(!d||typeof d.dispatchEvent!=="function")return;const EventCtor=root.CustomEvent||function(type,init){this.type=type;this.detail=init&&init.detail;};d.dispatchEvent(new EventCtor("mow:centralrosterchange",{detail:{owner:OWNER,changed:!!changed,fingerprint:projection&&projection.fingerprint||null,revision:projection&&projection.official&&projection.official.revision||0,render_count:renderCount}}));}
  function render(projection,options){const out=output();if(!out)return "";const surface=surfaceModel(projection);if(!surface||!surface.available){mounted=true;return clean(out.value);}const formatter=root.MOW_BATCH90C_ROSTER;if(!formatter||typeof formatter.buildRoster!=="function")fail("FORMATTER_UNAVAILABLE","Accepted hierarchical roster formatter is unavailable.");const base=resolveBase(out,options||{}),legacyRendered=formatter.buildRoster(surface.model,base),rendered=enhanceRosterText(surface.model,legacyRendered),changed=writer(out,rendered);out.dataset.mowBatch90cRendered=rendered;out.dataset.mowFbArchRosterOwner=OWNER;out.dataset.mowFbArchRosterFingerprint=String(projection&&projection.fingerprint||"");out.dataset.mowFbMaint03cRoster="r2";lastRendered=rendered;lastFingerprint=projection&&projection.fingerprint||null;lastReason=String(options&&options.reason||"");renderCount+=1;mounted=true;dispatchChange(projection,changed);return rendered;}
  function bind(context){if(bound)return false;controller=context&&context.controller||controller;bound=true;bindCount+=1;return true;}
  function status(){const out=output();return Object.freeze({build:BUILD,owner:OWNER,mounted,bound,bind_count:bindCount,render_count:renderCount,last_reason:lastReason,last_fingerprint:lastFingerprint,last_base_length:lastBase.length,last_rendered_length:lastRendered.length,preview_owned:!!(out&&out.dataset.mowFbArchRosterOwner===OWNER),maint03c_roster:out&&out.dataset.mowFbMaint03cRoster||null,legacy_batch90c_autonomous:root.MOW_BATCH90C_ROSTER&&Object.prototype.hasOwnProperty.call(root.MOW_BATCH90C_ROSTER,"roster_autonomous")?!!root.MOW_BATCH90C_ROSTER.roster_autonomous:null,legacy_batch90b_autonomous:root.MOW_BATCH90B_PROJECTION&&Object.prototype.hasOwnProperty.call(root.MOW_BATCH90B_PROJECTION,"roster_autonomous")?!!root.MOW_BATCH90B_PROJECTION.roster_autonomous:null});}
  const api=Object.freeze({BUILD,OWNER,render,bind,status,currentText:()=>lastRendered,enhanceRosterText});root.MowRosterSurface=api;root.MOW_FB_ARCH_01A_ROSTER_SURFACE=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
