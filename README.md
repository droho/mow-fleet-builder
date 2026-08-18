# Man O' War Fleet Builder

An unofficial, bilingual fleet-building tool for Games Workshop's classic **Man O' War** tabletop game.

## Live version

https://mowfleetbuilder.com/

## Main features

- Polish and English interface
- Official fleet lists supported by the current mainline Builder
- Automatic points calculation and live fleet validation
- Optional Community Annual rules modules, including expanded standard Wizard levels
- Fleet Setup for Builder-owned flagships, character/resource assignments and pre-game configuration
- Unit Preview, Fleet Analysis and Scenario Generator
- Local autosave and named fleet library with Save, Save As, Load and Duplicate
- Ship and character naming tools
- Light, Dark — Classic and System themes
- Mobile-friendly layout and print output
- Share Fleet and roster clipboard tools
- Full local-library backup export/import using `.mowfleets`
- Portable fleet export/import using the `mow.fleet 0.1.2` `.mowfleet.json` format
- **Open in Game Companion** handoff, with normal file export available as the fallback

## Local data and privacy

Saved fleets are stored in the browser's local storage. Fleet data is not uploaded to a Builder server as part of saving or the local fleet library.

Use **Export all** in **My fleets** to create a `.mowfleets` backup before clearing browser data or moving to another device. Use **Export fleet** when you need a portable `mow.fleet 0.1.2` document for another tool or device.

The published website uses Cloudflare Web Analytics for aggregate visits and page-view statistics.

## Current release

**Fleet Builder 1.8.2 — FB-REL-01 — 2026-08-18**

This release publishes the centrally accepted official-mainline Builder after FB-MAINT-04. It is a release-engineering update: it does not add experimental fleets and does not change the `mow.fleet 0.1.2` contract or Data Core.

## What's new in 1.8.2

- **Open in Game Companion** is now available for supported official fleets, while the normal file export remains available as a fallback.
- Rules sources and Community Annual options are easier to identify, with Print & Play/resource links available where supported.
- Men O' War Card entitlements are presented more clearly in the roster, including the distinction between free and purchased cards.
- Norse players no longer have to resolve the Kingship's random special crew while building the fleet; that pre-game result can be handled in Game Companion or during physical play.
- Fleet Setup, Character Names, saved fleets, import/export/share, validation, roster and print now use the current unified interface across the official fleets.
- Existing local fleets remain supported, and the portable `mow.fleet 0.1.2` format is unchanged.

## Runtime layout

The published Builder is now modular. `index.html` depends on the accompanying `mow_*.js` runtime modules plus `mow_visual.css`; these files are required and must be deployed together. The Game Companion sender is `mow_game_companion_sender_ssc03d.js`.

Site-level files `CNAME`, `robots.txt` and `sitemap.xml` support the custom domain and indexing.

## Rules sources

The builder is based on:

- MOW Community Rulebook v0.1
- MOW Community Annual v0.1
- MOW Ship Cards v3.7

The Builder also exposes source/resource references for supported optional rules where available.

## Disclaimer

This is an unofficial, non-commercial fan-made project. Man O' War and all related names, concepts and trademarks belong to their respective owners. No copyrighted miniature images are hosted by the builder; model-search links lead to external search results.
