# MargMitra — Logistics Resilience Intelligence for North-East India

> **SIH Prototype · Government-grade control room for highway connectivity, field verification, and critical supply rerouting across the North Eastern Region (Sikkim, Assam, Arunachal, Meghalaya, Nagaland, Manipur, Mizoram, Tripura).**

MargMitra fuses **satellite + weather model + InSAR + field reports** into a single operational picture: *what is blocked, where, why, and what to do next* — for government dispatch, field officers, and fleet operators. Built for the **Smart India Hackathon**.

![Cream Coral Theme](https://img.shields.io/badge/theme-Cream%20Coral-%23E2726B) ![MapLibre](https://img.shields.io/badge/map-MapLibre%206.6-7CA36B) ![React 18](https://img.shields.io/badge/React-18-6C93A8) ![Vite](https://img.shields.io/badge/build-Vite%206-6464ff)

---

## 30-second pitch

- **Map-first, not card-first.** NH corridors rendered as navigation ribbons (green = active, red = blocked, cyan = recommended bypass) on OSM HOT / Carto Positron.
- **Ground truth drives status.** A Field Sentinel report flips a road from *predicted risk* to *verified BLOCKED* and triggers reroute + multilingual alert.
- **Golaghat Bypass is real geometry.** Catmull-Rom spline over 19 Assam corridor waypoints (Nagaon → Hojai → Golaghat → Jorhat) + live OSRM fetch, not a straight line.
- **One disruption, full ripple.** NH-37 Kaziranga landslide → VEH-104 (Emergency Medicine) halted at Nagaon → ALT-ROUTE-B via ferry → district supply at risk → voice alert in Assamese/Mizo etc.

---

## Live views

| View | Who | What they see |
|------|-----|---------------|
| **Dashboard** | Government War-Room | KPI row (Blocked / High-Risk / Vehicles / Critical / Districts) · Left: Critical Deliveries (vertical, blocked badge) · Center: Map (560px, Layers dropdown) · Right: Road drawer (Why → Risk 0-100 → Source) · Bottom: District Connectivity |
| **Map** | Explorer | Full `224px + 1fr` map with layer rail + same dropdown |
| **Logistics** | Fleet ops | `Fleet & Cargo Intelligence` table: Vehicle · Cargo · Priority · Route · Status pill · ETA · Focus/Reroute |
| **Incidents** | Field intel | `Field Reports` panel: search, filter All/Critical/Medium, cards with `border-left 4px crit/warn`, `✓ Verified` · `CRITICAL/BLOCKED` pills, `View →` |
| **Alerts** | Comms | `Multilingual Alert Log`: 3 broadcasts (Assamese/English/Mizo) with severity, corridor, message, `Play` (TTS) + `View corridor` |
| **Analytics** | War-Room | 8 tiles + `Supply Gap by District` bars (East Sikkim 64% etc) |
| **Field Sentinel** | Field officer | Phone frame (340×706, notch) — `f-app` (Report Incident big button, offline badge, recent reports) → `f-form` (type/severity/road chips, photo, notes) → `f-success` (GPS attached, Sync) |
| **Emergency** | *removed* | Was bypass-based emergency view, now folded into Dashboard drawer |

Topbar: `PS` glyph radial `E2726B` + `NavTabs` (Dashboard/Map/Logistics/Incidents/Alerts/Analytics) + `Simulate Live Event` (running → pulse) + `Role switch` Government / Field Officer.

---

## Key interactions

- **Click any road** → drawer shows *Why* (reason), *Risk Score* (Landslide/Rainfall/Terrain bars `growX`), *Source* chips, `Find Alternate Route`.
- **Route Decision Modal** → `Original NH-37 210km 6h20 HIGH BLOCKED` vs `Recommended 228km 7h05 LOW SAFE (Road→Ferry→Road)` + `Bridge capacity` warn + `Start Route` → vehicle `rerouteAccepted` → map ribbon turns green on bypass, origin 🚩 Guwahati → dest 📍 Jorhat pins appear.
- **Field report** → severity/roadStatus → `roadStatuses` + `districtConnectivity` + `regionalRiskIndex` bump, `incidents` prepend, `focusCoordinates` flyTo, toast (`danger/success/info`).
- **Alert broadcast** → language selector `en/as/mni/lus/kha/brx` → `playMultilingualAlert()` Web Speech.
- **Layer control** → Default (Road Network/Status/Risk) / Hazard (Waterways/Landslide/Ground) / Infrastructure (Bridges/Vehicles/Incidents/Ferry) — both left rail and map `Layers` dropdown (260px grouped).

---

## Tech

- **React 18 + Vite 6 + TypeScript 5.7** — `zustand` for global store (`usePathSetuStore`), `maplibre-gl 6.6` (free OSM HOT raster + Carto Positron vector), `lucide-react`, `tailwind 3.4` (custom `cream-coral` tokens), `clsx/tailwind-merge`.
- **Tokens** (`src/index.css:5`): `--ink #FDF6EA`, `--surface #FFF`, `--surface-2 #FBF2E1`, `--border #E8D9BC`, `--brand #E2726B`, `--open #7CA36B`, `--warn #D9A23A`, `--crit #C94F49`, `--route #6C93A8`, radii 20/14/10, `--ease cubic-bezier(.16,1,.3,1)`. Wave SVG background, `fadeUp/popIn/slideInRight/growX` motion.
- **Store** (`src/store/usePathSetuStore.ts`): `vehicles[4]`, `incidents[]`, `roadStatuses` (`NORMAL_TRIP/REROUTED/RECOMMENDED/BACKGROUND_DIM` for navigation), `simulationActive` (initial `false`), `toastNotification`, offense handling `submitFieldReport` / `syncOfflineQueue` (700ms fake sync) / `triggerDisruptionSimulation` (NH-37 → BLOCKED, VEH-104 halted at `[92.8446,25.982]`, incident `INC-2026-081`) / `acceptReroute` (ALT-ROUTE-B 5h50m) / `updateVehiclePosition` (trail ≤20).
- **Map** (`src/components/map/MapView.tsx:1071`): `MAP_STYLE` OSM HOT raster, `bypassCoords` from `getGolaghatBypassCoordinates()` + OSRM fetch `router.project-osrm.org` (6 via points), `road-casing` + `road-accessibility` layers, `hazard-risk` circles, `waterways`, `vehicle-trail` (`#6C93A8` dashed), `customGisMarkers` (bridges blue, incidents red/orange with ping, waterways cyan), `vehicleMarkers` (20px puck, bearing rotate, selected ring `0 0 0 4px`), `animStepRef` 1200ms loop for VEH-104/409/312, `ResizeObserver` + `idle` spinner.
- **Bypass generation** (`src/data/golaghatBypass.ts:87`): Catmull-Rom + harmonic meander over 19 waypoints, `trunk 35% NH-37 + smoothDetour`.
- **Tests** (`vitest` node): `src/store/usePathSetuStore.test.ts` 11 tests cover submit/sync/disruption/reroute/layers/GPS trail (20 cap).

```
src/
  components/
    layout/Header.tsx            topbar + navtabs + demo + role switch
    layout/IntelligenceDock.tsx  bottom-left intel toast when simulationActive
    map/MapView.tsx              MapLibre + bypass + pins + layers
    mobile/FieldSentinel.tsx     f-app / f-form / f-success
    modals/RouteDecisionModal.tsx  2-card compare + bridge warn
  data/
    golaghatBypass.ts
    roads.geojson (OSM verified, ALT-ROUTE-B)
    riskZones.geojson, bridges.geojson, waterways.geojson
    vehicles.json (VEH-104 Jorhat)
    incidents.json, alerts.json, translations.json
  store/usePathSetuStore.ts
  types/index.ts (RoadStatus includes REROUTED etc)
  utils/audio.ts (Web Speech TTS)
```

---

## Setup

```bash
git clone <repo> && cd NER-PathSetu
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc && vite build → dist/
npm run preview
npm run test:run # vitest run (11 tests)
npm run lint     # oxlint src
```

**Env** — no key needed. Map is raster OSM (`a/b/c.tile.openstreetmap.fr/hot`). Optional `VITE_BASEMAP_URL` in `.env.example` to override.

**Data provenance** (mock, swappable for live APIs):
- Roads: OSM / OSRM verified highway trace (NH-37 etc)
- Risk: NASA LHASA + IMD rainfall + InSAR ground deformation
- Incidents: Field Sentinel Unit #12 etc + photo `/assets/landslide-cam.jpg`
- Vehicles: Prototype fleet manifest (GPS SIMULATED)

---

## Design rules (kept)

- Cream-coral palette only 4 hues + sage/dusty blue; red=blocked, amber=restricted, green=open, blue=recommended. No neon/glass blobs.
- One primary action per screen (`Find Alternate Route` / `Submit Report` / `Start Route`).
- Map is primary workspace (60%+ width), side UI explains it.
- Progressive disclosure: road pill → risk 87 → rainfall/terrain on drawer.
- Real timestamps, road IDs, ETA, source chips.

---

## Roadmap

- Live IMD / CWC flood + LHASA landslide feeds
- IWAI NW-2 ferry schedule for bypass multimodal ETA
- Offline-first PWA for field (currently `delay-tolerant` queue `700ms` mock)
- i18n full coverage (currently 6 langs for alerts)

---

## License

Prototype for SIH. Data mock for demo. OSM © OpenStreetMap contributors, HOT.
