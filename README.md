# Man O' War Fleet Builder

An unofficial, bilingual fleet-building tool for Games Workshop's classic **Man O' War** tabletop game.

## Live version

https://mowfleetbuilder.com/

## Main features

- Polish and English interface
- Fleet lists for all supported factions
- Automatic points calculation and live fleet validation
- Fleet Setup workspace for flagships, characters, resources and pre-game decisions
- Unit Preview, Fleet Analysis and Scenario Generator
- Core and Citadel Journal rules support
- Local autosave and named fleet library
- Save, Save As, Load and Duplicate workflows
- Optional custom names for ships and characters
- Lore-based ship and character name generators
- Hierarchical roster preview with assignment details
- Light, Dark — Classic and System themes
- Mobile-friendly layout and touch controls
- Share Fleet and roster clipboard tools
- Full local-library backup export/import using `.mowfleets`

## Local data and privacy

Saved fleets are stored only in the browser's local storage. No fleet data is uploaded to a server.

Use **Export all** in **My fleets** to create a `.mowfleets` backup before clearing browser data or moving to another device. The backup can be imported on a phone, tablet or desktop browser.

The published website uses Cloudflare Web Analytics for aggregate visits and page-view statistics.

## Current release

**Fleet Builder 1.8 — RELEASE-90 PUBLIC-1 — 2026-07-27**

This release brings the current RELEASE-90 mainline to the public GitHub Pages build. It includes the accepted VISUAL-3 interface, HOTFIX-90I Ruleset stability correction and publication-specific Polish-language cleanup.

## What's new since the previously published step74 build

- Dedicated Fleet Setup workspace with legal target assignments and pre-game decisions
- Character names, manual editing and character-name generation
- Hierarchical roster showing assigned characters, crew and upgrades under ships
- Stable text selection, caret and scroll in Roster Preview
- Correct grouping of multi-model flyer purchases
- Default fresh ruleset changed to Core + Citadel Journal
- Extensive Chaos, Goblin Shaman, Great Taurus, Skaven and Norse corrections
- Hardened save/load, Save As, duplicate, migration and local-library behavior
- Parchment Light, Dark — Classic and System themes
- Redesigned desktop, mobile, modal, accessibility and print presentation
- Consolidated active visual runtime: one CSS file and one visual JavaScript file
- Updated Polish interface labels, accessibility text, roster structure and Live Checks grammar

Unit Preview, Fleet Analysis, Scenario Generator, My Fleets, Share Fleet and `.mowfleets` backup existed in the previous public version and have been improved rather than introduced from scratch.

## Publication note

The internal `mow.fleet 0.1.2` portable document implementation remains part of the engineering mainline, but its `.mowfleet.json` import/export controls are intentionally not exposed in this public release. This does not affect My Fleets backup/restore, Share Fleet or roster copying.

## Repository files

- `index.html` — published application
- `mow_visual.css` — consolidated visual stylesheet
- `mow_visual_ui.js` — theme, locale scaffold and accordion controller
- `README.md` — public project description and release notes
- `CNAME` — custom-domain declaration
- `robots.txt` — crawler rules
- `sitemap.xml` — public sitemap

## Rules sources

The builder is based on:

- MOW Community Rulebook v0.1
- MOW Community Annual v0.1
- MOW Ship Cards v3.7
- Citadel Journal optional rules compiled in the Community Annual

## Disclaimer

This is an unofficial, non-commercial fan-made project. Man O' War and all related names, concepts and trademarks belong to their respective owners. No copyrighted miniature images are hosted by the builder; model-search links lead to external search results.
