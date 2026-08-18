(function(root){
  "use strict";
  const BUILD=Object.freeze({work_package:"FB-ARCH-01A",increment:"B5",component:"print_surface",version:"0.1.0-private",product_version:"1.8.1",build:"1.8.1-dev.5.1+fb-arch-01a-b5-corr1"});
  const OWNER="fbarch01a.print_surface";
  let mounted=false,bound=false,bindCount=0,renderCount=0,lastReason="",lastFingerprint=null,lastText="",controller=null;
  const listeners=[];
  function doc(){return root.document;}
  function clean(value){return String(value==null?"":value);}
  function ensureNode(){
    const d=doc();if(!d)return null;
    let pre=d.getElementById("mowBatch90bPrintRoster");
    if(!pre){pre=d.createElement("pre");pre.id="mowBatch90bPrintRoster";pre.setAttribute("aria-hidden","true");}
    if(d.body&&pre.parentElement!==d.body)d.body.appendChild(pre);
    pre.dataset.mowFbArchPrintOwner=OWNER;
    return pre;
  }
  function ensureCss(){
    const d=doc();if(!d||d.getElementById("mowFbArchPrintCss"))return;
    const style=d.createElement("style");style.id="mowFbArchPrintCss";style.textContent=`
      #mowBatch90bPrintRoster{display:none}
      @media print{
        html,body{margin:0!important;padding:0!important;width:auto!important;height:auto!important;min-height:0!important;overflow:visible!important;background:#fff!important;color:#000!important}
        body{display:block!important}
        body>*:not(#mowBatch90bPrintRoster){display:none!important}
        #mowBatch90bPrintRoster{display:block!important;position:static!important;inset:auto!important;box-sizing:border-box!important;width:auto!important;max-width:none!important;height:auto!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;color:#000!important;background:#fff!important;white-space:pre-wrap!important;overflow:visible!important;font:11pt/1.42 ui-monospace,SFMono-Regular,Consolas,monospace!important;break-inside:auto!important}
      }
    `;d.head.appendChild(style);
  }
  function rosterText(){const surface=root.MOW_FB_ARCH_01A_ROSTER_SURFACE||root.MowRosterSurface;return surface&&typeof surface.currentText==="function"?clean(surface.currentText()):clean(doc()&&doc().getElementById("out")&&doc().getElementById("out").value||"");}
  function render(projection,options){
    ensureCss();const pre=ensureNode();if(!pre)return "";
    const text=rosterText(),changed=pre.textContent!==text;
    if(changed)pre.textContent=text;
    pre.dataset.mowFbArchPrintOwner=OWNER;pre.dataset.mowFbArchPrintFingerprint=String(projection&&projection.fingerprint||"");
    mounted=true;lastReason=String(options&&options.reason||"");lastFingerprint=projection&&projection.fingerprint||null;lastText=text;if(changed||renderCount===0)renderCount+=1;return text;
  }
  function currentProjection(){return controller&&typeof controller.currentProjection==="function"?controller.currentProjection():root.MOW_FB_ARCH_01A_CURRENT_PROJECTION||null;}
  function onRosterChange(){const projection=currentProjection();render(projection,{reason:"central_roster_change"});}
  function onBeforePrint(){const projection=currentProjection();render(projection,{reason:"beforeprint"});}
  function bind(context){
    if(bound)return false;controller=context&&context.controller||controller;const d=doc();
    if(d&&typeof d.addEventListener==="function"){d.addEventListener("mow:centralrosterchange",onRosterChange);listeners.push([d,"mow:centralrosterchange",onRosterChange]);}
    if(root&&typeof root.addEventListener==="function"){root.addEventListener("beforeprint",onBeforePrint);listeners.push([root,"beforeprint",onBeforePrint]);}
    bound=true;bindCount+=1;return true;
  }
  function status(){const d=doc(),pre=d&&d.getElementById("mowBatch90bPrintRoster");return Object.freeze({build:BUILD,owner:OWNER,mounted,bound,bind_count:bindCount,render_count:renderCount,last_reason:lastReason,last_fingerprint:lastFingerprint,last_text_length:lastText.length,node_count:d?d.querySelectorAll("#mowBatch90bPrintRoster").length:0,node_owned:!!(pre&&pre.dataset.mowFbArchPrintOwner===OWNER),legacy_print_compatibility:root.MOW_BATCH90B_PROJECTION&&Object.prototype.hasOwnProperty.call(root.MOW_BATCH90B_PROJECTION,"print_compatibility")?!!root.MOW_BATCH90B_PROJECTION.print_compatibility:null});}
  const api=Object.freeze({BUILD,OWNER,render,bind,status,currentText:()=>lastText});root.MowPrintSurface=api;root.MOW_FB_ARCH_01A_PRINT_SURFACE=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
