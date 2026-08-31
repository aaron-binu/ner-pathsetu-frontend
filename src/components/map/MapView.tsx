import React, { useState, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import {
  Layers,
  ChevronDown,
  Plus,
  Minus,
  Compass,
  Crosshair
} from 'lucide-react';
import { usePathSetuStore } from '../../store/usePathSetuStore';
import roadsGeoJSON from '../../data/roads.geojson';
import riskZonesGeoJSON from '../../data/riskZones.geojson';
import bridgesGeoJSON from '../../data/bridges.geojson';
import incidentsGeoJSON from '../../data/incidents.geojson';
import waterwaysGeoJSON from '../../data/waterways.geojson';
import { getGolaghatBypassCoordinates } from '../../data/golaghatBypass';
import { IntelligenceDock } from '../layout/IntelligenceDock';

const escapeHtml = (str: unknown): string => {
  const s = String(str ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

maplibregl.setWorkerUrl(maplibreWorkerUrl);

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'osm-hot-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors, Humanitarian OpenStreetMap Team',
    },
  },
  layers: [
    {
      id: 'osm-hot-layer',
      type: 'raster',
      source: 'osm-hot-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const DEFAULT_CENTER: [number, number] = [93.1000, 26.3500];
const DEFAULT_ZOOM = 7.3;

const ORIGIN_COORDS: [number, number] = [91.738585, 26.184464];
const DESTINATION_COORDS: [number, number] = [94.212008, 26.753952];

function calculateBearing(start: [number, number], end: [number, number]): number {
  const startLat = (start[1] * Math.PI) / 180;
  const startLng = (start[0] * Math.PI) / 180;
  const endLat = (end[1] * Math.PI) / 180;
  const endLng = (end[0] * Math.PI) / 180;

  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

interface MapViewProps {
  className?: string;
  hideLayersButton?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  className = 'w-full h-full',
  hideLayersButton = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const vehicleMarkersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const customGisMarkersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);

  const [bypassCoords, setBypassCoords] = useState<[number, number][]>(() => getGolaghatBypassCoordinates());

  // Fetch real OpenStreetMap highway geometry from OSRM
  useEffect(() => {
    let isMounted = true;
    const fetchOSRMRoute = async () => {
      try {
        const url =
          'https://router.project-osrm.org/route/v1/driving/91.738585,26.184464;92.6841,26.3450;92.880,26.150;93.180,26.040;93.580,26.180;93.972,26.528;94.212008,26.753952?overview=full&geometries=geojson';
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data.code === 'Ok' && data.routes && data.routes[0]?.geometry?.coordinates) {
          const osrmCoords = data.routes[0].geometry.coordinates as [number, number][];
          if (isMounted && osrmCoords.length > 50) {
            setBypassCoords(osrmCoords);
          }
        }
      } catch (err) {
        console.warn('OSRM Live Route fallback active:', err);
      }
    };

    fetchOSRMRoute();
    return () => {
      isMounted = false;
    };
  }, []);

  const {
    layers,
    toggleLayer,
    vehicles,
    incidents,
    roadStatuses,
    selectedVehicleId,
    setSelectedVehicle,
    selectedIncident,
    setSelectedIncident,
    focusCoordinates,
    setFocusCoordinates,
    isTrackingPlaying,
    updateVehiclePosition,
    leftSidebarOpen,
    rightSidebarOpen,
    simulationActive
  } = usePathSetuStore();

  useEffect(() => {
    if (mapRef.current) {
      const t = setTimeout(() => mapRef.current?.resize(), 100);
      const t2 = setTimeout(() => mapRef.current?.resize(), 400);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [leftSidebarOpen, rightSidebarOpen, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !mapContainerRef.current) return;
    const ro = new ResizeObserver(() => mapRef.current?.resize());
    ro.observe(mapContainerRef.current);
    const wrap = mapContainerRef.current.parentElement;
    if (wrap) ro.observe(wrap);
    return () => ro.disconnect();
  }, [mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !focusCoordinates) return;
    mapRef.current.flyTo({
      center: focusCoordinates,
      zoom: 8.5,
      essential: true,
      duration: 1000,
    });
    setFocusCoordinates(null);
  }, [focusCoordinates, setFocusCoordinates]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: 0,
        attributionControl: false,
      });

      map.on('load', () => {
        setMapLoaded(true);

        map.addSource('risk-zones-source', {
          type: 'geojson',
          data: riskZonesGeoJSON as any,
        });

        // 1. Radiant soft GIS Heatmap Layer (Red/Orange/Amber gradient driven by riskScore)
        map.addLayer({
          id: 'hazard-risk-heatmap',
          type: 'heatmap',
          source: 'risk-zones-source',
          maxzoom: 15,
          layout: {
            visibility: layers.hazardRisk ? 'visible' : 'none',
          },
          paint: {
            // Weight based on riskScore (0 to 100)
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'riskScore'],
              0, 0,
              40, 0.4,
              70, 0.8,
              100, 1.3,
            ],
            // Heatmap intensity multiplier across zoom levels
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 1.0,
              7, 1.8,
              10, 2.6,
            ],
            // Color ramp: transparent -> soft warm amber -> bright orange -> intense fiery red -> deep crimson core
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0, 0, 0, 0)',
              0.12, 'rgba(254, 215, 170, 0.45)', // soft amber yellow
              0.32, 'rgba(251, 146, 60, 0.70)',  // vivid orange
              0.58, 'rgba(234, 88, 12, 0.85)',   // deep fiery orange-red
              0.80, 'rgba(220, 38, 38, 0.92)',   // intense hazard red
              1.0, 'rgba(153, 27, 27, 0.98)',    // deep emergency core
            ],
            // Heatmap radius expansion across zoom levels
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              5, 32,
              7.5, 60,
              10, 95,
              13, 150,
            ],
            'heatmap-opacity': 0.85,
          },
        });

        // 2. Soft Radial Glow Halo around Hazard Core
        map.addLayer({
          id: 'hazard-risk-glow',
          type: 'circle',
          source: 'risk-zones-source',
          minzoom: 6,
          layout: {
            visibility: layers.hazardRisk ? 'visible' : 'none',
          },
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              6, 18,
              8, 30,
              11, 48,
            ],
            'circle-color': [
              'match',
              ['get', 'riskLevel'],
              'CRITICAL', '#dc2626',
              'HIGH', '#ea580c',
              '#f59e0b',
            ],
            'circle-opacity': 0.35,
            'circle-blur': 0.75,
          },
        });

        // 3. Crisp Interactive Hazard Node Circle
        map.addLayer({
          id: 'hazard-risk-points-layer',
          type: 'circle',
          source: 'risk-zones-source',
          minzoom: 6,
          layout: {
            visibility: layers.hazardRisk ? 'visible' : 'none',
          },
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              6, 5,
              8, 7.5,
              11, 11,
            ],
            'circle-color': [
              'match',
              ['get', 'riskLevel'],
              'CRITICAL', '#dc2626',
              'HIGH', '#ea580c',
              '#f59e0b',
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5,
            'circle-opacity': 0.9,
          },
        });

        // 4. Risk Score Label badge (visible on close zoom, no collision)
        map.addLayer({
          id: 'hazard-risk-label-layer',
          type: 'symbol',
          source: 'risk-zones-source',
          minzoom: 8.5,
          layout: {
            visibility: layers.hazardRisk ? 'visible' : 'none',
            'text-field': ['concat', ['to-string', ['get', 'riskScore']], '/100'],
            'text-size': 10,
            'text-offset': [0, 1.6],
            'text-anchor': 'top',
            'text-allow-overlap': false,
            'text-ignore-placement': false,
          },
          paint: {
            'text-color': '#2A211A',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        });

        map.addSource('waterways-source', {
          type: 'geojson',
          data: waterwaysGeoJSON as any,
        });

        map.addLayer({
          id: 'waterways-corridor-layer',
          type: 'line',
          source: 'waterways-source',
          filter: ['==', '$type', 'LineString'],
          layout: {
            visibility: layers.waterways ? 'visible' : 'none',
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#0284c7',
            'line-width': 2.5,
            'line-dasharray': [4, 2],
            'line-opacity': 0.75,
          },
        });

        const initialFeatures = roadsGeoJSON.features.map((feat: any) => {
          if (feat.id === 'ALT-ROUTE-B') {
            return {
              ...feat,
              properties: {
                ...feat.properties,
                name: 'Alternative Route B (Golaghat – Jorhat Bypass)',
              },
              geometry: {
                type: 'LineString',
                coordinates: bypassCoords,
              },
            };
          }
          return feat;
        });

        map.addSource('roads-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: initialFeatures,
          },
        });

        // 1. Road Under-Casing (adds GPS navigation ribbon outline)
        map.addLayer({
          id: 'road-casing-layer',
          type: 'line',
          source: 'roads-source',
          layout: {
            visibility: layers.roadAccessibility ? 'visible' : 'none',
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': [
              'match',
              ['get', 'status'],
              'BLOCKED', '#7f1d1d',
              'REROUTED', '#064e3b',
              'NORMAL_TRIP', '#065f46',
              'RECOMMENDED', '#0369a1',
              'transparent',
            ],
            'line-width': [
              'match',
              ['get', 'status'],
              'BLOCKED', 8.5,
              'REROUTED', 8.0,
              'NORMAL_TRIP', 8.0,
              'RECOMMENDED', 7.0,
              0,
            ],
            'line-opacity': 0.7,
          },
        });

        // 2. Main Navigation Road Ribbon Layer
        map.addLayer({
          id: 'road-accessibility-layer',
          type: 'line',
          source: 'roads-source',
          layout: {
            visibility: layers.roadAccessibility ? 'visible' : 'none',
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': [
              'match',
              ['get', 'status'],
              'BLOCKED', '#ef4444',
              'REROUTED', '#10b981',
              'NORMAL_TRIP', '#10b981',
              'RECOMMENDED', '#0284c7',
              'RESTRICTED', '#f59e0b',
              'BACKGROUND_DIM', '#64748b',
              '#64748b',
            ],
            'line-width': [
              'match',
              ['get', 'status'],
              'BLOCKED', 6.5,
              'REROUTED', 6.0,
              'NORMAL_TRIP', 6.0,
              'RECOMMENDED', 5.0,
              'RESTRICTED', 3.5,
              'BACKGROUND_DIM', 2.8,
              3.0,
            ],
            'line-opacity': [
              'match',
              ['get', 'status'],
              'BACKGROUND_DIM', 0.7,
              1.0,
            ],
          },
        });

        map.on('click', 'road-accessibility-layer', (e: any) => {
          if (!e.features || !e.features[0]) return;
          const props = e.features[0].properties as any;
          const status = (props.status || 'OPEN').toUpperCase();
          const displayStatus = status === 'NORMAL_TRIP' ? 'ACTIVE ROUTE' : status === 'BACKGROUND_DIM' ? 'OPEN' : status;
          const pillCls = status === 'BLOCKED' ? 'blocked' : status === 'RESTRICTED' ? 'restricted' : 'open';

          new maplibregl.Popup({ offset: 10, closeButton: true, className: 'warm' })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="warm-popup">
                <div class="wp-head">
                  <span class="status-pill ${pillCls}"><span class="sdot"></span>${escapeHtml(displayStatus)}</span>
                  <span class="mono" style="font-size:10px; color:var(--text-faint); font-weight:600;">${escapeHtml(props.type || 'Corridor')}</span>
                </div>
                <div class="wp-title">${escapeHtml(props.name)}</div>
                <div class="wp-meta" style="margin-top:6px;"><b>Length:</b> ${escapeHtml(props.lengthKm)} km · <b>Criticality:</b> ${escapeHtml(props.criticality || 'HIGH')}</div>
                <div class="wp-divider"><span><b>Destination:</b> Jorhat Central Hospital</span></div>
              </div>
            `)
            .addTo(map);
        });

        map.addSource('vehicle-trail-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });

        map.addLayer({
          id: 'vehicle-trail-layer',
          type: 'line',
          source: 'vehicle-trail-source',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#10b981',
            'line-width': 3.5,
            'line-opacity': 0.8,
            'line-dasharray': [2, 2],
          },
        });

        // Risk Zone GIS intelligence click handler
        const handleRiskClick = (e: any) => {
          if (!e.features || !e.features[0]) return;
          const props = e.features[0].properties as any;
          const score = props.riskScore || 72;
          const level = (props.riskLevel || 'HIGH').toUpperCase();
          const lvl = level === 'CRITICAL' ? 'critical' : level === 'HIGH' ? 'high' : 'normal';
          const scoreColor = level === 'CRITICAL' ? 'var(--crit)' : level === 'HIGH' ? 'var(--warn)' : 'var(--text-dim)';

          new maplibregl.Popup({ offset: 14, closeButton: true, className: 'warm' })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="warm-popup">
                <div class="wp-head">
                  <span class="priority-pill ${lvl}">${escapeHtml(level)} RISK</span>
                  <span class="mono" style="font-size:13px; font-weight:800; color:${scoreColor};">${escapeHtml(score)}<span style="font-size:10px; font-weight:600; color:var(--text-faint);"> / 100</span></span>
                </div>
                <div class="wp-title">${escapeHtml(props.name)}</div>
                <div class="wp-why">⚠️ <b>Hazard:</b> ${escapeHtml(props.hazardType || 'Active Slope Failure / Mudflow')}</div>
                <div style="display:flex; justify-content:space-between; gap:12px; font-size:11px; color:var(--text-dim); margin-top:8px;">
                  <span>Rainfall: <b style="color:var(--text);">${escapeHtml(props.rainfall || '96 mm/24h')}</b></span>
                  <span>Terrain: <b style="color:var(--text);">${escapeHtml(props.terrainRisk || '75%')}</b></span>
                </div>
                <div class="wp-divider">🛰️ <span><b>GIS Sentinel:</b> ${escapeHtml(props.source || 'NASA LHASA / IMD Radar Live')}</span></div>
              </div>
            `)
            .addTo(map);

          // Update store regional risk index
          usePathSetuStore.setState({
            regionalRiskIndex: score,
          });
        };

        map.on('click', 'hazard-risk-points-layer', handleRiskClick);
        map.on('click', 'hazard-risk-glow', handleRiskClick);

        const interactiveLayers = ['hazard-risk-points-layer', 'hazard-risk-glow', 'road-accessibility-layer'];
        interactiveLayers.forEach((layerId) => {
          map.on('mouseenter', layerId, () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', layerId, () => {
            map.getCanvas().style.cursor = '';
          });
        });
      });
      map.on('idle', () => setMapLoaded(true));

      mapRef.current = map;
    } catch (err) {
      console.warn('Map initialization error:', err);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    try {
      const riskLayers = [
        'hazard-risk-heatmap',
        'hazard-risk-glow',
        'hazard-risk-points-layer',
        'hazard-risk-label-layer',
      ];
      riskLayers.forEach((lId) => {
        if (map.getLayer(lId)) {
          map.setLayoutProperty(lId, 'visibility', layers.hazardRisk ? 'visible' : 'none');
        }
      });

      if (map.getLayer('road-accessibility-layer')) {
        map.setLayoutProperty('road-accessibility-layer', 'visibility', layers.roadAccessibility ? 'visible' : 'none');
        if (map.getLayer('road-casing-layer')) {
          map.setLayoutProperty('road-casing-layer', 'visibility', layers.roadAccessibility ? 'visible' : 'none');
        }
      }
      if (map.getLayer('waterways-corridor-layer')) {
        map.setLayoutProperty('waterways-corridor-layer', 'visibility', layers.waterways ? 'visible' : 'none');
      }
      if (map.getLayer('vehicle-trail-layer')) {
        map.setLayoutProperty('vehicle-trail-layer', 'visibility', layers.activeVehicles ? 'visible' : 'none');
      }
    } catch (e) {
      console.warn('Layer visibility update error:', e);
    }
  }, [layers, mapLoaded]);

  // Synchronize dynamic Google Maps-style navigation paths with genuine OSM geometry
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    try {
      const source = map.getSource('roads-source') as maplibregl.GeoJSONSource;
      if (source) {
        const veh104 = vehicles.find((v) => v.id === 'VEH-104');
        const isRerouted = veh104?.rerouteAccepted;
        const isAtRisk = veh104?.routeAtRisk;

        const updatedFeatures = roadsGeoJSON.features.map((feat: any) => {
          let status = roadStatuses[feat.id] || feat.properties.status;

          if (!simulationActive) {
            // Normal State: NH-37 is the single active green navigation corridor, others dimmed
            if (feat.id === 'NH-37') {
              status = 'NORMAL_TRIP';
            } else {
              status = 'BACKGROUND_DIM';
            }
          } else {
            // Disruption Active:
            if (feat.id === 'NH-37') {
              status = 'BLOCKED'; // Primary path turns Red
            } else if (feat.id === 'ALT-ROUTE-B') {
              if (isRerouted) {
                status = 'REROUTED'; // Active bypass turns Green
              } else {
                status = 'RECOMMENDED'; // Recommended detour in Cyan
              }
            } else {
              status = 'BACKGROUND_DIM'; // Irrelevant regional roads dimmed
            }
          }

          if (feat.id === 'ALT-ROUTE-B') {
            return {
              ...feat,
              properties: {
                ...feat.properties,
                name: 'Alternative Route B (Golaghat – Jorhat Bypass)',
                status,
              },
              geometry: {
                type: 'LineString',
                coordinates: bypassCoords,
              },
            };
          }

          return {
            ...feat,
            properties: {
              ...feat.properties,
              status,
            },
          };
        });

        source.setData({
          type: 'FeatureCollection',
          features: updatedFeatures,
        });
      }
    } catch (e) {
      console.warn('Road status update error:', e);
    }
  }, [roadStatuses, vehicles, simulationActive, bypassCoords, mapLoaded]);

  // Dynamic Navigation Origin and Destination Pins (Displayed when VEH-104 is selected)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    Object.values(customGisMarkersRef.current).forEach((m) => m.remove());
    customGisMarkersRef.current = {};

    // 1. Dynamic Origin & Destination Pins for active selected vehicle (VEH-104)
    if (selectedVehicleId === 'VEH-104') {
      const originEl = document.createElement('div');
      originEl.className = 'cursor-pointer select-none transition-transform hover:scale-110';
      originEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));">
          <div style="background: #0f172a; color: white; border: 1.5px solid #3b82f6; border-radius: 6px; padding: 2px 7px; font-size: 9px; font-weight: 800; white-space: nowrap; display: flex; align-items: center; gap: 3px;">
            <span>🚩</span>
            <span>START: Guwahati Depot</span>
          </div>
          <div style="width: 2px; height: 6px; background: #3b82f6;"></div>
        </div>
      `;
      originEl.addEventListener('click', () => {
        new maplibregl.Popup({ offset: 12, closeButton: true, className: 'warm' })
          .setLngLat(ORIGIN_COORDS)
          .setHTML(`
            <div class="warm-popup" style="min-width:220px;">
              <div style="font-size:10px; font-weight:800; letter-spacing:.5px; text-transform:uppercase; color:var(--route);">🚩 Dispatch Terminal</div>
              <div class="wp-title" style="margin-top:4px;">Guwahati Central Logistics Hub</div>
              <div style="font-size:11px; color:var(--text-dim); margin-top:4px;">Origin for <span class="mono" style="font-weight:700; color:var(--text);">VEH-104</span> · Emergency Medicine</div>
            </div>
          `)
          .addTo(map);
      });
      const originMarker = new maplibregl.Marker({ element: originEl, anchor: 'bottom' })
        .setLngLat(ORIGIN_COORDS)
        .addTo(map);
      customGisMarkersRef.current['nav-origin'] = originMarker;

      const destEl = document.createElement('div');
      destEl.className = 'cursor-pointer select-none transition-transform hover:scale-110';
      destEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.35));">
          <div style="background: #0f172a; color: white; border: 2px solid #10b981; border-radius: 7px; padding: 3px 9px; font-size: 10px; font-weight: 900; white-space: nowrap; display: flex; align-items: center; gap: 4px; box-shadow: 0 0 14px rgba(16, 185, 129, 0.5);">
            <span style="font-size: 12px;">📍</span>
            <span>DESTINATION: Jorhat Central Hospital</span>
          </div>
          <div style="width: 2px; height: 8px; background: #10b981;"></div>
          <div style="width: 6px; height: 6px; border-radius: 9999px; background: #10b981; border: 1.5px solid white;"></div>
        </div>
      `;
      destEl.addEventListener('click', () => {
        new maplibregl.Popup({ offset: 12, closeButton: true, className: 'warm' })
          .setLngLat(DESTINATION_COORDS)
          .setHTML(`
            <div class="warm-popup" style="min-width:240px;">
              <div style="font-size:10px; font-weight:800; letter-spacing:.5px; text-transform:uppercase; color:var(--open);">📍 Final Delivery Target</div>
              <div class="wp-title" style="margin-top:4px;">Jorhat Central Hospital, Upper Assam</div>
              <div style="font-size:11px; color:var(--text-dim); margin-top:4px; line-height:1.5;">Target for Emergency Medicine via <span style="font-weight:700; color:var(--text);">NH-37 / Golaghat</span> bypass corridor.</div>
            </div>
          `)
          .addTo(map);
      });
      const destMarker = new maplibregl.Marker({ element: destEl, anchor: 'bottom' })
        .setLngLat(DESTINATION_COORDS)
        .addTo(map);
      customGisMarkersRef.current['nav-dest'] = destMarker;
    }

    if (layers.bridges) {
      bridgesGeoJSON.features.forEach((feat: any) => {
        const props = feat.properties;
        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none transition-transform hover:scale-125';
        el.innerHTML = `
          <div style="width: 26px; height: 26px; border-radius: 9999px; background: #1d4ed8; color: white; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.25);">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"/>
              <path d="M4 12h16"/>
              <path d="M12 12v7"/>
              <path d="M4 19h16"/>
            </svg>
          </div>
        `;

        el.addEventListener('click', () => {
          const bStatus = (props.status || 'OPEN').toUpperCase();
          const sCls = bStatus === 'BLOCKED' ? 'blocked' : bStatus === 'RESTRICTED' ? 'restricted' : 'open';
          new maplibregl.Popup({ offset: 12, closeButton: true, className: 'warm' })
            .setLngLat(feat.geometry.coordinates)
            .setHTML(`
              <div class="warm-popup" style="min-width:210px;">
                <div class="wp-head">
                  <span style="font-size:10px; font-weight:800; letter-spacing:.4px; text-transform:uppercase; color:var(--route); background:var(--route-dim); padding:3px 7px; border-radius:7px; border:1px solid rgba(108,147,168,.2);">🌉 Strategic Bridge</span>
                  <span class="status-pill ${sCls}" style="padding:3px 7px; font-size:10px;"><span class="sdot"></span>${escapeHtml(bStatus)}</span>
                </div>
                <div class="wp-title">${escapeHtml(props.name)}</div>
                <div class="wp-meta" style="margin-top:6px;"><b>River:</b> ${escapeHtml(props.river)} · <b>Type:</b> ${escapeHtml(props.bridgeType)}</div>
                <div class="wp-divider"><span><b>Source:</b> ${escapeHtml(props.source)}</span></div>
              </div>
            `)
            .addTo(map);
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(feat.geometry.coordinates)
          .addTo(map);

        customGisMarkersRef.current[`br-${feat.id}`] = marker;
      });
    }

    if (layers.incidents) {
      const seenIncidents = new Set<string>();
      incidents.forEach((feat: any) => {
        if (seenIncidents.has(feat.id)) return;
        seenIncidents.add(feat.id);

        const isBlocked = feat.roadStatus === 'BLOCKED';
        const color = isBlocked ? '#dc2626' : '#ea580c';

        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none transition-transform hover:scale-110';
        el.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));">
            <div style="display: flex; align-items: center; gap: 5px; background: #ffffff; border: 1.5px solid ${color}; border-radius: 9999px; padding: 3px 9px 3px 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.18);">
              <div style="width: 18px; height: 18px; border-radius: 9999px; background: ${color}; color: white; display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <span style="font-size: 10.5px; font-weight: 800; color: #0f172a; white-space: nowrap; letter-spacing: -0.2px;">
                ${escapeHtml(feat.type.toUpperCase())}: ${escapeHtml(feat.roadStatus)}
              </span>
            </div>
            <div style="width: 2px; height: 6px; background: ${color};"></div>
            <div style="width: 5px; height: 5px; border-radius: 9999px; background: ${color}; border: 1px solid white;"></div>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedIncident(feat);
          const sCls = isBlocked ? 'blocked' : feat.roadStatus === 'RESTRICTED' ? 'restricted' : 'open';
          const pCls = feat.severity === 'CRITICAL' ? 'critical' : feat.severity === 'HIGH' ? 'high' : 'normal';

          new maplibregl.Popup({ offset: 14, closeButton: true, className: 'warm' })
            .setLngLat(feat.coordinates)
            .setHTML(`
              <div class="warm-popup" style="min-width:230px;">
                <div class="wp-head">
                  <span class="status-pill ${sCls}"><span class="sdot"></span>${escapeHtml(feat.roadStatus)}</span>
                  <span class="mono" style="font-size:10.5px; color:var(--text-faint); font-weight:600;">${escapeHtml(feat.timeLogged)}</span>
                </div>
                <div class="wp-title">${escapeHtml(feat.type)} · ${escapeHtml(feat.roadName)}</div>
                <div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; align-items:center;">
                  <span class="priority-pill ${pCls}" style="padding:3px 7px; font-size:10px;">${escapeHtml(feat.severity)}</span>
                  <span style="font-size:11px; color:var(--text-dim);">by <b style="color:var(--text);">${escapeHtml(feat.reportedBy)}</b></span>
                </div>
                ${feat.notes ? `<div class="wp-why">${escapeHtml(feat.notes)}</div>` : ''}
                <div class="wp-divider"><span><b>Source:</b> ${escapeHtml(feat.source || 'Field Sentinel')}</span><span class="mono" style="font-size:10px;">${escapeHtml(feat.roadSegmentId || '')}</span></div>
              </div>
            `)
            .addTo(map);
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(feat.coordinates)
          .addTo(map);

        customGisMarkersRef.current[`inc-${feat.id}`] = marker;
      });
    }

    if (layers.waterways) {
      waterwaysGeoJSON.features.forEach((feat: any) => {
        if (feat.geometry.type !== 'Point') return;
        const props = feat.properties;
        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none transition-transform hover:scale-125';
        el.innerHTML = `
          <div style="width: 24px; height: 24px; border-radius: 9999px; background: #0284c7; color: white; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.25);">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="5" r="3"/>
              <line x1="12" y1="22" x2="12" y2="8"/>
              <path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
            </svg>
          </div>
        `;

        el.addEventListener('click', () => {
          const wStatus = (props.status || 'OPERATIONAL').toUpperCase();
          const wCls = wStatus === 'OPERATIONAL' || wStatus === 'OPEN' ? 'open' : wStatus === 'RESTRICTED' ? 'restricted' : 'blocked';
          new maplibregl.Popup({ offset: 12, closeButton: true, className: 'warm' })
            .setLngLat(feat.geometry.coordinates)
            .setHTML(`
              <div class="warm-popup" style="min-width:210px;">
                <div class="wp-head">
                  <span style="font-size:10px; font-weight:800; letter-spacing:.4px; text-transform:uppercase; color:var(--route); background:var(--route-dim); padding:3px 7px; border-radius:7px; border:1px solid rgba(108,147,168,.2);">⚓ IWT Terminal</span>
                  <span class="status-pill ${wCls}" style="padding:3px 7px; font-size:10px;"><span class="sdot"></span>${escapeHtml(wStatus)}</span>
                </div>
                <div class="wp-title">${escapeHtml(props.name)}</div>
                <div class="wp-divider"><span><b>Source:</b> ${escapeHtml(props.source)}</span></div>
              </div>
            `)
            .addTo(map);
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(feat.geometry.coordinates)
          .addTo(map);

        customGisMarkersRef.current[`port-${feat.id}`] = marker;
      });
    }
  }, [layers.bridges, layers.incidents, layers.waterways, selectedVehicleId, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (!layers.activeVehicles) {
      Object.values(vehicleMarkersRef.current).forEach((m) => m.remove());
      vehicleMarkersRef.current = {};
      return;
    }

    vehicles.forEach((veh) => {
      const isCritical = veh.priority === 'CRITICAL';
      const isHigh = veh.priority === 'HIGH';
      const isSelected = selectedVehicleId === veh.id;
      const isRerouted = veh.rerouteAccepted;
      const isAtRisk = veh.routeAtRisk;

      const priorityColor = isAtRisk ? '#dc2626' : isRerouted ? '#10b981' : isCritical ? '#dc2626' : isHigh ? '#ea580c' : '#2563eb';
      const bearing = veh.bearing || 0;

      if (vehicleMarkersRef.current[veh.id]) {
        vehicleMarkersRef.current[veh.id].setLngLat(veh.coordinates);

        const markerEl = vehicleMarkersRef.current[veh.id].getElement();
        const iconSvg = markerEl.querySelector('.truck-dir-icon') as HTMLElement;
        if (iconSvg) {
          iconSvg.style.transform = `rotate(${bearing}deg)`;
          iconSvg.style.background = priorityColor;
        }

        const radarHalo = markerEl.querySelector('.radar-halo') as HTMLElement;
        if (radarHalo) {
          radarHalo.style.display = (isSelected || isAtRisk) ? 'block' : 'none';
          if (isAtRisk) {
            radarHalo.style.borderColor = '#ef4444';
            radarHalo.style.background = 'rgba(239, 68, 68, 0.35)';
          }
        }
      } else {
        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none relative flex flex-col items-center justify-center';
        el.style.zIndex = '50';

        el.innerHTML = `
          <div style="font-size: 9px; font-weight: 800; color: #0f172a; background: white; border: 1.5px solid ${priorityColor}; border-radius: 4px; padding: 1px 5px; margin-bottom: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); white-space: nowrap;">
            ${escapeHtml(veh.id)} ${isAtRisk ? '⚠️' : isRerouted ? '✅' : ''}
          </div>

          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div class="radar-halo" style="display: ${(isSelected || isAtRisk) ? 'block' : 'none'}; position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: ${isAtRisk ? 'rgba(239, 68, 68, 0.35)' : 'rgba(59, 130, 246, 0.3)'}; border: 1.5px solid ${isAtRisk ? '#ef4444' : '#3b82f6'}; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div class="truck-dir-icon" style="width: 22px; height: 22px; border-radius: 9999px; background: ${priorityColor}; color: white; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); transition: transform 0.3s ease; transform: rotate(${bearing}deg);">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
              </svg>
            </div>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedVehicle(veh);

          const vPill = isAtRisk ? 'critical' : isRerouted ? 'normal' : isCritical ? 'critical' : isHigh ? 'high' : 'normal';
          const vLabel = isAtRisk ? 'ROUTE AT RISK' : isRerouted ? 'REROUTED' : veh.priority;
          new maplibregl.Popup({ offset: 14, closeButton: true, className: 'warm' })
            .setLngLat(veh.coordinates)
            .setHTML(`
              <div class="warm-popup" style="min-width:240px;">
                <div class="wp-head">
                  <span class="priority-pill ${vPill}" style="padding:3px 7px; font-size:10px;">${escapeHtml(vLabel)}</span>
                  <span class="mono" style="font-size:10.5px; font-weight:700; color:var(--text); background:var(--surface-2); border:1px solid var(--border-soft); padding:3px 7px; border-radius:7px;">ETA ${escapeHtml(veh.eta)}</span>
                </div>
                <div class="wp-title">${escapeHtml(veh.id)} · ${escapeHtml(veh.cargo)}</div>
                <div class="wp-meta" style="margin-top:5px;"><b>Driver:</b> ${escapeHtml(veh.driver)} · <span class="mono" style="font-size:11px; color:var(--text-faint);">${escapeHtml(veh.currentRouteId)}</span></div>
                <div style="font-size:11px; color:var(--text-dim); margin-top:4px; line-height:1.4;"><b>To:</b> ${escapeHtml(veh.destination)}</div>
                <div class="wp-divider">
                  <span class="mono" style="font-size:10px; color:var(--text-faint);"><span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${isAtRisk?'var(--crit)':'var(--open)'}; vertical-align:middle; margin-right:4px;"></span>${escapeHtml(veh.gpsStatus || 'SIMULATED')} · ${escapeHtml(veh.speedKmh || 48)} km/h · ${bearing}°</span>
                  <span class="mono" style="font-size:10px; color:var(--text-faint);">${escapeHtml(veh.lastUpdateSec != null ? veh.lastUpdateSec + 's ago' : '')}</span>
                </div>
              </div>
            `)
            .addTo(map);
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(veh.coordinates)
          .addTo(map);

        vehicleMarkersRef.current[veh.id] = marker;
      }
    });

    const selectedVeh = vehicles.find((v) => v.id === selectedVehicleId);
    const trailSource = map.getSource('vehicle-trail-source') as maplibregl.GeoJSONSource;
    if (trailSource && selectedVeh && selectedVeh.trailCoordinates && selectedVeh.trailCoordinates.length > 1) {
      trailSource.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { id: selectedVeh.id },
            geometry: {
              type: 'LineString',
              coordinates: selectedVeh.trailCoordinates,
            },
          },
        ],
      });
    }
  }, [vehicles, layers.activeVehicles, selectedVehicleId, setSelectedVehicle, mapLoaded]);

  const animStepRef = useRef(0);

  useEffect(() => {
    if (!isTrackingPlaying) return;

    const nh37Coords = roadsGeoJSON.features.find((f: any) => f.id === 'NH-37')?.geometry.coordinates as [number, number][];
    const altRouteBCoords = bypassCoords;
    const nh29Coords = roadsGeoJSON.features.find((f: any) => f.id === 'NH-29')?.geometry.coordinates as [number, number][];
    const nh6Coords = roadsGeoJSON.features.find((f: any) => f.id === 'NH-6')?.geometry.coordinates as [number, number][];

    if (!nh37Coords || !nh29Coords || !nh6Coords || !altRouteBCoords) return;

    const interval = setInterval(() => {
      animStepRef.current = (animStepRef.current + 1) % 600;

      const veh104 = vehicles.find((v) => v.id === 'VEH-104');
      const isRerouted104 = veh104?.rerouteAccepted;
      const isAtRisk104 = veh104?.routeAtRisk;

      if (isRerouted104) {
        // Continuous, smooth forward motion along OpenStreetMap ALT-ROUTE-B from Nagaon Junction (~30%) through Golaghat into Jorhat (98%)
        const rerouteProgress = 0.30 + ((animStepRef.current % 400) / 400) * 0.68;
        const idx104 = Math.min(Math.floor(rerouteProgress * (altRouteBCoords.length - 1)), altRouteBCoords.length - 2);

        if (altRouteBCoords[idx104] && altRouteBCoords[idx104 + 1]) {
          const p1 = altRouteBCoords[idx104];
          const p2 = altRouteBCoords[idx104 + 1];
          const brng = calculateBearing(p1, p2);

          let segmentName = 'ALT-ROUTE-B (Golaghat Bypass)';
          if (rerouteProgress < 0.55) {
            segmentName = 'ALT-ROUTE-B (Hojai–Doboka Detour)';
          } else if (rerouteProgress < 0.85) {
            segmentName = 'ALT-ROUTE-B (Golaghat Sector Bypass)';
          } else {
            segmentName = 'ALT-ROUTE-B (Arriving at Jorhat Central Hospital)';
          }

          updateVehiclePosition('VEH-104', p1, {
            bearing: brng,
            currentLocationName: segmentName,
            speedKmh: 46 + Math.floor(Math.sin(animStepRef.current) * 4),
          });
        }
      } else if (isAtRisk104) {
        // Halted right before the blockage near Nagaon/Kaziranga
        const p1: [number, number] = [92.6841, 26.3450];
        updateVehiclePosition('VEH-104', p1, {
          bearing: 90,
          currentLocationName: 'NH-37 (Halted at Nagaon Junction — Blockage Ahead)',
          speedKmh: 0,
        });
      } else {
        // Normal travel along NH-37 (Guwahati to Nagaon / Kaziranga)
        const normalProgress = ((animStepRef.current % 400) / 400) * 0.45;
        const idx104 = Math.min(Math.floor(normalProgress * (nh37Coords.length - 1)), nh37Coords.length - 2);

        if (nh37Coords[idx104] && nh37Coords[idx104 + 1]) {
          const p1 = nh37Coords[idx104];
          const p2 = nh37Coords[idx104 + 1];
          const brng = calculateBearing(p1, p2);
          updateVehiclePosition('VEH-104', p1, {
            bearing: brng,
            currentLocationName: 'NH-37 (Guwahati–Nagaon Corridor)',
            speedKmh: 50 + Math.floor(Math.sin(animStepRef.current) * 5),
          });
        }
      }

      // VEH-409 on NH-29 (Dimapur to Kohima)
      const progress409 = (animStepRef.current % 500) / 500;
      const idx409 = Math.min(Math.floor(progress409 * (nh29Coords.length - 1)), nh29Coords.length - 2);
      if (nh29Coords[idx409] && nh29Coords[idx409 + 1]) {
        const p1 = nh29Coords[idx409];
        const p2 = nh29Coords[idx409 + 1];
        const brng = calculateBearing(p1, p2);
        updateVehiclePosition('VEH-409', p1, {
          bearing: brng,
          currentLocationName: 'NH-29 Hill Route',
          speedKmh: 42 + Math.floor(Math.cos(animStepRef.current) * 4),
        });
      }

      // VEH-312 on NH-6 (Guwahati to Shillong)
      const progress312 = (animStepRef.current % 450) / 450;
      const idx312 = Math.min(Math.floor(progress312 * (nh6Coords.length - 1)), nh6Coords.length - 2);
      if (nh6Coords[idx312] && nh6Coords[idx312 + 1]) {
        const p1 = nh6Coords[idx312];
        const p2 = nh6Coords[idx312 + 1];
        const brng = calculateBearing(p1, p2);
        updateVehiclePosition('VEH-312', p1, {
          bearing: brng,
          currentLocationName: 'NH-6 Meghalaya Section',
          speedKmh: 36 + Math.floor(Math.sin(animStepRef.current) * 5),
        });
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [isTrackingPlaying, vehicles, updateVehiclePosition, bypassCoords]);

  return (
    <div className={`relative w-full h-full bg-[#FBF2E1] overflow-hidden select-none ${className}`}>
      <IntelligenceDock />

      {!hideLayersButton && (
        <div className="absolute top-2.5 left-2.5 z-20">
        <div className="relative">
          <button
            onClick={() => setLayersMenuOpen(!layersMenuOpen)}
            aria-label="Toggle layers menu"
            aria-expanded={layersMenuOpen}
            aria-haspopup="true"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-white border border-[#E8D9BC] text-xs font-semibold text-[#2A211A] hover:bg-[#FBF2E1] transition-colors"
            style={{backdropFilter:'blur(10px)', background:'rgba(255,255,255,.92)'}}
          >
            <Layers className="w-3.5 h-3.5 text-[#6E6252]" />
            <span>Layers</span>
            <ChevronDown className={`w-3 h-3 text-[#9C8F78] transition-transform ${layersMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {layersMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-[260px] bg-white border border-[#E8D9BC] rounded-sm p-1.5 z-30 text-xs animate-fadeIn" style={{boxShadow:'0 16px 36px -12px rgba(42,33,26,.25)'}}>
              <div style={{padding:'4px 6px 6px',fontSize:'10px',fontWeight:700,letterSpacing:'.6px',color:'var(--text-faint)',textTransform:'uppercase'}}>Default</div>
              {[
                { key: 'roadAccessibility', label: 'Road Network', sw:'#A69A8A' },
                { key: 'roadAccessibility', label: 'Road Status', sw:'#7CA36B' },
                { key: 'hazardRisk', label: 'Risk Intensity', sw:'#C94F49' },
              ].map(({ key, label, sw }) => {
                const isChecked = layers[key as keyof typeof layers];
                return (
                  <label key={label} className="layer-chip" style={{margin:'1px 0', padding:'6px 8px'}}>
                    <input type="checkbox" checked={isChecked} onChange={()=>toggleLayer(key as keyof typeof layers)} />
                    <span className="swatch" style={{background:sw}}></span>{label}<span className="check"></span>
                  </label>
                );
              })}
              <div style={{height:1,background:'var(--border-soft)',margin:'6px 0'}}></div>
              <div style={{padding:'4px 6px 6px',fontSize:'10px',fontWeight:700,letterSpacing:'.6px',color:'var(--text-faint)',textTransform:'uppercase'}}>Hazard</div>
              {[
                { key: 'waterways', label: 'Waterways', sw:'#6C93A8' },
                { key: 'hazardRisk', label: 'Landslide Zones', sw:'#B97A4E' },
                { key: 'hazardRisk', label: 'Ground Movement', sw:'#B08FB0' },
              ].map(({ key, label, sw }) => {
                const isChecked = layers[key as keyof typeof layers];
                return (
                  <label key={label} className="layer-chip" style={{margin:'1px 0', padding:'6px 8px'}}>
                    <input type="checkbox" checked={isChecked} onChange={()=>toggleLayer(key as keyof typeof layers)} />
                    <span className="swatch" style={{background:sw}}></span>{label}<span className="check"></span>
                  </label>
                );
              })}
              <div style={{height:1,background:'var(--border-soft)',margin:'6px 0'}}></div>
              <div style={{padding:'4px 6px 6px',fontSize:'10px',fontWeight:700,letterSpacing:'.6px',color:'var(--text-faint)',textTransform:'uppercase'}}>Infrastructure</div>
              {[
                { key: 'bridges', label: 'Bridges', sw:'#ADA08D' },
                { key: 'activeVehicles', label: 'Vehicles', sw:'#E2726B' },
                { key: 'incidents', label: 'Incidents', sw:'#C94F49' },
                { key: 'waterways', label: 'Ferry Terminals', sw:'#6C93A8' },
              ].map(({ key, label, sw }) => {
                const isChecked = layers[key as keyof typeof layers];
                return (
                  <label key={label} className="layer-chip" style={{margin:'1px 0', padding:'6px 8px'}}>
                    <input type="checkbox" checked={isChecked} onChange={()=>toggleLayer(key as keyof typeof layers)} />
                    <span className="swatch" style={{background:sw}}></span>{label}<span className="check"></span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
      )}

      <div className="absolute top-2.5 right-2.5 z-20 flex flex-col bg-white border border-[#E8D9BC] rounded-sm p-0.5" style={{backdropFilter:'blur(10px)', background:'rgba(255,255,255,.92)'}}>
        <button
          onClick={() => mapRef.current?.zoomIn()}
          aria-label="Zoom in"
          className="w-7 h-7 flex items-center justify-center hover:bg-[#FBF2E1] rounded-sm text-[#6E6252] hover:text-[#2A211A]"
          title="Zoom in"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          aria-label="Zoom out"
          className="w-7 h-7 flex items-center justify-center hover:bg-[#FBF2E1] rounded-sm text-[#6E6252] hover:text-[#2A211A] border-t border-[#F1E6CE]"
          title="Zoom out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => mapRef.current?.resetNorthPitch()}
          aria-label="Reset north"
          className="w-7 h-7 flex items-center justify-center hover:bg-[#FBF2E1] rounded-sm text-[#6E6252] hover:text-[#2A211A] border-t border-[#F1E6CE]"
          title="Reset north"
        >
          <Compass className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => mapRef.current?.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM })}
          className="w-7 h-7 flex items-center justify-center hover:bg-[#FBF2E1] rounded-sm text-[#6E6252] hover:text-[#2A211A] border-t border-[#F1E6CE]"
          title="Recenter"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </div>

      <div ref={mapContainerRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3" style={{background:'var(--ink-2)'}}>
          <div className="w-7 h-7 rounded-full border-[3px] border-[var(--border)] border-t-[var(--brand)]" style={{animation:'spin .8s linear infinite'}}></div>
          <div style={{fontSize:'12px', color:'var(--text-faint)'}}>Loading terrain map…</div>
        </div>
      )}

      <div className="absolute bottom-2.5 left-2.5 z-20 bg-white border border-[#E8D9BC] rounded-sm px-3 py-2 flex items-center gap-3 text-[11px] font-medium" style={{backdropFilter:'blur(10px)', background:'rgba(255,251,244,.78)'}}>
        {!simulationActive ? (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5" style={{background:'#10b981'}} aria-hidden />
            <span className="text-[11px] font-bold" style={{color:'#065f46'}}>Active Navigation (Guwahati → Jorhat)</span>
          </span>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5" style={{background:'#ef4444'}} aria-hidden />
              <span className="text-[11px] font-bold" style={{color:'#7f1d1d'}}>Blocked (NH-37 Kaziranga)</span>
            </span>
            <span className="flex items-center gap-1.5 pl-2.5" style={{borderLeft:'1px solid var(--border-soft)'}}>
              <span className="w-3 h-0.5" style={{background:'#10b981'}} aria-hidden />
              <span className="text-[11px] font-bold" style={{color:'#065f46'}}>Bypass (Golaghat)</span>
            </span>
          </>
        )}
        <span className="flex items-center gap-1.5 pl-2.5" style={{borderLeft:'1px solid var(--border-soft)'}}>
          <span className="w-3 h-0.5" style={{background:'#64748b'}} aria-hidden />
          <span className="text-[11px] font-bold" style={{color:'var(--text-faint)'}}>Other Roads</span>
        </span>
      </div>
    </div>
  );
};

export default MapView;
