/*
 * Man O' War Fleet Builder — VISUAL-3 merge-candidate UI controller.
 * Exactly one active asset owns visual-only behavior. Internal modules
 * remain isolated IIFEs: one owns desktop accordion continuity, and one
 * owns locale scaffolding plus the UI-only theme preference.
 */

/* ==========================================================================
   OPTIONAL RULES / BUILDER TOOLS ACCORDION OWNER
   Source lineage: mow_builder_visual1_behavior.js
   ========================================================================== */

(function(root){
  "use strict";

  const doc = root.document;
  if(!doc) return;

  const DESKTOP_QUERY = "(min-width: 701px)";
  const state = { optional:false, tools:false };
  let scheduled = false;

  function byId(id){ return doc.getElementById(id); }
  function isDesktop(){
    try{return !!root.matchMedia && root.matchMedia(DESKTOP_QUERY).matches;}
    catch(e){return (root.innerWidth || 0) >= 701;}
  }
  function isEnglish(){
    try{return !!(root.MOW_I18N && root.MOW_I18N.getLang && root.MOW_I18N.getLang() === "en");}
    catch(e){return false;}
  }
  function labels(){
    return isEnglish()
      ? {
          optionalTitle:"Optional rules",
          toolsTitle:"Builder tools",
          fleetTitle:"Fleet",
          active:"Active",
          activeCompact:"active",
          rulesetLabel:"Ruleset",
          expandOptional:"Expand optional rules",
          collapseOptional:"Collapse optional rules",
          expandTools:"Expand builder tools",
          collapseTools:"Collapse builder tools"
        }
      : {
          optionalTitle:"Zasady opcjonalne",
          toolsTitle:"Narzędzia buildera",
          fleetTitle:"Flota",
          active:"Aktywne",
          activeCompact:"aktywne",
          rulesetLabel:"Ruleset",
          expandOptional:"Rozwiń zasady opcjonalne",
          collapseOptional:"Zwiń zasady opcjonalne",
          expandTools:"Rozwiń narzędzia buildera",
          collapseTools:"Zwiń narzędzia buildera"
        };
  }
  function visibleCheckedCount(rootEl){
    if(!rootEl) return 0;
    return Array.from(rootEl.querySelectorAll("input[type='checkbox']")).filter(function(cb){
      const row = cb.closest(".mowUpToggle, .mowToolsToggleRow, label, .row");
      if(row && (row.hidden || row.classList.contains("is-hidden") || getComputedStyle(row).display === "none")) return false;
      return cb.checked;
    }).length;
  }
  function currentRulesetLabel(){
    const wrap = byId("mowBatch90bRuleset");
    const select = wrap && wrap.querySelector("select");
    const option = select && select.options && select.options[select.selectedIndex];
    return String(option && option.textContent || "").trim();
  }
  function optionalRuleProgress(rootEl){
    if(!rootEl) return {checked:0, total:0};

    /* Count the rule rows actually offered for the current fleet. The compact
       ruleset card reports all configured modules, including a faction-specific
       Citadel Journal toggle whose outer wrapper can be hidden. Reading that
       legacy ratio produced values such as 2/3 for Chaos Dwarfs even though the
       UI correctly exposes only Shoreforts and Ships' Boats. */
    const rows = Array.from(rootEl.children).filter(function(row){
      if(!row || !row.querySelector || !row.querySelector("input[type='checkbox']")) return false;
      if(row.hidden || row.classList.contains("is-hidden")) return false;
      const style = getComputedStyle(row);
      return style.display !== "none" && style.visibility !== "hidden";
    });
    const inputs = rows.map(function(row){
      return row.querySelector("input[type='checkbox']");
    }).filter(Boolean);
    return {checked:inputs.filter(function(cb){return cb.checked;}).length, total:inputs.length};
  }
  function compactRulesetCard(){
    const card = byId("mowBatch90bRuleset");
    if(!card) return;
    card.classList.add("mow-visual-ruleset-compact");
    const label = card.querySelector(".mow-b90-rules-label");
    const value = labels().rulesetLabel;
    if(label && label.textContent !== value) label.textContent = value;
  }
  function normalizeThemeKey(value){
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }
  function updateKpiAccents(){
    const alliesTotal = byId("alliesTotal");
    const alliesCard = alliesTotal && alliesTotal.closest(".kpi");
    if(!alliesCard) return;
    const select = byId("allyFaction");
    const faction = String(select && select.value || "").split("|")[0].trim();
    const themes = root.MOW_THEMES || {};
    const wanted = normalizeThemeKey(faction);
    const key = Object.keys(themes).find(function(candidate){return normalizeThemeKey(candidate) === wanted;});
    const accent = key && themes[key] && themes[key].accent;
    if(accent) alliesCard.style.setProperty("--mow-kpi-accent", accent);
    else alliesCard.style.removeProperty("--mow-kpi-accent");
    alliesCard.dataset.allyAccent = key || "main";
  }
  function groupParts(kind){
    const optional = kind === "optional";
    return {
      group:byId(optional ? "mowOptionalRulesGroup" : "mowBuilderToolsGroup"),
      rows:byId(optional ? "mowOptionalRulesRows" : "mowBuilderToolsRows"),
      toggle:byId(optional ? "mowOptionalRulesToggle" : "mowBuilderToolsToggle"),
      optional
    };
  }
  function applyDesktopGroup(kind){
    const parts = groupParts(kind);
    if(!parts.group || !parts.rows || !parts.toggle) return;

    if(!isDesktop()){
      parts.group.classList.remove("is-visual-collapsed");
      return;
    }

    const open = !!state[kind];
    parts.group.classList.toggle("is-visual-collapsed", !open);
    const expanded = open ? "true" : "false";
    if(parts.toggle.getAttribute("aria-expanded") !== expanded){
      parts.toggle.setAttribute("aria-expanded", expanded);
    }
    const text = labels();
    const aria = parts.optional
      ? (open ? text.collapseOptional : text.expandOptional)
      : (open ? text.collapseTools : text.expandTools);
    if(parts.toggle.getAttribute("aria-label") !== aria){
      parts.toggle.setAttribute("aria-label", aria);
    }
  }
  function ensureFleetSectionHeading(){
    const grid = byId("mowSetupGrid");
    const fleet = byId("mowFleetSelectorBlock");
    if(!grid || !fleet) return;

    let heading = grid.querySelector(".mowFleetSectionHeading");
    if(!heading){
      heading = doc.createElement("div");
      heading.className = "section mowFleetSectionHeading";
      heading.style.order = "-2";
      const title = doc.createElement("h3");
      title.className = "mowFleetSectionTitle";
      heading.appendChild(title);
    }
    if(heading.parentElement !== grid || heading.nextElementSibling !== fleet){
      grid.insertBefore(heading, fleet);
    }

    const inlineLabel = Array.from(fleet.children).find(function(el){
      return el.classList && el.classList.contains("muteline") && el.getAttribute("data-i18n") === "fleet_pl_label";
    });
    if(inlineLabel) inlineLabel.classList.add("mowFleetInlineLabel");

    const title = heading.querySelector(".mowFleetSectionTitle");
    const value = labels().fleetTitle;
    if(title && title.textContent !== value) title.textContent = value;
  }

  function normalizeOptionalRuleOrder(){
    const rows = byId("mowOptionalRulesRows");
    if(!rows) return;
    const ids = [
      "mowCitadelJournalToggle_wrap",
      "mowExpandedShorefortsToggle_wrap",
      "mowShipsBoatsToggle_wrap"
    ];
    const nodes = ids.map(byId).filter(function(node){ return node && node.parentElement === rows; });
    const current = Array.from(rows.children)
      .filter(function(node){ return ids.includes(node.id); })
      .map(function(node){ return node.id; });
    const desired = nodes.map(function(node){ return node.id; });
    if(current.join("|") === desired.join("|")) return;
    nodes.forEach(function(node){ rows.appendChild(node); });
  }

  function normalizeCitadelJournalSectionOrder(){
    const shoreforts = byId("sec_CJ_SHOREFORTS");
    const boats = byId("sec_CJ_BOATS");
    const faction = Array.from(doc.querySelectorAll('.section[id^="sec_CJ_"]')).filter(function(section){
      return section !== shoreforts && section !== boats;
    });
    const desired = faction.concat([shoreforts, boats].filter(Boolean));
    if(desired.length < 2) return;
    const parent = desired[0].parentElement;
    if(!parent || desired.some(function(node){ return node.parentElement !== parent; })) return;

    const wanted = new Set(desired);
    const current = Array.from(parent.children).filter(function(node){ return wanted.has(node); });
    if(current.length !== desired.length) return;
    if(current.every(function(node, index){ return node === desired[index]; })) return;

    const marker = doc.createComment("mow-visual1e-cj-order");
    parent.insertBefore(marker, current[0]);
    const fragment = doc.createDocumentFragment();
    desired.forEach(function(node){ fragment.appendChild(node); });
    parent.insertBefore(fragment, marker);
    marker.remove();
  }

  function updateLabelsAndCounts(){
    ensureFleetSectionHeading();
    normalizeOptionalRuleOrder();
    normalizeCitadelJournalSectionOrder();
    compactRulesetCard();
    updateKpiAccents();
    const text = labels();
    const optionalTitle = byId("mowOptionalRulesTitle");
    const toolsTitle = byId("mowBuilderToolsTitle");
    const optionalStatus = byId("mowOptionalRulesStatus");
    const toolsStatus = byId("mowBuilderToolsStatus");
    const optionalRows = byId("mowOptionalRulesRows");
    const toolsRows = byId("mowBuilderToolsRows");

    if(optionalTitle && optionalTitle.textContent !== text.optionalTitle) optionalTitle.textContent = text.optionalTitle;
    if(toolsTitle && toolsTitle.textContent !== text.toolsTitle) toolsTitle.textContent = text.toolsTitle;

    if(optionalStatus){
      const rule = currentRulesetLabel();
      const progress = optionalRuleProgress(optionalRows);
      const ratio = progress.total ? `${progress.checked}/${progress.total} ${text.activeCompact}` : `0 ${text.activeCompact}`;
      const value = rule ? `${rule} · ${ratio}` : ratio;
      if(optionalStatus.textContent !== value) optionalStatus.textContent = value;
    }
    if(toolsStatus){
      const value = `${text.active}: ${visibleCheckedCount(toolsRows)}`;
      if(toolsStatus.textContent !== value) toolsStatus.textContent = value;
    }

    applyDesktopGroup("optional");
    applyDesktopGroup("tools");
  }
  function schedule(){
    if(scheduled) return;
    scheduled = true;
    root.setTimeout(function(){
      scheduled = false;
      updateLabelsAndCounts();
    }, 0);
  }
  function bindDesktopToggle(kind, id){
    const toggle = byId(id);
    if(!toggle || toggle.__mowVisualDesktopBound) return;
    toggle.addEventListener("click", function(event){
      if(!isDesktop()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      state[kind] = !state[kind];
      updateLabelsAndCounts();
    }, true);
    toggle.__mowVisualDesktopBound = true;
  }
  function boot(){
    bindDesktopToggle("optional", "mowOptionalRulesToggle");
    bindDesktopToggle("tools", "mowBuilderToolsToggle");
    updateLabelsAndCounts();

    doc.addEventListener("change", schedule, true);
    ["langPL", "langEN"].forEach(function(id){
      const el = byId(id);
      if(el && !el.__mowVisualLangBound){
        el.addEventListener("click", schedule);
        el.__mowVisualLangBound = true;
      }
    });
    root.addEventListener("resize", schedule, {passive:true});

    try{
      const media = root.matchMedia(DESKTOP_QUERY);
      const onChange = schedule;
      if(media.addEventListener) media.addEventListener("change", onChange);
      else if(media.addListener) media.addListener(onChange);
    }catch(e){}

    /* Observe only structural remounts. Watching hidden/aria attributes here
       would fight the original mobile accordion observer and starve the UI. */
    if(root.MutationObserver){
      const host = byId("mowSetupOptionsBlock");
      if(host){
        const observer = new MutationObserver(schedule);
        observer.observe(host, {childList:true, subtree:true});
      }
      const setupBody = doc.querySelector("#sec_setup > .bd");
      if(setupBody){
        const sectionObserver = new MutationObserver(schedule);
        sectionObserver.observe(setupBody, {childList:true, subtree:false});
      }
    }

    [100, 350, 900, 1700].forEach(function(delay){ root.setTimeout(updateLabelsAndCounts, delay); });
  }

  root.MOW_VISUAL1_ACCORDION = Object.freeze({
    build:"release90-visual3-merge-candidate-2026-07-27",
    refresh:updateLabelsAndCounts,
    getState:function(){return {optional:!!state.optional, tools:!!state.tools};}
  });

  if(doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})(typeof window !== "undefined" ? window : globalThis);

/* ==========================================================================
   LOCALE SCAFFOLD / THEME PREFERENCE OWNER
   Source lineage: v2d1_controls.js
   ========================================================================== */

/*
 * Man O' War Fleet Builder — VISUAL-2D.1 header controls.
 * Theme preference remains UI-only and never enters fleet documents, exports
 * or shared persistence.
 *
 * The header locale scaffold is ready for a future French translation. FR is
 * deliberately hidden and disabled until the translation layer explicitly
 * supports it, so the current build never advertises a non-working language.
 */
(function(root){
  "use strict";

  const BUILD = "release90-visual3-merge-candidate-2026-07-27";
  const STORAGE_KEY = "mow_visual_theme_v1";
  const VALUES = Object.freeze(["light", "dark", "system"]);
  const VISUAL_CLASS = "mow-ecosystem-visual";
  const LOCALES = Object.freeze([
    Object.freeze({id:"pl", buttonId:"langPL", label:"PL", enabled:true}),
    Object.freeze({id:"en", buttonId:"langEN", label:"EN", enabled:true}),
    Object.freeze({id:"fr", buttonId:"langFR", label:"FR", enabled:false})
  ]);
  const LEGACY_KEYS = Object.freeze([
    "mow_fleet_library_v1",
    "mow_fleet_autosave_v1",
    "mow_fleet_active_saved_id_v1"
  ]);
  const MIGRATION_REPORT_KEY = "mow_fleet_migration_v1_v2_report";
  const media = root.matchMedia ? root.matchMedia("(prefers-color-scheme: dark)") : null;
  let preference = "system";
  let activated = false;
  let migrationTimer = 0;

  function safeGetKey(key){
    try{
      return root.localStorage ? root.localStorage.getItem(key) : null;
    }catch(e){
      return null;
    }
  }

  function safeGet(){
    const value = safeGetKey(STORAGE_KEY);
    return VALUES.includes(value) ? value : "system";
  }

  function safeSet(value){
    try{
      if(root.localStorage) root.localStorage.setItem(STORAGE_KEY, value);
    }catch(e){}
  }

  function resolved(value){
    if(value === "dark" || value === "light") return value;
    return media && media.matches ? "dark" : "light";
  }

  function hasLegacySource(){
    return LEGACY_KEYS.some(function(key){ return safeGetKey(key) != null; });
  }

  function migrationFinished(){
    if(!hasLegacySource()) return true;
    const raw = safeGetKey(MIGRATION_REPORT_KEY);
    if(!raw) return false;
    try{
      const report = JSON.parse(raw);
      return !!(report && report.completedAt);
    }catch(e){
      return false;
    }
  }

  function ensureVisualClass(){
    const body = root.document && root.document.body;
    if(body) body.classList.add(VISUAL_CLASS);
  }

  function currentLanguage(){
    try{
      if(root.MOW_I18N && typeof root.MOW_I18N.getLang === "function"){
        const value = String(root.MOW_I18N.getLang() || "").toLowerCase();
        if(value === "pl" || value === "en" || value === "fr") return value;
      }
      for(const locale of LOCALES){
        const button = root.document && root.document.getElementById(locale.buttonId);
        if(button && button.getAttribute("aria-pressed") === "true") return locale.id;
      }
    }catch(e){}
    const value = String(root.document && root.document.documentElement.lang || "pl").toLowerCase();
    if(value.startsWith("fr")) return "fr";
    if(value.startsWith("en")) return "en";
    return "pl";
  }

  function copy(){
    const language = currentLanguage();
    const all = {
      pl: {
        label: "Motyw",
        hint: "Tylko interfejs; dane floty bez zmian.",
        aria: "Motyw kolorystyczny buildera",
        light: "Jasny",
        dark: "Ciemny — klasyczny",
        system: "Systemowy"
      },
      en: {
        label: "Theme",
        hint: "Interface only; fleet data is unchanged.",
        aria: "Builder colour theme",
        light: "Light",
        dark: "Dark — Classic",
        system: "System"
      },
      fr: {
        label: "Thème",
        hint: "Interface uniquement ; les données de la flotte restent inchangées.",
        aria: "Thème de couleurs du constructeur de flotte",
        light: "Clair",
        dark: "Sombre — classique",
        system: "Système"
      }
    };
    return all[language] || all.pl;
  }

  function syncLocaleScaffold(){
    if(!root.document) return;
    LOCALES.forEach(function(locale){
      const button = root.document.getElementById(locale.buttonId);
      if(!button) return;
      button.dataset.locale = locale.id;
      button.dataset.localeEnabled = locale.enabled ? "true" : "false";
      button.disabled = !locale.enabled;
      button.hidden = !locale.enabled;
      button.setAttribute("aria-disabled", locale.enabled ? "false" : "true");
      if(!locale.enabled) button.setAttribute("tabindex", "-1");
      else button.removeAttribute("tabindex");
    });
  }

  function apply(value, options){
    const next = VALUES.includes(value) ? value : "system";
    const actual = resolved(next);
    preference = next;
    ensureVisualClass();
    const html = root.document && root.document.documentElement;
    if(html){
      html.dataset.themePreference = next;
      html.dataset.theme = actual;
      html.style.colorScheme = actual;
    }
    if(!options || options.persist !== false) safeSet(next);
    syncControl();
    if(root.document && typeof root.CustomEvent === "function"){
      root.document.dispatchEvent(new root.CustomEvent("mow-theme-change", {
        detail: Object.freeze({preference: next, resolved: actual})
      }));
    }
    return actual;
  }

  function makeControl(){
    const row = root.document.createElement("div");
    row.className = "mowThemeControlRow";
    row.id = "mowVisualThemeRow";
    row.innerHTML = [
      '<span class="mowThemeControlIcon" aria-hidden="true">◐</span>',
      '<span class="mowThemeControlCopy">',
      '<span class="mowThemeControlLabel" id="mowVisualThemeLabel"></span>',
      '<span class="mowThemeControlHint" id="mowVisualThemeHint"></span>',
      '</span>',
      '<select id="mowVisualThemeSelect">',
      '<option value="light"></option>',
      '<option value="dark"></option>',
      '<option value="system"></option>',
      '</select>'
    ].join("");
    return row;
  }

  function syncLabels(){
    if(!root.document) return;
    const c = copy();
    const label = root.document.getElementById("mowVisualThemeLabel");
    const hint = root.document.getElementById("mowVisualThemeHint");
    const select = root.document.getElementById("mowVisualThemeSelect");
    if(label) label.textContent = c.label;
    if(hint) hint.textContent = c.hint;
    if(select){
      select.setAttribute("aria-label", c.aria);
      select.title = c.hint;
      const labels = {light:c.light, dark:c.dark, system:c.system};
      Array.from(select.options).forEach(function(option){
        option.textContent = labels[option.value] || option.value;
      });
    }
  }

  function syncControl(){
    const select = root.document && root.document.getElementById("mowVisualThemeSelect");
    if(select && select.value !== preference) select.value = preference;
  }

  function mount(){
    if(!activated || !root.document) return false;
    syncLocaleScaffold();
    const host = root.document.getElementById("mowHeaderThemeHost");
    if(!host) return false;
    let row = root.document.getElementById("mowVisualThemeRow");
    if(!row) row = makeControl();
    if(row.parentElement !== host) host.appendChild(row);
    const select = root.document.getElementById("mowVisualThemeSelect");
    if(select && !select.__mowThemeBound){
      select.addEventListener("change", function(){ apply(select.value); });
      select.__mowThemeBound = true;
    }
    syncLabels();
    syncControl();
    return true;
  }

  function onSystemChange(){
    if(activated && preference === "system") apply("system", {persist:false});
  }

  function activate(){
    if(activated) return;
    activated = true;
    preference = safeGet();
    syncLocaleScaffold();
    apply(preference, {persist:false});
    mount();
    [100, 350, 900, 1700].forEach(function(delay){ root.setTimeout(mount, delay); });
    LOCALES.filter(function(locale){ return locale.enabled; }).forEach(function(locale){
      const button = root.document.getElementById(locale.buttonId);
      if(button && !button.__mowThemeLangBound){
        button.addEventListener("click", function(){
          root.setTimeout(function(){ mount(); syncLabels(); }, 0);
        });
        button.__mowThemeLangBound = true;
      }
    });
    if(media){
      if(typeof media.addEventListener === "function") media.addEventListener("change", onSystemChange);
      else if(typeof media.addListener === "function") media.addListener(onSystemChange);
    }
  }

  function boot(){
    preference = safeGet();
    syncLocaleScaffold();
    if(migrationFinished()){
      activate();
      return;
    }
    const started = Date.now();
    migrationTimer = root.setInterval(function(){
      if(migrationFinished() || Date.now() - started > 20000){
        root.clearInterval(migrationTimer);
        migrationTimer = 0;
        activate();
      }
    }, 100);
  }

  root.MOW_HEADER_LOCALES = LOCALES;
  root.MOW_VISUAL_THEME = Object.freeze({
    BUILD,
    STORAGE_KEY,
    values: VALUES,
    locales: LOCALES,
    getPreference: function(){ return preference; },
    getResolved: function(){ return resolved(preference); },
    isActivated: function(){ return activated; },
    setPreference: function(value){
      if(!activated) activate();
      return apply(value);
    },
    mount
  });

  if(root.document){
    if(root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", boot, {once:true});
    else boot();
  }
})(typeof window !== "undefined" ? window : globalThis);
