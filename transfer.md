# NER-PathSetu — Full Knowledge Transfer

Accurate handoff for the **current** codebase. Supersedes earlier docs that described an aspirational 4-role architecture; reality is a map-centric ops prototype. Gaps vs that vision are itemized in §8.

---

## 1. What the project is

**NER-PathSetu** — "AI-Assisted Logistics Resilience & Accessibility Intelligence Platform" for India's 8 North-Eastern states.

Single React SPA, **2 views**, one operator:
- **War-Room dashboard** (default) — MapLibre map flanked by Fleet sidebar (left) + Regional Intelligence sidebar (right), modal-based drill-downs, disruption simulation.
- **Field App** (`FieldSentinel`) — mobile-first incident reporting form with offline queue + simulated sync.

Core thesis implemented via **shared state**: a field report submitted once propagates to road statuses, vehicle at-risk flags, regional risk index, and map colors simultaneously. Simulation (landslide on NH-37) exercises the same pipeline.

---

## 2. Tech stack (verified)

| Layer | Choice | Notes |
|---|---|---|
| Build | Vite 6 + React 18 + TypeScript (strict) | `tsconfig`: strict, `include: ["src"]`, noEmit |
| Styling | **Tailwind CSS v3** (`@tailwind base/...`) | NOT v4. No `tailwind.config.ts` file exists |
| Map | **MapLibre GL JS v6** (`maplibre-gl`) | NOT mapbox-gl. Direct, no react wrapper |
| Basemap | **CARTO Positron** (raster, `@2x`) | Free, no API token, English labels. Replaced OSM HOT |
| State | Zustand v5 — single store `usePathSetuStore.ts` | ~450 lines. No `persist` |
| Icons | lucide-react | |
| i18n | Hand-rolled | `data/translations.json` (7 langs) feeds alert TTS only; UI strings inline English |
| Audio | Web Speech API TTS + beep fallback | `utils/audio.ts` |
| Tests | Vitest v4 (node env) | `usePathSetuStore.test.ts` — 11 tests |
| Lint | oxlint | `npm run lint`, zero warnings after cleanup |
| Routing | none (no react-router) | header tabs swap state, no URL |

---

## 3. Project structure

```
src/
  types/index.ts          # ALL interfaces + enums (Vehicle, Incident, RoadStatus, PriorityLevel,...)
  store/usePathSetuStore.ts   # the single Zustand store: all state + actions
  data/                   # mock data (JSON) + GeoJSON
    vehicles.json (4)  incidents.json (2)  alerts.json (2)  deliveries.json (4)  supply.json (3)
    translations.json      # en/as/mni/lus/kha/brx alert copy + TTS text
    roads.geojson (5 routes, NH-37/NH-27/NH-29/NH-6/ALT-ROUTE-B)   # 166KB, polyline coords
    riskZones.geojson (4)  bridges.geojson (3)  waterways.geojson (4)  incidents.geojson (UNUSED)
    districts.geojson (4)  # NOT rendered on map — dashboard numbers only
    risk_zones.geojson     # duplicate-ish, UNUSED
  utils/audio.ts           # playMultilingualAlert(langCode) -> TTS
  components/
    layout/Header.tsx      # brand, tabs (Dashboard/Analytics/Fleet/Archive), view switch, demo toggle
    layout/FleetSidebar.tsx      # fleet ops: selected vehicle, search, vehicles, disruption button
    layout/IntelSidebar.tsx      # risk index, supply bars, connectivity, incidents, broadcast+TTS
    map/MapView.tsx        # everything map: style, 6 layers, markers, popups, GPS animation
    mobile/FieldSentinel.tsx     # field report form + offline workflow
    modals/                # RouteDecision, VehicleDetail, IncidentDetail, AlertBroadcast
  App.tsx                  # shell: Header + sidebars + MapView + footer; view switch
  main.tsx, index.css      # Tailwind v3 + light theme + map popup overrides
  vite.config.ts           # react + geojson-loader plugin + vitest test block
```

---

## 4. Critical technical decisions & gotchas

### 4a. MapLibre direct integration
- `MapView.tsx` creates `new maplibregl.Map` per container; worker pinned via maplibre `?worker&url` import + `maplibregl.setWorkerUrl`.
- Basemap = CARTO Positron raster — **no API key, works offline in dev**, clean English labels.
- 6 toggleable layers, all defined in one `layers` object in store:
  - Hazard Risk (riskZones fill+line), Road Accessibility (roads line, live-colored from `roadStatuses`), Bridges (markers), Active Vehicles (markers + trail line), Incidents (markers, from store `incidents.json`), Waterways (NW-2 corridor line + 3 terminal markers).
- Vector layers toggle via `setLayoutProperty` visibility; marker groups add/remove in effects.
- GPS animation: interval drives VEH-104/312/409 along road polylines (bearing + speed + trail), trail capped at 20 pts.
- Road colors = `roadStatuses` store merged over road features → shared-state ripple visibly recolors the map.

