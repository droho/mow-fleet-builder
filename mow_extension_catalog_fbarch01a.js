(function(root){
  "use strict";
  const BUILD=Object.freeze({work_package:"FB-ARCH-01A",increment:"B1",component:"official_registry_bootstrap",version:"0.1.0-private",build:"1.8.1-dev.1+fb-arch-01a-b1"});
  const registry=root.MOW_FB_ARCH_01A_EXTENSION_REGISTRY;
  if(!registry)throw new Error("FB-ARCH-01A extension registry is unavailable");
  registry.registerPackage({
    package_id:"official.mow.fleet_builder",
    version:"1.8.1",
    title:"Man O' War Fleet Builder official mainline",
    status:"official",
    official:true,
    builder_only:false,
    source:{baseline_sha256:"98dcf3bda7f78b7489db99831ad378b9e03af0683c49bb943254c0ad492ee32e",public_commit:"587f6339285dbe50752fb208c6b7d4e5688facb5"}
  });
  [
    ["empire","Empire","Empire"],
    ["bretonnia","Bretonnia","Bretonnia"],
    ["dwarfs","Dwarfs","Dwarfs"],
    ["elves","High Elves","Elves"],
    ["dark_elves","Dark Elves","DarkElves"],
    ["orcs","Orcs","Orcs"],
    ["chaos","Chaos","Chaos"],
    ["chaos_dwarfs","Chaos Dwarfs","ChaosDwarfs"],
    ["skaven","Skaven","Skaven"],
    ["norse","Norse","Norse"],
    ["undead","Undead","Undead"]
  ].forEach(([suffix,label,primary])=>registry.registerFleet({
    fleet_id:`official.fleet.${suffix}`,
    package_id:"official.mow.fleet_builder",
    label,
    support_scope:"portable",
    official:true,
    enabled_default:true,
    extensions:{aliases:{primary_faction_id:primary}}
  }));
  registry.registerSource({source_id:"source.community.rulebook",package_id:"official.mow.fleet_builder",title:"MOW Community Rulebook v0.1",version:"0.1",status:"canonical_source"});
  registry.registerSource({source_id:"source.community.annual",package_id:"official.mow.fleet_builder",title:"A4 MOW Community Annual v0.1",version:"0.1",status:"canonical_source"});
  registry.registerModule({
    module_id:"community.annual.expanded_wizards",
    package_id:"official.mow.fleet_builder",
    version:"0.1.0",
    label:"Community Annual Expanded Wizards",
    maturity:"accepted",
    complete:true,
    active_default:false,
    source_refs:["source.community.annual"],
    extensions:{aliases:{ruleset_module_ids:["annual_expanded_wizards"]}}
  });
  const graph=registry.validateGraph();
  if(!graph.ok)throw new Error(`FB-ARCH-01A official registry bootstrap failed: ${JSON.stringify(graph.errors)}`);
  const api=Object.freeze({BUILD,snapshot:()=>registry.snapshot(),graph:()=>registry.validateGraph()});
  root.MOW_FB_ARCH_01A_OFFICIAL_CATALOG=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
