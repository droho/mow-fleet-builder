(function(root){
  "use strict";

  const BUILD=Object.freeze({work_package:"FB-ARCH-01A",increment:"B3",component:"character_names_surface",version:"0.3.0-private",product_version:"1.8.1",build:"1.8.1-dev.3+fb-arch-01a-b3"});
  const OWNER_ID="fbarch01a.character_names_surface";

  function doc(){return root.document||null;}
  function clean(value){return String(value==null?"":value).replace(/[\r\n\t]+/g," ").replace(/\s{2,}/g," ").trim();}
  function english(){try{return root.MOW_I18N&&root.MOW_I18N.getLang&&root.MOW_I18N.getLang()==="en";}catch(error){return false;}}
  function tr(key){const text={button:{pl:"Imiona postaci",en:"Character names"},aria:{pl:"Edytuj imiona postaci",en:"Edit character names"}};return text[key][english()?"en":"pl"];}
  function escapeCss(value){return root.CSS&&typeof root.CSS.escape==="function"?root.CSS.escape(String(value||"")):String(value||"").replace(/[^A-Za-z0-9_-]/g,"\\$&");}
  function rowForControl(controlId){
    const d=doc();if(!d||!controlId)return null;
    const direct=d.getElementById(controlId);if(direct&&direct.closest)return direct.closest(".row");
    try{return d.querySelector(`[data-uid="${escapeCss(controlId)}"]`);}catch(error){return null;}
  }
  function ensureHeadingTools(section){
    const d=doc(),heading=section&&section.querySelector(":scope > h3, :scope > .mow-section-heading-tools > h3");if(!d||!heading)return null;
    let wrapper=section.querySelector(":scope > .mow-section-heading-tools");
    if(!wrapper){wrapper=d.createElement("div");wrapper.className="mow-section-heading-tools";heading.insertAdjacentElement("beforebegin",wrapper);wrapper.appendChild(heading);}
    return wrapper;
  }
  function projectedModel(projection){return projection&&projection.surface_models&&projection.surface_models.character_names||null;}

  function createSurface(target){
    const host=target||root,d=host.document||null;
    let controller=null,currentProjection=null,bound=false,mounted=false,renderCount=0,bindCount=0,openCount=0;
    const activeButtons=new Set(),activeSummaries=new Set();

    function installCss(){
      if(!d||d.getElementById("mowFbArch01aCharacterNamesCss"))return;
      const style=d.createElement("style");style.id="mowFbArch01aCharacterNamesCss";style.textContent=`
        .mow-b90-character-summary[data-fbarch-owner="${OWNER_ID}"]{margin-top:3px;color:color-mix(in srgb,var(--accent,#5aa9ff) 68%,var(--text,#eef3f8));font-size:12px;font-style:italic;line-height:1.3;overflow-wrap:anywhere}
        .mow-character-names-button[data-fbarch-owner="${OWNER_ID}"]{flex:0 0 auto;min-height:30px;padding:5px 9px;border-radius:9px;font-size:12px;font-weight:800;background:rgba(255,255,255,.025)}
        .mow-character-names-button[data-fbarch-owner="${OWNER_ID}"][hidden]{display:none!important}
      `;d.head.appendChild(style);
    }
    function clearLegacyOwners(){
      if(!d)return;
      d.querySelectorAll(".mow-character-names-button").forEach(node=>{if(node.getAttribute("data-fbarch-owner")!==OWNER_ID)node.remove();});
      d.querySelectorAll(".mow-b90-character-summary").forEach(node=>{if(node.getAttribute("data-fbarch-owner")!==OWNER_ID)node.remove();});
    }
    function summaryFor(controlId,row){
      let node=Array.from(row.querySelectorAll(":scope .mow-b90-character-summary")).find(item=>item.getAttribute("data-fbarch-control-id")===controlId)||null;
      if(!node){node=d.createElement("div");node.className="mow-b90-character-summary";node.setAttribute("data-fbarch-owner",OWNER_ID);node.setAttribute("data-fbarch-control-id",controlId);}
      const title=row.querySelector(".title");if(title&&node.nextElementSibling!==title)title.insertAdjacentElement("beforebegin",node);
      return node;
    }
    function renderSummaries(model){
      activeSummaries.clear();const grouped=new Map();
      (model&&model.named_items||[]).forEach(item=>{if(!item.control_id||!clean(item.custom_name))return;const list=grouped.get(item.control_id)||[];list.push(item);grouped.set(item.control_id,list);});
      grouped.forEach((items,controlId)=>{
        const row=rowForControl(controlId);if(!row)return;const node=summaryFor(controlId,row),wanted=items.map(item=>clean(item.custom_name)).filter(Boolean),current=Array.from(node.children).map(line=>clean(line.textContent));
        if(JSON.stringify(wanted)!==JSON.stringify(current)){node.replaceChildren(...wanted.map(name=>{const line=d.createElement("div");line.textContent=name;return line;}));}
        activeSummaries.add(node);
      });
      d.querySelectorAll(`.mow-b90-character-summary[data-fbarch-owner="${OWNER_ID}"]`).forEach(node=>{if(!activeSummaries.has(node))node.remove();});
    }
    function buttonFor(section,item){
      const wrapper=ensureHeadingTools(section);if(!wrapper)return null;
      let button=wrapper.querySelector(`:scope > .mow-character-names-button[data-fbarch-owner="${OWNER_ID}"]`);
      if(!button){button=d.createElement("button");button.type="button";button.className="mow-character-names-button";button.setAttribute("data-fbarch-owner",OWNER_ID);wrapper.appendChild(button);}
      button.hidden=false;button.textContent=tr("button");button.setAttribute("aria-label",tr("aria"));button.setAttribute("data-fbarch-assignment-id",clean(item&&item.assignment_id));return button;
    }
    function renderButtons(model){
      activeButtons.clear();d.querySelectorAll(`.mow-character-names-button[data-fbarch-owner="${OWNER_ID}"]`).forEach(button=>{button.hidden=true;button.removeAttribute("data-fbarch-assignment-id");});
      const bySection=new Map();
      (model&&model.nameable_items||[]).forEach(item=>{const section=rowForControl(item.control_id)?.closest(".section");if(section&&!bySection.has(section))bySection.set(section,item);});
      bySection.forEach((item,section)=>{const button=buttonFor(section,item);if(button)activeButtons.add(button);});
      d.querySelectorAll(`.mow-character-names-button[data-fbarch-owner="${OWNER_ID}"]`).forEach(button=>{if(!activeButtons.has(button)&&!button.hidden)button.hidden=true;});
    }
    function render(projection){
      currentProjection=projection||currentProjection;if(!d)return false;installCss();clearLegacyOwners();const model=projectedModel(currentProjection);renderSummaries(model);renderButtons(model);mounted=true;renderCount+=1;return true;
    }
    function handleClick(event){
      const button=event.target&&event.target.closest?event.target.closest(`.mow-character-names-button[data-fbarch-owner="${OWNER_ID}"]`):null;if(!button)return;
      event.preventDefault();const assignmentId=clean(button.getAttribute("data-fbarch-assignment-id")),setup=host.MowFleetSetup||host.MOW_FLEET_RELEASE90_SETUP;
      if(setup&&typeof setup.open==="function"){openCount+=1;setup.open(assignmentId?{assignmentId}:undefined);}
    }
    function bind(options){if(bound)return true;if(!d)return false;controller=options&&options.controller||controller;d.addEventListener("click",handleClick,true);bound=true;bindCount+=1;return true;}
    function status(){
      const legacyButtons=d?d.querySelectorAll(`.mow-character-names-button:not([data-fbarch-owner="${OWNER_ID}"])`).length:0,legacySummaries=d?d.querySelectorAll(`.mow-b90-character-summary:not([data-fbarch-owner="${OWNER_ID}"])`).length:0;
      return Object.freeze({build:BUILD,owner_id:OWNER_ID,mounted,bound,render_count:renderCount,bind_count:bindCount,open_count:openCount,projection_revision:Number(currentProjection&&currentProjection.official&&currentProjection.official.revision||0),button_count:d?d.querySelectorAll(`.mow-character-names-button[data-fbarch-owner="${OWNER_ID}"]:not([hidden])`).length:0,summary_count:d?d.querySelectorAll(`.mow-b90-character-summary[data-fbarch-owner="${OWNER_ID}"]`).length:0,legacy_button_count:legacyButtons,legacy_summary_count:legacySummaries,legacy_autonomous:false});
    }
    return Object.freeze({BUILD,OWNER_ID,bind,render,status,currentProjection:()=>currentProjection});
  }

  const surface=createSurface(root);
  const api=Object.freeze({BUILD,OWNER_ID,createSurface,surface,bind:options=>surface.bind(options),render:projection=>surface.render(projection),status:()=>surface.status()});
  root.MowCharacterNamesSurface=api;root.MOW_FB_ARCH_01A_CHARACTER_NAMES_SURFACE=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