### 4b. Shared-state incident flow (the core feature)
```
FieldSentinel handleSubmit
  → submitFieldReport(report)          (store)
    ├─ online:  prepend incident, roadStatuses[seg]=status,
    │           flag vehicles on route at-risk, bump regionalRiskIndex
    │           + blocked/restricted district counts
    └─ offline: push to offlineQueue (syncStatus PENDING), live state untouched
  → syncOfflineQueue()                 (store, 700ms setTimeout)
      batch-applies all queued reports, clears queue, goes online
```
- store `triggerDisruptionSimulation()`: injects hardcoded `INC-2026-081` landslide, blocks NH-37, favorite VEH-104 at risk, opens RouteDecision modal.
- `acceptReroute()`: moves vehicle onto ALT-ROUTE-B polyline, closes modal, flyTo.

### 4c. TypeScript notes
- Strict mode; but `noUnusedLocals/noUnusedParameters` off — lint (oxlint) catches dead imports instead.
- GeoJSON imported via custom `geojson-loader` vite plugin (also active in Vitest).
- No `moduleDetection: force`; no `GeoJSON` namespace imports needed (objects passed as `any`).

### 4d. Styling (light theme)
- Light: `bg-white` panels, `slate-*` text/borders, `bg-[#f8fafc]` shell, white header, light footer.
- Semantic colors: red=danger (BLOCKED/CRITICAL), amber=warning (RESTRICTED/HIGH), blue=info/primary, emerald=live/success only.
- `.font-mono` gets `font-feature-settings: 'tnum'` (tabular numbers).
- Field App view keeps a dark background container.

---

## 5. Build/test/lint — all green
- `npm run build` → `tsc && vite build` ✅ (only chunk-size warning, ~2.1MB mapbox-maplibre + roads.geojson)
- `npm run test:run` → **11/11 pass** (`src/store/usePathSetuStore.test.ts`)
- `npm run lint` → oxlint clean (dead imports removed)

Test coverage: field report ripple (online/offline), queue sync w/ fake timers, disruption trigger/reset, reroute, layer toggle no-clobber, GPS trail (append + 20-pt bound), Fleet-tab modal.

---

## 6. Commands
```bash
npm run dev         # dev server → http://localhost:5173
npm run build       # typecheck + production build → dist/
npm run preview     # serve dist/
npm run test        # vitest watch
npm run test:run    # vitest one-shot
npm run lint        # oxlint src
```

---

## 7. Config / env
- `.env.example` declares `VITE_BASEMAP_URL` (currently empty; basemap URL is hardcoded in MapView — no key needed).
- No `vercel.json`, no react-router, no `.env` — nothing external to run.

---

## 8. Current status + gaps vs the original documented vision

**Done:** light theme, mapbox→maplibre migration (this codebase never shipped mapbox — earlier transfer.md was stale), CARTO basemap, dead-import cleanup, Vitest + oxlint tooling, 11 passing tests.

**Open / missing (highest value first):**

| # | Gap | Detail |
|---|---|---|
| 1 | **Other role UIs** | Only gov war-room + field app exist. No Logistics/Driver nav, no Emergency mode, no dedicated Analytics/Fleet/Archive pages (header tabs are cosmetic). |
| 2 | **Services abstraction layer** | `dataService`/`routingService`/`incidentService` don't exist; all logic lives in `usePathSetuStore` + `MapView`. Blocks FastAPI/PostGIS/OSRM backend swap. |
| 3 | **Backend / real data** | Everything mock. vehicles.json/incidents.json/roads.geojson are curated; no API, no PostGIS, no OSRM routing. |
| 4 | **Zustand persist** | Role/lang/offline prefs are volatile — reload resets. Add `persist` middleware. |
| 5 | **i18next / UI localization** | Only alert broadcast is localized (7 langs). UI strings inline English. |
| 6 | **React Router** | No URL routing; tabs swap store state only. |
| 7 | **Code-splitting** | ~2.1MB chunk (maplibre + 166KB roads.geojson + all pages eager). Dynamic import per page. |
| 8 | **vercel.json** | No SPA rewrite config for deploy. |
| 9 | **Rule engine for incident→road** | `submitFieldReport` maps severity to road status inline; simulation hardcodes `INC-2026-081`. No data-driven mapping table. |
| 10 | **Dead map assets** | `incidents.geojson`, `risk_zones.geojson`, `districts.geojson` unused — remove or wire districts layer to map. |

---

## 9. Known quirks / breadcrumbs
- `incidents.geojson`/`risk_zones.geojson`/`districts.geojson` unused (districts polygons never drawn; connectivity numbers are dashboard-only).
- Vehicle GPS is simulated ("PROTOTYPE GPS" label removed from UI, but popups still note it).
- Vehicle trail layer renders only for the currently selected vehicle.
- FieldSentinel hardcodes a `roadCoordsMap` for NH-37/NH-6/NH-29/NH-27 coordinates.
- git history: single initial commit; repo on `main`.