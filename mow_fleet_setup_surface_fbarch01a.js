(function(root){
  "use strict";

  const BUILD=Object.freeze({work_package:"FB-MAINT-04",increment:"MAINT04B-R1",component:"fleet_setup_surface",version:"0.2.1-private",build:"1.8.1-dev.13+fb-maint-04-maint04b-r1"});
  const OWNER_ID="fbarch01a.fleet_setup_surface";
  const NS="mow.builder";
  const ASSIGNMENT_TYPES=new Set(["fleet_designation_to_unit","squadron_designation_to_unit","role_to_unit","resource_to_unit"]);
  const TEXT={
    pl:{button:"Przygotowanie floty",title:"PRZYGOTOWANIE FLOTY",hint:"Flagshipy, postacie, specjalna załoga i zadania przed grą.",close:"Zamknij",fleet:"Flagship floty",squadrons:"Flagshipy squadronów",deathgalleys:"Moce Chaosu — Deathgalleys",chaosPower:"Moc Chaosu",choosePower:"— wybierz Moc Chaosu —",command:"Postacie i dowództwo",resources:"Specjalna załoga i ulepszenia",setups:"Zadania przed grą",choose:"— wybierz legalny okręt —",later:"— ustal przed grą —",pending:"wymaga decyzji",ready:"gotowe",name:"Imię",generate:"Losuj",reroll:"Losuj ponownie",manual:"Wpisz ręcznie lub wylosuj",noTargets:"Brak legalnych celów",assigned:"Przypisano",fixedTarget:"Przypisany okręt",invalid:"Wymaga sprawdzenia",squadron:"Eskadra"},
    en:{button:"Fleet setup",title:"FLEET SETUP",hint:"Flagships, characters, special crew and pre-game tasks.",close:"Close",fleet:"Fleet flagship",squadrons:"Squadron flagships",deathgalleys:"Chaos Powers — Deathgalleys",chaosPower:"Chaos Power",choosePower:"— choose Chaos Power —",command:"Characters and command",resources:"Special crew and upgrades",setups:"Pre-game tasks",choose:"— choose a legal vessel —",later:"— decide before game —",pending:"needs attention",ready:"ready",name:"Name",generate:"Generate",reroll:"Reroll",manual:"Type manually or generate",noTargets:"No legal targets",assigned:"Assigned",fixedTarget:"Assigned vessel",invalid:"Needs review",squadron:"Squadron"}
  };

  function esc(value){return String(value==null?"":value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));}
  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function lang(){try{return root.MOW_I18N&&root.MOW_I18N.getLang&&root.MOW_I18N.getLang()==="en"?"en":"pl";}catch(error){return "pl";}}
  function tr(key){return (TEXT[lang()]||TEXT.pl)[key]||key;}
  function byId(items,key,id){return (items||[]).find(item=>item&&item[key]===id)||null;}
  function assignmentFor(model,type,id){return (model.assignments||[]).find(item=>item.subject_ref&&item.subject_ref.type===type&&item.subject_ref.id===id)||null;}
  function chaosVariant(model){const raw=String(model&&model.identity&&model.identity.fleet_variant&&model.identity.fleet_variant.chaos_variant||"").toLowerCase();return ({khorne:"dedicated_khorne",nurgle:"dedicated_nurgle",slaanesh:"dedicated_slaanesh",tzeentch:"dedicated_tzeentch",plaguefleet:"plaguefleet"})[raw]||raw||null;}
  function commands(){return root.MowFleetSetupCommands||root.MOW_FLEET_RELEASE90_SETUP_COMMANDS||null;}
  function projectedModel(projection){const source=projection&&projection.surface_models&&projection.surface_models.fleet_setup;return source&&source.available&&source.model?source.model:null;}
  function unitLabel(model,unit){const api=commands();return api&&api.unitLabel?api.unitLabel(model,unit):String(unit&&unit.custom_name||unit&&unit.unit_id||"—");}
  function labelFromSource(model,item){const api=commands();return api&&api.labelFromSource?api.labelFromSource(model,item):String(item&&item.role_id||item&&item.definition_id||"");}
  function standardWizardVariant(model,item){
    const selection=item&&item.origin_selection_instance_id?byId(model&&model.selections,"selection_instance_id",item.origin_selection_instance_id):null;
    const variantId=String(item&&item.variant_id||selection&&selection.variant_id||"");
    const api=root.MOW_WIZARD_MASTERY;
    return api&&Array.isArray(api.variants)?api.variants.find(variant=>variant.variant_id===variantId)||null:null;
  }
  function roleRulesSummary(model,item){
    const variant=standardWizardVariant(model,item);if(!variant)return "";
    const modifier=Number(variant.dice_modifier)>0?`+${Number(variant.dice_modifier)}`:String(Number(variant.dice_modifier)||0);
    const reroll=lang()==="en"?(variant.reroll_scope==="any_colour"?"reroll any-colour Magic Card":"reroll own College Magic Card"):(variant.reroll_scope==="any_colour"?"przerzut karty Magii dowolnego koloru":"przerzut karty Magii własnego Kolegium");
    const limits=lang()==="en"?"max 1 Wizard per fleet; 1 spell cast per turn":"maks. 1 Wizard we flocie; 1 czar rzucany na turę";
    const cards=lang()==="en"?(variant.magic_cards===1?"1 Magic Card":`${variant.magic_cards} Magic Cards`):(variant.magic_cards===1?"1 karta Magii":([2,3,4].includes(variant.magic_cards)?`${variant.magic_cards} karty Magii`:`${variant.magic_cards} kart Magii`));
    const honours=variant.battle_honours===1?"1 Battle Honour":`${variant.battle_honours} Battle Honours`;
    let value=`${cards} · ${lang()==="en"?"Dice Modifier":"modyfikator kości"} ${modifier} · ${honours} · ${reroll} · ${limits}`;
    const modules=new Set(model&&model.ruleset_ref&&Array.isArray(model.ruleset_ref.modules)?model.ruleset_ref.modules:[]),core=new Set(root.MOW_WIZARD_MASTERY&&root.MOW_WIZARD_MASTERY.core_variant_ids||[]);
    if(!core.has(variant.variant_id)&&!modules.has("annual_expanded_wizards"))value+=lang()==="en"?" · REQUIRES COMMUNITY ANNUAL MODULE":" · WYMAGA MODUŁU COMMUNITY ANNUAL";
    return value;
  }
  function targetOptions(model,assignment){const api=commands();if(api&&api.targetOptions)return api.targetOptions(model,assignment);return {html:`<option value="">${esc(assignment.requirement==="required_at_roster_build"?tr("choose"):tr("later"))}</option>`,result:{candidates:[],dependency_unresolved:false}};}
  function roleNameCapability(model,role){const api=commands();return api&&api.roleNameCapability?api.roleNameCapability(model,role):{nameable:false,generatorAvailable:false};}
  function resourceNameCapability(model,resource){const api=commands();return api&&api.resourceNameCapability?api.resourceNameCapability(model,resource):{nameable:false,generatorAvailable:false};}
  function deathgalleySquadrons(model){const api=commands();return api&&api.deathgalleySquadrons?api.deathgalleySquadrons(model):[];}
  function deathgalleyPower(squadron){const api=commands();return api&&api.deathgalleyPower?api.deathgalleyPower(squadron):"";}

  function nameEditor(kind,id,value,nameable,generatorAvailable){
    if(!nameable)return "";
    const generate=generatorAvailable?`<button type="button" data-r90-generate-kind="${esc(kind)}" data-r90-generate-id="${esc(id)}">${esc(value?tr("reroll"):tr("generate"))}</button>`:"";
    return `<div class="mow-r90-name ${generatorAvailable?"":"manual-only"}"><label>${esc(tr("name"))}<input type="text" maxlength="200" value="${esc(value||"")}" placeholder="${esc(tr("manual"))}" data-r90-name-kind="${esc(kind)}" data-r90-name-id="${esc(id)}"></label>${generate}</div>`;
  }
  function assignmentRow(model,assignment,label,editor,fixedTarget,detail){
    const options=targetOptions(model,assignment),meta=assignment.extensions&&assignment.extensions[NS]||{};
    const state=assignment.status==="resolved"?tr("assigned"):meta.state==="needs_review"?tr("invalid"):tr("pending");
    const fixed=fixedTarget&&options.result.candidates.length===1
      ?`<div class="mow-r90-fixed-target"><small>${esc(tr("fixedTarget"))}</small><strong>${esc(unitLabel(model,options.result.candidates[0]))}</strong></div>`
      :`<select data-r90-assignment-select="${esc(assignment.assignment_id)}" ${!options.result.candidates.length?"disabled":""}>${options.html}</select>${!options.result.candidates.length?`<small>${esc(tr("noTargets"))}</small>`:""}`;
    return `<div class="mow-r90-row" data-r90-assignment="${esc(assignment.assignment_id)}"><div class="mow-r90-rowhead"><strong>${esc(label)}</strong><span class="mow-r90-state ${assignment.status==="resolved"?"ok":"warn"}">${esc(state)}</span></div>${detail?`<small class="mow-r90-role-detail">${esc(detail)}</small>`:""}${editor||""}${fixed}</div>`;
  }
  function group(title,rows,key,pending){if(!rows.length)return "";return `<details class="mow-r90-group" data-r90-group="${esc(key)}" ${pending?"open":""}><summary><span>${esc(title)}</span><b>${rows.length}</b></summary><div class="mow-r90-groupbody">${rows.join("")}</div></details>`;}
  function deathgalleyRow(squadron){
    const power=deathgalleyPower(squadron),state=power?tr("ready"):tr("pending"),options=[["",tr("choosePower")],["khorne","Khorne"],["nurgle","Nurgle"],["slaanesh","Slaanesh"],["tzeentch","Tzeentch"]];
    return `<div class="mow-r90-row" data-r90-deathgalley="${esc(squadron.squadron_instance_id)}"><div class="mow-r90-rowhead"><strong>Deathgalleys — ${esc(tr("squadron"))} ${squadron.selection_occurrence||1}</strong><span class="mow-r90-state ${power?"ok":"warn"}">${esc(state)}</span></div><label class="mow-r90-power-label">${esc(tr("chaosPower"))}<select data-r90-deathgalley-power="${esc(squadron.squadron_instance_id)}">${options.map(([value,label])=>`<option value="${esc(value)}" ${value===power?"selected":""}>${esc(label)}</option>`).join("")}</select></label></div>`;
  }

  function buildWorkspace(model){
    const relevant=(model.assignments||[]).filter(item=>ASSIGNMENT_TYPES.has(item.assignment_type));
    const deathgalleys=chaosVariant(model)==="plaguefleet"?deathgalleySquadrons(model):[];
    const fleet=[],squads=[],roles=[],resources=[];
    relevant.forEach(assignment=>{
      if(assignment.assignment_type==="fleet_designation_to_unit")fleet.push(assignmentRow(model,assignment,tr("fleet"),"",false));
      if(assignment.assignment_type==="squadron_designation_to_unit"){
        const squadron=byId(model.squadrons,"squadron_instance_id",assignment.subject_ref&&assignment.subject_ref.id);
        squads.push(assignmentRow(model,assignment,`${tr("squadron")} ${squadron&&squadron.selection_occurrence||squads.length+1}`,"",false));
      }
      if(assignment.assignment_type==="role_to_unit"){
        const role=byId(model.roles,"role_instance_id",assignment.subject_ref&&assignment.subject_ref.id),cap=roleNameCapability(model,role||{});
        roles.push(assignmentRow(model,assignment,labelFromSource(model,role||{}),nameEditor("role",role&&role.role_instance_id,role&&role.custom_name,cap.nameable,cap.generatorAvailable),true,roleRulesSummary(model,role||{})));
      }
      if(assignment.assignment_type==="resource_to_unit"){
        const resource=byId(model.resources,"resource_instance_id",assignment.subject_ref&&assignment.subject_ref.id),cap=resourceNameCapability(model,resource||{});
        resources.push(assignmentRow(model,assignment,labelFromSource(model,resource||{}),nameEditor("resource",resource&&resource.resource_instance_id,resource&&resource.custom_name,cap.nameable,cap.generatorAvailable),true));
      }
    });
    (model.roles||[]).filter(role=>!assignmentFor(model,"role_instance",role.role_instance_id)&&roleNameCapability(model,role).nameable).forEach(role=>{
      const cap=roleNameCapability(model,role),detail=roleRulesSummary(model,role);roles.push(`<div class="mow-r90-row"><div class="mow-r90-rowhead"><strong>${esc(labelFromSource(model,role))}</strong></div>${detail?`<small class="mow-r90-role-detail">${esc(detail)}</small>`:""}${nameEditor("role",role.role_instance_id,role.custom_name,cap.nameable,cap.generatorAvailable)}</div>`);
    });
    (model.resources||[]).filter(resource=>!assignmentFor(model,"resource_instance",resource.resource_instance_id)&&resourceNameCapability(model,resource).nameable).forEach(resource=>{
      const cap=resourceNameCapability(model,resource);resources.push(`<div class="mow-r90-row"><div class="mow-r90-rowhead"><strong>${esc(labelFromSource(model,resource))}</strong></div>${nameEditor("resource",resource.resource_instance_id,resource.custom_name,cap.nameable,cap.generatorAvailable)}</div>`);
    });
    const deathgalleyRows=deathgalleys.map(deathgalleyRow);
    const pending=relevant.filter(item=>item.status!=="resolved").length+deathgalleys.filter(item=>!deathgalleyPower(item)).length;
    const total=relevant.length+deathgalleys.length;
    return {
      html:group(tr("fleet"),fleet,"fleet",relevant.some(item=>item.assignment_type==="fleet_designation_to_unit"&&item.status!=="resolved"))+
        group(tr("deathgalleys"),deathgalleyRows,"deathgalleys",deathgalleys.some(item=>!deathgalleyPower(item)))+
        group(tr("squadrons"),squads,"squadrons",relevant.some(item=>item.assignment_type==="squadron_designation_to_unit"&&item.status!=="resolved"))+
        group(tr("command"),roles,"roles",relevant.some(item=>item.assignment_type==="role_to_unit"&&item.status!=="resolved"))+
        group(tr("resources"),resources,"resources",relevant.some(item=>item.assignment_type==="resource_to_unit"&&item.status!=="resolved")),
      total,pending
    };
  }

  function createSurface(target){
    const host=target||root,doc=host.document||null;
    let mounted=false,bound=false,isOpen=false,currentProjection=null,controller=null,focusRequest=null,lastScrollTop=0,lastFocus=null,renderCount=0,bindCount=0,commandCount=0;
    const groupState=new Map();

    function installCss(){
      if(!doc||doc.getElementById("mowFbArch01aFleetSetupCss"))return;
      const style=doc.createElement("style");style.id="mowFbArch01aFleetSetupCss";style.textContent=`body.mow-r90-open{overflow:hidden}.mow-r90-button{display:inline-flex!important;align-items:center;gap:8px}.mow-r90-badge{min-width:38px;padding:2px 7px;border-radius:999px;background:rgba(255,255,255,.12);font-size:12px;font-weight:800}.mow-r90-button.has-pending .mow-r90-badge{background:#7d4d12;color:#ffe4b5}.mow-r90-modal{position:fixed;inset:0;z-index:10050;display:none}.mow-r90-modal.is-open{display:block}.mow-r90-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.68)}.mow-r90-panel{position:absolute;top:4vh;bottom:4vh;left:50%;transform:translateX(-50%);width:min(82vw,1200px);background:#15181e;border:1px solid rgba(255,255,255,.2);border-radius:16px;display:flex;flex-direction:column;box-shadow:0 24px 80px #000}.mow-r90-head{display:flex;gap:20px;align-items:flex-start;padding:20px 22px;border-bottom:1px solid rgba(255,255,255,.12)}.mow-r90-head h2{margin:0}.mow-r90-hint{margin:5px 0 0;color:#b8c0cd}.mow-r90-close{margin-left:auto}.mow-r90-content{padding:18px 22px;overflow:auto}.mow-r90-group{border:1px solid rgba(255,255,255,.13);border-radius:12px;margin-bottom:14px;background:rgba(255,255,255,.025)}.mow-r90-group summary{cursor:pointer;padding:14px 16px;display:flex;justify-content:space-between;font-weight:800}.mow-r90-groupbody{padding:0 14px 14px}.mow-r90-row{border-top:1px solid rgba(255,255,255,.1);padding:14px 2px}.mow-r90-row:first-child{border-top:0}.mow-r90-rowhead{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:9px}.mow-r90-state{font-size:12px;padding:3px 8px;border-radius:999px;background:#684414}.mow-r90-state.ok{background:#225837}.mow-r90-row select,.mow-r90-row input{width:100%;box-sizing:border-box;min-height:42px;padding:9px 11px;border:1px solid rgba(255,255,255,.2);border-radius:10px;background:#0d1219;color:#eef3f8;font:inherit;outline:none;color-scheme:dark}.mow-r90-row select:focus,.mow-r90-row input:focus{border-color:var(--accent,#5aa9ff);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent,#5aa9ff) 24%,transparent)}.mow-r90-power-label{display:grid;gap:5px}.mow-r90-fixed-target{display:grid;gap:4px;padding:10px 12px;border:1px solid rgba(255,255,255,.13);border-radius:9px;background:rgba(255,255,255,.035)}.mow-r90-fixed-target small{margin:0;color:#aeb7c5}.mow-r90-name{display:grid;grid-template-columns:1fr auto;gap:9px;align-items:end;margin-bottom:10px}.mow-r90-name label{display:grid;gap:5px}.mow-r90-row small{display:block;margin-top:5px;color:#f0b873}@media(max-width:760px){.mow-r90-panel{inset:0;width:100%;transform:none;border-radius:0}.mow-r90-head{padding:14px}.mow-r90-content{padding:12px}.mow-r90-name{grid-template-columns:1fr}.mow-r90-name button{width:100%}.mow-r90-row select,.mow-r90-row input{min-height:48px;font-size:16px}}`;
      doc.head.appendChild(style);
    }
    function installButton(){
      const existing=doc&&doc.getElementById("mowFleetSetupButton");
      if(existing){if(existing.dataset.fbarchOwner!==OWNER_ID)throw new Error("Fleet Setup button already exists without the central owner marker");return existing;}
      const bar=doc&&doc.querySelector("#mowFleetActionsBar .mow-fleet-actions-main");if(!bar)return null;
      const button=doc.createElement("button");button.type="button";button.id="mowFleetSetupButton";button.className="mow-r90-button";button.dataset.fbarchOwner=OWNER_ID;button.innerHTML='<span class="mow-r90-btnlabel"></span><span class="mow-r90-badge">—</span>';
      const help=doc.getElementById("mowOpenHelp");bar.insertBefore(button,help||null);return button;
    }
    function installModal(){
      const existing=doc&&doc.getElementById("mowFleetSetupModal");
      if(existing){if(existing.dataset.fbarchOwner!==OWNER_ID)throw new Error("Fleet Setup modal already exists without the central owner marker");return existing;}
      const modal=doc.createElement("div");modal.className="mow-r90-modal";modal.id="mowFleetSetupModal";modal.dataset.fbarchOwner=OWNER_ID;modal.setAttribute("aria-hidden","true");modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");modal.innerHTML='<div class="mow-r90-backdrop" data-r90-close></div><div class="mow-r90-panel"><div class="mow-r90-head"><div><h2 class="mow-r90-title"></h2><p class="mow-r90-hint"></p></div><button type="button" class="mow-r90-close" data-r90-close></button></div><div class="mow-r90-content"></div></div>';
      doc.body.appendChild(modal);return modal;
    }
    function mount(){if(mounted)return true;if(!doc)return false;installCss();if(!installButton()||!installModal())return false;mounted=true;return true;}
    function content(){return doc&&doc.querySelector('#mowFleetSetupModal[data-fbarch-owner="'+OWNER_ID+'"] .mow-r90-content');}
    function focusDescriptor(element){
      if(!element||!element.closest||!element.closest("#mowFleetSetupModal .mow-r90-content"))return null;
      const attrs=["data-r90-assignment-select","data-r90-name-id","data-r90-generate-id"];
      for(const name of attrs){if(element.hasAttribute&&element.hasAttribute(name))return {name,value:element.getAttribute(name)||"",kind:element.dataset.r90NameKind||null,setup:element.dataset.r90SetupId||null};}
      const details=element.closest("details[data-r90-group]");return details?{group:details.dataset.r90Group}:null;
    }
    function captureUi(event){const hostContent=content();if(!hostContent)return;lastScrollTop=hostContent.scrollTop;lastFocus=focusDescriptor(event&&event.target)||focusDescriptor(doc.activeElement);hostContent.querySelectorAll("details[data-r90-group]").forEach(details=>groupState.set(details.dataset.r90Group,!!details.open));}
    function findFocus(hostContent,descriptor){
      if(!descriptor)return null;
      if(descriptor.group)return hostContent.querySelector(`details[data-r90-group="${CSS.escape(descriptor.group)}"] > summary`);
      const base=`[${descriptor.name}="${CSS.escape(descriptor.value)}"]`;if(descriptor.name==="data-r90-name-id")return hostContent.querySelector(`${base}[data-r90-name-kind="${CSS.escape(descriptor.kind||"")}"]`);return hostContent.querySelector(base);
    }
    function restoreUi(){
      const hostContent=content();if(!hostContent)return;
      hostContent.querySelectorAll("details[data-r90-group]").forEach(details=>{if(groupState.has(details.dataset.r90Group))details.open=!!groupState.get(details.dataset.r90Group);});
      hostContent.scrollTop=lastScrollTop;
      const target=findFocus(hostContent,lastFocus);if(target&&typeof target.focus==="function"){try{target.focus({preventScroll:true});}catch(error){target.focus();}}
    }
    function applyFocusRequest(){
      const modal=doc&&doc.getElementById("mowFleetSetupModal"),request=focusRequest;if(!modal||!request)return;
      let element=null;if(request.assignmentId)element=modal.querySelector(`[data-r90-assignment="${CSS.escape(request.assignmentId)}"]`);
      if(element){element.closest("details")?.setAttribute("open","");if(typeof element.scrollIntoView==="function")element.scrollIntoView({block:"center"});}
      focusRequest=null;
    }
    function render(projection){
      currentProjection=projection||currentProjection;if(!mount())return false;
      const modal=doc.getElementById("mowFleetSetupModal"),button=doc.getElementById("mowFleetSetupButton"),hostContent=content(),model=projectedModel(currentProjection);
      captureUi();
      modal.querySelector(".mow-r90-title").textContent=tr("title");modal.querySelector(".mow-r90-hint").textContent=tr("hint");modal.querySelector(".mow-r90-close").textContent=tr("close");button.querySelector(".mow-r90-btnlabel").textContent=tr("button");
      if(!model){hostContent.innerHTML="";button.querySelector(".mow-r90-badge").textContent="—";button.classList.remove("has-pending");return true;}
      const workspace=buildWorkspace(model);hostContent.innerHTML=workspace.html;button.querySelector(".mow-r90-badge").textContent=workspace.total?`${workspace.total-workspace.pending}/${workspace.total}`:"—";button.title=workspace.pending?`${workspace.pending} ${tr("pending")}`:tr("ready");button.classList.toggle("has-pending",workspace.pending>0);
      restoreUi();applyFocusRequest();renderCount+=1;return true;
    }
    function syncAfterCommand(reason){
      commandCount+=1;const api=controller&&controller.currentProjection?controller:null,current=api&&api.currentProjection?api.currentProjection():null,model=commands()&&commands().currentModel?commands().currentModel():null;
      if(api&&(!current||Number(current.official&&current.official.revision||0)!==Number(model&&model.revision||0)))api.rebuild(reason);
      currentProjection=api&&api.currentProjection?api.currentProjection():currentProjection;render(currentProjection);
    }
    function open(options){
      focusRequest=options||null;mount();const api=commands();if(api&&api.prepare)api.prepare();syncAfterCommand("fleet_setup_open");const modal=doc.getElementById("mowFleetSetupModal");modal.classList.add("is-open");modal.setAttribute("aria-hidden","false");doc.body.classList.add("mow-r90-open");isOpen=true;render(currentProjection);return true;
    }
    function close(){const modal=doc&&doc.getElementById("mowFleetSetupModal");if(modal){modal.classList.remove("is-open");modal.setAttribute("aria-hidden","true");}doc&&doc.body&&doc.body.classList.remove("mow-r90-open");isOpen=false;return true;}
    function handleClick(event){
      const target=event.target&&event.target.closest?event.target.closest("#mowFleetSetupButton,[data-r90-close],[data-r90-generate-id]"):null;if(!target)return;
      captureUi(event);
      if(target.id==="mowFleetSetupButton"){open();return;}
      if(target.hasAttribute("data-r90-close")){close();return;}
      const api=commands();if(!api)return;
      if(target.hasAttribute("data-r90-generate-id")){api.generateName(target.dataset.r90GenerateKind,target.dataset.r90GenerateId);syncAfterCommand("fleet_setup_generate_name");}
    }
    function handleChange(event){
      const target=event.target;if(!target||!target.closest||!target.closest("#mowFleetSetupModal"))return;captureUi(event);const api=commands();if(!api)return;
      if(target.hasAttribute("data-r90-assignment-select")){api.updateAssignment(target.dataset.r90AssignmentSelect,target.value);syncAfterCommand("fleet_setup_assignment");}
      else if(target.hasAttribute("data-r90-deathgalley-power")){api.setDeathgalleyPower(target.dataset.r90DeathgalleyPower,target.value);syncAfterCommand("fleet_setup_deathgalley_power");}
      else if(target.hasAttribute("data-r90-name-id")){api.setName(target.dataset.r90NameKind,target.dataset.r90NameId,target.value);syncAfterCommand("fleet_setup_name");}
    }
    function handleToggle(event){const details=event.target&&event.target.matches&&event.target.matches("details[data-r90-group]")?event.target:null;if(details)groupState.set(details.dataset.r90Group,!!details.open);}
    function handleScroll(event){if(event.target===content())lastScrollTop=event.target.scrollTop;}
    function bind(options){
      if(bound)return true;if(!mount())return false;controller=options&&options.controller||controller;
      doc.addEventListener("click",handleClick,true);doc.addEventListener("change",handleChange,true);doc.addEventListener("toggle",handleToggle,true);content().addEventListener("scroll",handleScroll,{passive:true});
      bound=true;bindCount+=1;
      const facade=Object.freeze({build:BUILD.build,open,close,render:()=>render(controller&&controller.currentProjection?controller.currentProjection():currentProjection),RESOURCE_NAME_PROFILE:commands()&&commands().RESOURCE_NAME_PROFILE||{}});
      root.MowFleetSetup=facade;root.MOW_FLEET_RELEASE90_SETUP=facade;return true;
    }
    function status(){return Object.freeze({build:BUILD,owner_id:OWNER_ID,mounted,bound,is_open:isOpen,render_count:renderCount,bind_count:bindCount,command_count:commandCount,projection_revision:Number(currentProjection&&currentProjection.official&&currentProjection.official.revision||0),button_count:doc?doc.querySelectorAll(`#mowFleetSetupButton[data-fbarch-owner="${OWNER_ID}"]`).length:0,modal_count:doc?doc.querySelectorAll(`#mowFleetSetupModal[data-fbarch-owner="${OWNER_ID}"]`).length:0,legacy_autonomous:false});}
    return Object.freeze({BUILD,OWNER_ID,mount,bind,render,open,close,status,currentProjection:()=>currentProjection});
  }

  const surface=createSurface(root);
  const api=Object.freeze({BUILD,OWNER_ID,createSurface,surface,mount:()=>surface.mount(),bind:options=>surface.bind(options),render:projection=>surface.render(projection),open:options=>surface.open(options),close:()=>surface.close(),status:()=>surface.status()});
  root.MowFleetSetupSurface=api;root.MOW_FB_ARCH_01A_FLEET_SETUP_SURFACE=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
