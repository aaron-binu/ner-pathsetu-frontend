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

maplibregl.setWorkerUrl(maplibreWorkerUrl);

// Free, open-source, watermark-free OpenStreetMap Humanitarian terrain basemap
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

const DEFAULT_CENTER: [number, number] = [93.1000, 26.1000];
const DEFAULT_ZOOM = 7.2;

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
}

export const MapView: React.FC<MapViewProps> = ({
  className = 'w-full h-full',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const vehicleMarkersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const customGisMarkersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);

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
    rightSidebarOpen
  } = usePathSetuStore();

  // Resize map when layout changes or tab switches
  useEffect(() => {
    if (mapRef.current) {
      const t = setTimeout(() => mapRef.current?.resize(), 100);
      const t2 = setTimeout(() => mapRef.current?.resize(), 400);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [leftSidebarOpen, rightSidebarOpen, mapLoaded]);

  // Keep map sized to its container (fixes 1/4 fill when parent has min-height)
  useEffect(() => {
    if (!mapRef.current || !mapContainerRef.current) return;
    const ro = new ResizeObserver(() => mapRef.current?.resize());
    ro.observe(mapContainerRef.current);
    const wrap = mapContainerRef.current.parentElement;
    if (wrap) ro.observe(wrap);
    return () => ro.disconnect();
  }, [mapLoaded]);

  // Focus / fly to vehicle when explicitly clicked in sidebar
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
        // show map immediately, hide spinner on idle (tiles parsed)
        setMapLoaded(true);

        map.addSource('risk-zones-source', {
          type: 'geojson',
          data: riskZonesGeoJSON as any,
        });

        map.addLayer({
          id: 'hazard-risk-fill',
          type: 'fill',
          source: 'risk-zones-source',
          layout: {
            visibility: layers.hazardRisk ? 'visible' : 'none',
          },
          paint: {
            'fill-color': [
              'match',
              ['get', 'riskLevel'],
              'CRITICAL', '#C94F49',
              'HIGH', '#D9A23A',
              '#7CA36B',
            ],
            'fill-opacity': 0.14,
          },
        });

        map.addLayer({
          id: 'hazard-risk-line',
          type: 'line',
          source: 'risk-zones-source',
          layout: {
            visibility: layers.hazardRisk ? 'visible' : 'none',
          },
          paint: {
            'line-color': [
              'match',
              ['get', 'riskLevel'],
              'CRITICAL', '#C94F49',
              'HIGH', '#D9A23A',
              '#7CA36B',
            ],
            'line-width': 1.2,
            'line-dasharray': [2, 2],
          },
        });

        map.on('click', 'hazard-risk-fill', (e: any) => {
          if (!e.features || !e.features[0]) return;
          const props = e.features[0].properties as any;
          new maplibregl.Popup({ offset: 10 })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px 6px; min-width: 210px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-size: 10px; font-weight: 800; color: #dc2626; text-transform: uppercase; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">
                    ${props.riskLevel} HAZARD
                  </span>
                  <span style="font-size: 11px; font-weight: 800; color: #dc2626;">
                    Score: ${props.riskScore}/100
                  </span>
                </div>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.3; margin-bottom: 4px;">
                  ${props.name}
                </div>
                <div style="font-size: 11px; color: #475569; margin-bottom: 3px;">
                  <b>Hazard Type:</b> ${props.hazardType}
                </div>
                <div style="font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px;">
                  <b>Source:</b> ${props.source}
                </div>
              </div>
            `)
            .addTo(map);
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
            'line-color': '#6C93A8',
            'line-width': 2.8,
            'line-dasharray': [4, 2],
            'line-opacity': 0.85,
          },
        });

        map.addSource('roads-source', {
          type: 'geojson',
          data: roadsGeoJSON as any,
        });

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
              'BLOCKED', '#C94F49',
              'RESTRICTED', '#D9A23A',
              '#7CA36B',
            ],
            'line-width': [
              'match',
              ['get', 'status'],
              'BLOCKED', 4.8,
              'RESTRICTED', 4,
              3.5,
            ],
          },
        });

        map.on('click', 'road-accessibility-layer', (e: any) => {
          if (!e.features || !e.features[0]) return;
          const props = e.features[0].properties as any;
          const status = (props.status || 'OPEN').toUpperCase();
          const statusColor = status === 'BLOCKED' ? '#ef4444' : status === 'RESTRICTED' ? '#f59e0b' : '#2563eb';
          const isSimulated = props.isSimulated ? 'Simulated Prototype Data' : 'Verified Highway Network';

          new maplibregl.Popup({ offset: 10 })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px 6px; min-width: 210px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
                  <span style="font-size: 10px; font-weight: 800; color: ${statusColor}; text-transform: uppercase; background: ${statusColor}18; padding: 2px 6px; border-radius: 4px; border: 1px solid ${statusColor}33;">
                    ${status}
                  </span>
                  <span style="font-size: 9px; font-weight: 600; color: #64748b;">
                    ${props.type || 'Road'}
                  </span>
                </div>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.3; margin-bottom: 4px;">
                  ${props.name}
                </div>
                <div style="font-size: 11px; color: #475569; margin-bottom: 3px;">
                  <b>Length:</b> ${props.lengthKm} km | <b>Criticality:</b> ${props.criticality || 'NORMAL'}
                </div>
                <div style="font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px;">
                  <b>Source:</b> ${props.source || isSimulated}
                </div>
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
            'line-color': '#6C93A8',
            'line-width': 3.5,
            'line-opacity': 0.8,
            'line-dasharray': [2, 2],
          },
        });

        const interactiveLayers = ['hazard-risk-fill', 'road-accessibility-layer'];
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
      if (map.getLayer('hazard-risk-fill')) {
        map.setLayoutProperty('hazard-risk-fill', 'visibility', layers.hazardRisk ? 'visible' : 'none');
        map.setLayoutProperty('hazard-risk-line', 'visibility', layers.hazardRisk ? 'visible' : 'none');
      }
      if (map.getLayer('road-accessibility-layer')) {
        map.setLayoutProperty('road-accessibility-layer', 'visibility', layers.roadAccessibility ? 'visible' : 'none');
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    try {
      const source = map.getSource('roads-source') as maplibregl.GeoJSONSource;
      if (source) {
        const updatedFeatures = roadsGeoJSON.features.map((feat: any) => ({
          ...feat,
          properties: {
            ...feat.properties,
            status: roadStatuses[feat.id] || feat.properties.status,
          },
        }));

        source.setData({
          type: 'FeatureCollection',
          features: updatedFeatures,
        });
      }
    } catch (e) {
      console.warn('Road status update error:', e);
    }
  }, [roadStatuses, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    Object.values(customGisMarkersRef.current).forEach((m) => m.remove());
    customGisMarkersRef.current = {};

    if (layers.bridges) {
      bridgesGeoJSON.features.forEach((feat: any) => {
        const props = feat.properties;
        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none ';
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
          new maplibregl.Popup({ offset: 12 })
            .setLngLat(feat.geometry.coordinates)
            .setHTML(`
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px 6px; min-width: 200px;">
                <div style="font-size: 10px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; background: #dbeafe; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 4px;">
                  Strategic Bridge
                </div>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.3; margin-bottom: 4px;">
                  ${props.name}
                </div>
                <div style="font-size: 11px; color: #475569; margin-bottom: 3px;">
                  <b>River:</b> ${props.river} | <b>Type:</b> ${props.bridgeType}
                </div>
                <div style="font-size: 11px; color: #475569; margin-bottom: 3px;">
                  <b>Status:</b> ${props.status || 'OPEN'}
                </div>
                <div style="font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px;">
                  <b>Source:</b> ${props.source}
                </div>
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
      incidents.forEach((feat: any) => {
        const isBlocked = feat.roadStatus === 'BLOCKED';
        const color = isBlocked ? '#dc2626' : '#ea580c';

        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none ';
        el.innerHTML = `
          <div style="display: flex; align-items: center; gap: 4px; background: white; border: 1.5px solid ${color}; border-radius: 9999px; padding: 2px 8px 2px 3px; box-shadow: 0 3px 6px rgba(0,0,0,0.2);">
            <div style="width: 18px; height: 18px; border-radius: 9999px; background: ${color}; color: white; display: flex; align-items: center; justify-content: center;">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <span style="font-size: 10px; font-weight: 800; color: #0f172a; white-space: nowrap;">
              ${feat.type}
            </span>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedIncident(feat);

          new maplibregl.Popup({ offset: 12 })
            .setLngLat(feat.coordinates)
            .setHTML(`
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px 6px; min-width: 220px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-size: 10px; font-weight: 800; color: ${color}; text-transform: uppercase; background: ${color}18; padding: 2px 6px; border-radius: 4px;">
                    ${feat.roadStatus}
                  </span>
                  <span style="font-size: 10px; color: #64748b; font-weight: 600;">
                    ${feat.timeLogged}
                  </span>
                </div>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.3; margin-bottom: 3px;">
                  ${feat.type}: ${feat.roadName}
                </div>
                <div style="font-size: 11px; color: #475569; margin-bottom: 3px;">
                  <b>Severity:</b> ${feat.severity} | <b>Reported by:</b> ${feat.reportedBy}
                </div>
                ${feat.notes ? `<div style="font-size: 10px; color: #334155; margin-bottom: 3px;">${feat.notes}</div>` : ''}
                <div style="font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px;">
                  <b>Source:</b> ${feat.source || 'Field Sentinel Report'}
                </div>
              </div>
            `)
            .addTo(map);
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
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
        el.className = 'cursor-pointer select-none ';
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
          new maplibregl.Popup({ offset: 12 })
            .setLngLat(feat.geometry.coordinates)
            .setHTML(`
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px 6px; min-width: 200px;">
                <div style="font-size: 10px; font-weight: 800; color: #0284c7; text-transform: uppercase; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 4px;">
                  IWT Terminal
                </div>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.3; margin-bottom: 4px;">
                  ${props.name}
                </div>
                <div style="font-size: 11px; color: #475569; margin-bottom: 3px;">
                  <b>Status:</b> ${props.status || 'OPERATIONAL'}
                </div>
                <div style="font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px;">
                  <b>Source:</b> ${props.source}
                </div>
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
  }, [layers.bridges, layers.incidents, layers.waterways, mapLoaded]);

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
      const priorityColor = isCritical ? '#C94F49' : isHigh ? '#D9A23A' : '#7CA36B';
      const bearing = veh.bearing || 0;

      if (vehicleMarkersRef.current[veh.id]) {
        vehicleMarkersRef.current[veh.id].setLngLat(veh.coordinates);

        const markerEl = vehicleMarkersRef.current[veh.id].getElement();
        const iconSvg = markerEl.querySelector('.truck-dir-icon') as HTMLElement;
        if (iconSvg) {
          iconSvg.style.transform = `rotate(${bearing}deg)`;
        }
        const puck = markerEl.querySelector('.truck-dir-icon') as HTMLElement;
        if (puck) {
          puck.style.boxShadow = isSelected
            ? `0 0 0 2px white, 0 0 0 4px ${priorityColor}, 0 1px 4px rgba(0,0,0,0.3)`
            : `0 1px 4px rgba(0,0,0,0.3)`;
        }
      } else {
        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none relative flex flex-col items-center justify-center';
        el.style.zIndex = '50';

        el.innerHTML = `
          <div style="font-size: 9px; font-weight: 600; color: #2A211A; background: white; border: 1px solid ${priorityColor}; border-radius: 4px; padding: 1px 5px; margin-bottom: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.12); white-space: nowrap; font-family: IBM Plex Mono, monospace;">
            ${veh.id}
          </div>
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div class="truck-dir-icon" style="width: 20px; height: 20px; border-radius: 9999px; background: ${priorityColor}; color: white; display: flex; align-items: center; justify-content: center; border: 1.5px solid white; box-shadow: ${isSelected ? `0 0 0 2px white, 0 0 0 4px ${priorityColor}, 0 1px 4px rgba(0,0,0,0.3)` : `0 1px 4px rgba(0,0,0,0.3)`}; transition: transform 0.25s ease; transform: rotate(${bearing}deg);">
              <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
              </svg>
            </div>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedVehicle(veh);

          new maplibregl.Popup({ offset: 14 })
            .setLngLat(veh.coordinates)
            .setHTML(`
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px 6px; min-width: 220px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-size: 10px; font-weight: 800; color: ${priorityColor}; text-transform: uppercase; background: ${priorityColor}18; padding: 2px 6px; border-radius: 4px;">
                    ${veh.priority}
                  </span>
                  <span style="font-size: 10px; font-weight: 800; color: #2563eb; background: #eff6ff; padding: 2px 6px; border-radius: 4px;">
                    ETA: ${veh.eta}
                  </span>
                </div>
                <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
                  ${veh.id} — ${veh.cargo}
                </div>
                <div style="font-size: 11px; color: #475569; margin-bottom: 3px;">
                  <b>Driver:</b> ${veh.driver} | <b>Route:</b> ${veh.currentRouteId}
                </div>
                <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
                  <b>Destination:</b> ${veh.destination}
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px;">
                  <span>GPS: <b style="color: #2563eb;">PROTOTYPE GPS</b></span>
                  <span style="color: #64748b;">${veh.speedKmh || 48} km/h • Bearing: ${bearing}°</span>
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
    const altRouteBCoords = roadsGeoJSON.features.find((f: any) => f.id === 'ALT-ROUTE-B')?.geometry.coordinates as [number, number][];
    const nh29Coords = roadsGeoJSON.features.find((f: any) => f.id === 'NH-29')?.geometry.coordinates as [number, number][];
    const nh6Coords = roadsGeoJSON.features.find((f: any) => f.id === 'NH-6')?.geometry.coordinates as [number, number][];

    if (!nh37Coords || !nh29Coords || !nh6Coords || !altRouteBCoords) return;

    const interval = setInterval(() => {
      animStepRef.current = (animStepRef.current + 1) % 600;
      const progress = (animStepRef.current % 600) / 600;

      const veh104 = vehicles.find((v) => v.id === 'VEH-104');
      const isRerouted104 = veh104?.currentRouteId === 'ALT-ROUTE-B';
      const activeCoords104 = isRerouted104 ? altRouteBCoords : nh37Coords;

      const idx104 = Math.floor(progress * (activeCoords104.length - 1));
      if (activeCoords104[idx104] && activeCoords104[idx104 + 1]) {
        const p1 = activeCoords104[idx104];
        const p2 = activeCoords104[idx104 + 1];
        const brng = calculateBearing(p1, p2);
        updateVehiclePosition('VEH-104', p1, {
          bearing: brng,
          currentLocationName: isRerouted104 ? 'ALT-ROUTE-B (Haflong Bypass)' : 'NH-37 Corridor',
          speedKmh: 48 + Math.floor(Math.sin(animStepRef.current) * 6),
        });
      }

      const idx409 = Math.floor(progress * (nh29Coords.length - 1));
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

      const idx312 = Math.floor(progress * (nh6Coords.length - 1));
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
  }, [isTrackingPlaying, updateVehiclePosition]);

  return (
    <div className={`relative w-full h-full bg-[#FBF2E1] overflow-hidden select-none ${className}`}>
      <div className="absolute top-2.5 left-2.5 z-20">
        <div className="relative">
          <button
            onClick={() => setLayersMenuOpen(!layersMenuOpen)}
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

      <div className="absolute top-2.5 right-2.5 z-20 flex flex-col bg-white border border-[#E8D9BC] rounded-sm p-0.5" style={{backdropFilter:'blur(10px)', background:'rgba(255,255,255,.92)'}}>
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="w-7 h-7 flex items-center justify-center hover:bg-[#FBF2E1] rounded-sm text-[#6E6252] hover:text-[#2A211A]"
          title="Zoom in"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="w-7 h-7 flex items-center justify-center hover:bg-[#FBF2E1] rounded-sm text-[#6E6252] hover:text-[#2A211A] border-t border-[#F1E6CE]"
          title="Zoom out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => mapRef.current?.resetNorthPitch()}
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

      <div className="absolute bottom-2.5 left-2.5 z-20 bg-white border border-[#E8D9BC] rounded-sm px-2.5 py-1.5 flex items-center gap-3 text-[11px] font-medium text-[#6E6252]" style={{backdropFilter:'blur(10px)', background:'rgba(255,251,244,.78)'}}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5" style={{background:'#7CA36B'}} aria-hidden />
          Open
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5" style={{background:'#D9A23A'}} aria-hidden />
          Restricted
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5" style={{background:'#C94F49'}} aria-hidden />
          Blocked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5" style={{background:'#6C93A8'}} aria-hidden />
          Recommended
        </span>
      </div>
    </div>
  );
};

export default MapView;
