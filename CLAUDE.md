# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WME Switch U-turns is a TamperMonkey/GreaseMonkey userscript for Waze Map Editor (WME). It provides quick controls and keyboard shortcuts to switch U-turns on selected nodes or segments.

Source is written in TypeScript under `src/`, built with Rollup into a single IIFE at `dist/wme-switch-uturns.user.js`. GreasyFork auto-syncs from the dist output.

## Commands

- **Install:** `npm install`
- **Build:** `npm run build`
- **Watch:** `npm run watch` (rebuild on changes)
- No test or lint steps exist.

## Architecture

```
src/
  meta.ts          # userscript header (comment block, not TS code)
  style.css        # plain CSS, imported as string
  globals.d.ts     # declares WME runtime globals (WMEBase, WMEUI, etc.)
  translations.ts  # NAME constant, TRANSLATION (en, uk, ru)
  uturns.ts        # UTurns class (extends WMEBase)
  index.ts         # bootstrap: registers translations/CSS, instantiates UTurns
```

**Build output:** `dist/wme-switch-uturns.user.js` -- IIFE with userscript header prepended as banner. Version is read from `package.json` via `{{version}}` placeholder in `meta.ts`.

**Key external dependencies** (loaded via `@require` in userscript header, not bundled):
- WME-Bootstrap.js, WME-Base.js, WME-UI.js (WME script ecosystem)

## Coding Conventions

- TypeScript with `strict: false` -- minimal type annotations, `any` for WME SDK types
- GitHub Actions auto-builds `dist/` on push to master
