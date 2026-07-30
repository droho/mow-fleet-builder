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
- Optional Community Annual expanded standard Wizard levels
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

**Fleet Builder 1.8.1 — FB-MAINT-02 — 2026-07-30**

This maintenance release adds the Community Annual seven-level ladder for ordinary standard Wizards. Core mode retains the original 50 / 100 / 150 point levels, and existing fleets remain compatible.

## What's new in 1.8.1

- Optional seven-level standard Wizard ladder from the Community Annual
- Stable Wizard level identity through save, duplicate and `.mowfleets` backup workflows
- Detailed Wizard properties shown in the selector, Fleet Setup and bilingual Help
- Compact Wizard lines in Roster Preview, copied roster text and print output
- Explicit warning instead of silent conversion when an Annual-only level remains selected after the module is disabled
- Polish and English help and validation wording

Specialist magic systems are unchanged. This is not full digital Magic Phase support.

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

## Disclaimer

This is an unofficial, non-commercial fan-made project. Man O' War and all related names, concepts and trademarks belong to their respective owners. No copyrighted miniature images are hosted by the builder; model-search links lead to external search results.
