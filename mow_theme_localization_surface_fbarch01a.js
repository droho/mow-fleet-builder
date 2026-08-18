(function(root){
  "use strict";
  const BUILD=Object.freeze({work_package:"FB-ARCH-01A",increment:"B6",component:"theme_localization_surface",version:"0.1.0-private",build:"1.8.1-dev.6+fb-arch-01a-b6"});
  let mounted=false,bound=false,renderCount=0,bindCount=0,lastReason="",controller=null;
  let media=null,mediaHandler=null;
  function doc(){return root.document||null;}
  function i18n(){return root.MOW_I18N||null;}
  function theme(){return root.MOW_VISUAL_THEME||null;}
  function refreshConsumers(){try{root.MOW_VISUAL1_ACCORDION?.refresh?.();}catch(e){}try{root.MOW_MAINLINE_LOCALE_A11Y?.sync?.();}catch(e){}}
  function render(_projection,options){const I=i18n(),T=theme();if(!I||typeof I.refresh!=="function")throw new Error("Central localization service is unavailable.");if(!T||typeof T.prepare!=="function")throw new Error("Central theme service is unavailable.");if(!T.prepare())throw new Error("Theme activation blocked until accepted legacy-storage migration is complete.");I.refresh();T.refresh?.();refreshConsumers();mounted=true;renderCount+=1;lastReason=String(options&&options.reason||"");return status();}
  function onLanguageClick(event){const button=event?.target?.closest?.("#langPL,#langEN");if(!button)return;const lang=button.id==="langPL"?"pl":"en",I=i18n();if(!I||typeof I.setLang!=="function")return;const before=I.getLang?.();I.setLang(lang);theme()?.refresh?.();refreshConsumers();if(before===lang&&controller?.rebuild)controller.rebuild("language_refresh");}
  function onThemeChange(event){const select=event?.target?.closest?.("#mowVisualThemeSelect");if(select)theme()?.setPreference?.(select.value);}
  function onSystemThemeChange(){const T=theme();if(T?.getPreference?.()==="system")T.setPreference("system",{persist:false});}
  function bind(context){if(bound)return status();controller=context&&context.controller||null;const d=doc();if(!d)throw new Error("Central theme/localization surface requires document.");d.addEventListener("click",onLanguageClick,false);d.addEventListener("change",onThemeChange,false);d.addEventListener("mow:languagechange",()=>controller?.rebuild?.("language_change"),false);media=theme()?.mediaQuery||null;if(media){mediaHandler=onSystemThemeChange;if(typeof media.addEventListener==="function")media.addEventListener("change",mediaHandler);else if(typeof media.addListener==="function")media.addListener(mediaHandler);}bound=true;bindCount+=1;return status();}
  function status(){const d=doc(),I=i18n(),T=theme();return Object.freeze({build:BUILD,mounted,bound,render_count:renderCount,bind_count:bindCount,last_reason:lastReason,language:I?.getLang?.()||null,theme_preference:T?.getPreference?.()||null,theme_resolved:T?.getResolved?.()||null,locale_buttons:d?.querySelectorAll?.("#langPL,#langEN")?.length||0,theme_controls:d?.querySelectorAll?.("#mowVisualThemeSelect")?.length||0,legacy_i18n_autonomous:I?.autonomous!==false,legacy_theme_autonomous:T?.autonomous!==false,legacy_accordion_localization_autonomous:root.MOW_VISUAL1_ACCORDION?.localization_autonomous!==false,legacy_locale_a11y_autonomous:root.MOW_MAINLINE_LOCALE_A11Y?.autonomous!==false});}
  const api=Object.freeze({BUILD,render,bind,status});root.MowThemeLocalizationSurface=api;root.MOW_FB_ARCH_01A_THEME_LOCALIZATION_SURFACE=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
