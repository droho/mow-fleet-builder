# Man O' War Fleet Builder

An unofficial, bilingual fleet-building tool for Games Workshop's classic **Man O' War** tabletop game.

## Live version

https://droho.github.io/mow-fleet-builder/

## Main features

- Polish and English interface
- Fleet lists for all supported factions
- Automatic points calculation
- Real-time fleet composition and unit-limit validation
- Unit previews and fleet analysis tools
- Scenario reference and generator
- Optional Citadel Journal rules for Dwarfs, Dark Elves, High Elves and Orcs
- Standard and expanded Shoreforts
- Ships' Boats: Bomb-boats, Raiding Boats and Lifeboats
- Google Images model-search links for official miniature units, repositioned below unit names on mobile
- Local autosave and named fleet library
- Native mobile sharing in the published HTTPS version, with a clear desktop/local copy-link fallback and no account required
- Full fleet-library backup export/import between devices
- Optional custom names for individual Men O' War ships
- Lore-based random ship-name generator with faction, admiral, patron and unit-specific profiles
- One-click deletion of the complete named-fleet library, with confirmation
- Standalone single-file `index.html` for GitHub Pages
- Mobile-friendly layout with fleet-first setup controls and collapsible option groups
- Touch-friendly mobile quantity steppers for all unit-count fields
- Version and build identifier in the page footer for precise bug reports and release identification
- Built-in bilingual Getting Started help, available without leaving the builder

## Local data and privacy

Saved fleets are stored only in the browser's local storage. No fleet data is uploaded to a server.

Use **Export all** in **My fleets** to create a `.mowfleets` backup before clearing browser data or moving to another device. The backup can then be imported on a phone, tablet or desktop browser.

## Repository files

- `index.html` — standalone single-file build for GitHub Pages
- `mow_builder_advanced.html` — modular development build
- `mow_*.js` — current source modules used by the modular build
- `mow_ship_name_generator_tables_v14.json` — approved source-of-truth name tables
- `mow_ship_name_tables.js` — offline JavaScript wrapper generated from the approved JSON tables
- `mow_ship_name_generator.js` — generic faction/profile resolver and weighted generator engine
- `mow_mobile_quantity_steppers.js` — touch-friendly mobile quantity controls for dynamically rendered unit rows
- `mow_image_search.js` — responsive model-image links, placed beside titles on desktop and beside cost descriptions on mobile
- `README.md` — project description and cumulative changelog

## Rules sources

The builder is based on:

- MOW Community Rulebook v0.1
- MOW Community Annual v0.1
- MOW Ship Cards v3.7
- Citadel Journal optional rules compiled in the Community Annual

## Current release

**Fleet Builder 1.6 — build step70 — 2026-07-11**

Version 1.6 is the first public release after **1.5 / step51** and consolidates the completed development work from steps 52–69.

## What's new in version 1.6

- Local autosave and a named fleet library with Save, Save As, load, rename, duplicate and delete actions
- Full `.mowfleets` library backup and import between devices
- Shareable fleet links with native mobile sharing and a clear desktop/local fallback
- Optional individual names for Men O' War ships
- A lore-based ship-name generator with faction, admiral, Chaos patron and unit-specific profiles
- Major mobile usability improvements, including quantity steppers, reorganised setup controls and a mobile-friendly ship-name editor
- A visible version/build identifier in the footer
- Built-in bilingual Getting Started help
- The unfinished Card Tool fleet export remains available in the code, but its public button is hidden to avoid confusion

## Development history

The full cumulative development history is available in [CHANGELOG.md](CHANGELOG.md).

## Disclaimer

This is an unofficial, non-commercial fan-made project. Man O' War and all related names, concepts and trademarks belong to their respective owners. No copyrighted miniature images are hosted by the builder; model-search links lead to external search results.
