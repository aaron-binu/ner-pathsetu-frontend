import { create } from 'zustand';
import { Vehicle, Incident, RoadStatus, LanguageCode } from '../types';
import initialVehicles from '../data/vehicles.json';
import initialIncidents from '../data/incidents.json';
import roadsGeoJSON from '../data/roads.geojson';

interface LayerState {
  hazardRisk: boolean;
  roadAccessibility: boolean;
  bridges: boolean;
  activeVehicles: boolean;
  incidents: boolean;
  waterways: boolean;
}

interface PathSetuState {
  // Navigation & Modals
  activeTab: 'Dashboard' | 'Map' | 'Logistics' | 'Incidents' | 'Alerts' | 'Analytics' | 'Fleet' | 'Archive';
  leftSidebarTab: 'fleet' | 'risk' | 'intel';
  activeView: 'dashboard' | 'field-sentinel';
  routeDecisionModalOpen: boolean;
  alertBroadcastModalOpen: boolean;
  vehicleDetailModalOpen: boolean;
  incidentDetailModalOpen: boolean;
  
  // Selected Entities
  selectedVehicle: Vehicle | null;
  selectedVehicleId: string | null;
  selectedIncident: Incident | null;
  focusCoordinates: [number, number] | null;

  // GPS Tracking Simulation
  isTrackingPlaying: boolean;
  toggleTrackingPlay: () => void;
  setFocusCoordinates: (coords: [number, number] | null) => void;

  // GIS Layer State
  layers: LayerState;

  // Core Intelligence State
  simulationActive: boolean;
  roadStatuses: Record<string, RoadStatus>;
  vehicles: Vehicle[];
  incidents: Incident[];
  regionalRiskIndex: number;
  supplyStatus: {
    food: number;
    medicine: number;
    construction: number;
    districtsAtRisk: number;
  };
  districtConnectivity: {
    accessible: number;
    restricted: number;
    blocked: number;
  };

  // Multilingual & Alert State
  selectedLanguage: LanguageCode;

  // Field Sentinel & Offline State
  isOffline: boolean;
  isSyncing: boolean;
  offlineQueue: Incident[];

  // Layout Toggles
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;

  // Actions
  setActiveTab: (tab: 'Dashboard' | 'Map' | 'Logistics' | 'Incidents' | 'Alerts' | 'Analytics' | 'Fleet' | 'Archive') => void;
  setLeftSidebarTab: (tab: 'fleet' | 'risk' | 'intel') => void;
  setActiveView: (view: 'dashboard' | 'field-sentinel') => void;
  toggleLayer: (layer: keyof LayerState) => void;
  triggerDisruptionSimulation: () => void;
  resetSimulation: () => void;
  acceptReroute: (vehicleId: string) => void;
  updateVehiclePosition: (vehicleId: string, coordinates: [number, number], additionalProps?: Partial<Vehicle>) => void;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  setSelectedIncident: (incident: Incident | null) => void;
  openRouteDecision: (vehicle?: Vehicle) => void;
  openAlertBroadcast: () => void;
  openVehicleDetail: (vehicle: Vehicle) => void;
  openIncidentDetail: (incident: Incident) => void;
  closeModals: () => void;
  setSelectedLanguage: (lang: LanguageCode) => void;
  setOfflineMode: (offline: boolean) => void;
  submitFieldReport: (report: Omit<Incident, 'id' | 'timeLogged' | 'syncStatus'>) => void;
  syncOfflineQueue: () => void;
}

export const usePathSetuStore = create<PathSetuState>((set, get) => ({
  activeTab: 'Dashboard',
  leftSidebarTab: 'fleet',
  activeView: 'dashboard',
  routeDecisionModalOpen: false,
  alertBroadcastModalOpen: false,
  vehicleDetailModalOpen: false,
  incidentDetailModalOpen: false,
  selectedVehicle: initialVehicles[0] as Vehicle,
  selectedVehicleId: 'VEH-104',
  selectedIncident: initialIncidents[0] as Incident,
  focusCoordinates: null,

  isTrackingPlaying: true,
  toggleTrackingPlay: () => set((state) => ({ isTrackingPlaying: !state.isTrackingPlaying })),
  setFocusCoordinates: (coords) => set({ focusCoordinates: coords }),

  layers: {
    hazardRisk: false,
    roadAccessibility: true,
    bridges: true,
    activeVehicles: true,
    incidents: true,
    waterways: true,
  },

  simulationActive: true,
  roadStatuses: {
    'NH-37': 'BLOCKED',
    'NH-27': 'OPEN',
    'NH-29': 'OPEN',
    'NH-6': 'RESTRICTED',
    'ALT-ROUTE-B': 'OPEN',
  },
  vehicles: initialVehicles as Vehicle[],
  incidents: initialIncidents as Incident[],
  regionalRiskIndex: 72,
  supplyStatus: {
    food: 82,
    medicine: 46,
    construction: 71,
    districtsAtRisk: 2,
  },
  districtConnectivity: {
    accessible: 12,
    restricted: 4,
    blocked: 2,
  },

  selectedLanguage: 'mni',
  isOffline: false,
  isSyncing: false,
  offlineQueue: [],

  leftSidebarOpen: true,
  rightSidebarOpen: true,
  toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),

  setActiveTab: (tab) => {
    set({ activeTab: tab });
    if (tab === 'Fleet') {
      set({ vehicleDetailModalOpen: true });
    }
  },

  setLeftSidebarTab: (tab) => set({ leftSidebarTab: tab }),

  setActiveView: (view) => set({ activeView: view }),

  toggleLayer: (layer) =>
    set((state) => ({
      layers: { ...state.layers, [layer]: !state.layers[layer] },
    })),

  triggerDisruptionSimulation: () => {
    const landslideIncident: Incident = {
      id: 'INC-2026-081',
      type: 'Landslide',
      severity: 'CRITICAL',
      roadSegmentId: 'NH-37',
      roadName: 'NH-37 near Kaziranga / Jiribam Corridor',
      roadStatus: 'BLOCKED',
      coordinates: [93.1800, 26.5800],
      timeLogged: 'JUST NOW',
      photoUrl: '/assets/landslide-cam.jpg',
      reportedBy: 'Field Sentinel #4 (PWD Highway Patrol)',
      syncStatus: 'SYNCED',
      notes: 'Major mud & boulder slide blocking both lanes. Immediate reroute advisory active.',
      source: 'Field Sentinel Report (Simulated Disruption)',
    };

    set((state) => {
      const existingIncidents = state.incidents.filter((i) => i.id !== 'INC-2026-081');
      const updatedVehicles = state.vehicles.map((v) =>
        v.id === 'VEH-104'
          ? {
              ...v,
              routeAtRisk: true,
              rerouteAccepted: false,
              eta: '5h 05m (+4h Blockage Delay)',
              currentLocationName: 'NH-37 (Landslide Blockage Ahead)',
            }
          : v
      );

      const targetVehicle = updatedVehicles.find((v) => v.id === 'VEH-104') || updatedVehicles[0];

      return {
        simulationActive: true,
        roadStatuses: {
          ...state.roadStatuses,
          'NH-37': 'BLOCKED',
          'ALT-ROUTE-B': 'OPEN',
          'NH-6': 'RESTRICTED',
        },
        incidents: [landslideIncident, ...existingIncidents],
        vehicles: updatedVehicles,
        selectedVehicle: targetVehicle,
        selectedVehicleId: targetVehicle.id,
        selectedIncident: landslideIncident,
        focusCoordinates: [93.1800, 26.5800],
        regionalRiskIndex: 78,
        supplyStatus: {
          food: 82,
          medicine: 46,
          construction: 71,
          districtsAtRisk: 2,
        },
        districtConnectivity: {
          accessible: 12,
          restricted: 4,
          blocked: 2,
        },
        routeDecisionModalOpen: true,
      };
    });
  },

  resetSimulation: () => {
    set((state) => ({
      simulationActive: false,
      roadStatuses: {
        'NH-37': 'OPEN',
        'NH-27': 'OPEN',
        'NH-29': 'OPEN',
        'NH-6': 'OPEN',
        'ALT-ROUTE-B': 'OPEN',
      },
      vehicles: state.vehicles.map((v) =>
        v.id === 'VEH-104'
          ? {
              ...v,
              currentRouteId: 'NH-37',
              routeAtRisk: false,
              rerouteAccepted: false,
              eta: '5h 05m',
              currentLocationName: 'NH-37 Corridor',
            }
          : { ...v, routeAtRisk: false }
      ),
      regionalRiskIndex: 38,
      supplyStatus: {
        food: 94,
        medicine: 89,
        construction: 91,
        districtsAtRisk: 0,
      },
      districtConnectivity: {
        accessible: 18,
        restricted: 0,
        blocked: 0,
      },
      routeDecisionModalOpen: false,
      alertBroadcastModalOpen: false,
    }));
  },

  acceptReroute: (vehicleId: string) => {
    set((state) => {
      const altRouteCoords = roadsGeoJSON.features.find((f: any) => f.id === 'ALT-ROUTE-B')?.geometry.coordinates[0] as [number, number];
      const updatedVehicles = state.vehicles.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              currentRouteId: 'ALT-ROUTE-B',
              rerouteAccepted: true,
              routeAtRisk: false,
              eta: '5h 50m (Bypass Active)',
              coordinates: altRouteCoords || ([92.8000, 25.8000] as [number, number]),
              currentLocationName: 'ALT-ROUTE-B (Haflong Bypass)',
            }
          : v
      );

      const targetVehicle = updatedVehicles.find((v) => v.id === vehicleId) || state.selectedVehicle;

      return {
        vehicles: updatedVehicles,
        selectedVehicle: targetVehicle,
        focusCoordinates: targetVehicle?.coordinates || null,
        routeDecisionModalOpen: false,
      };
    });
  },

  updateVehiclePosition: (vehicleId: string, coordinates: [number, number], additionalProps?: Partial<Vehicle>) => {
    set((state) => {
      const updatedVehicles = state.vehicles.map((v) => {
        if (v.id === vehicleId) {
          const pastTrails = v.trailCoordinates || [v.coordinates];
          const newTrails = [...pastTrails.slice(-20), coordinates];
          return {
            ...v,
            coordinates,
            trailCoordinates: newTrails,
            lastUpdateSec: 1,
            ...additionalProps,
          };
        }
        return {
          ...v,
          lastUpdateSec: Math.min((v.lastUpdateSec || 2) + 1, 60),
        };
      });

      const updatedSelectedVehicle =
        state.selectedVehicle?.id === vehicleId
          ? updatedVehicles.find((v) => v.id === vehicleId) || state.selectedVehicle
          : state.selectedVehicle;

      return {
        vehicles: updatedVehicles,
        selectedVehicle: updatedSelectedVehicle,
      };
    });
  },

  setSelectedVehicle: (vehicle) =>
    set({
      selectedVehicle: vehicle,
      selectedVehicleId: vehicle?.id || null,
      focusCoordinates: vehicle?.coordinates || null,
    }),
  setSelectedIncident: (incident) => set({ selectedIncident: incident }),

  openRouteDecision: (vehicle) =>
    set({
      selectedVehicle: vehicle || get().vehicles[0],
      routeDecisionModalOpen: true,
    }),

  openAlertBroadcast: () => set({ alertBroadcastModalOpen: true }),

  openVehicleDetail: (vehicle) =>
    set({
      selectedVehicle: vehicle,
      vehicleDetailModalOpen: true,
    }),

  openIncidentDetail: (incident) =>
    set({
      selectedIncident: incident,
      incidentDetailModalOpen: true,
    }),

  closeModals: () =>
    set({
      routeDecisionModalOpen: false,
      alertBroadcastModalOpen: false,
      vehicleDetailModalOpen: false,
      incidentDetailModalOpen: false,
    }),

  setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),

  setOfflineMode: (offline) => set({ isOffline: offline }),

  submitFieldReport: (report) => {
    const newIncident: Incident = {
      ...report,
      id: `INC-${Date.now().toString().slice(-4)}`,
      timeLogged: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' HRS',
      syncStatus: get().isOffline ? 'PENDING' : 'SYNCED',
    };

    if (get().isOffline) {
      set((state) => ({
        offlineQueue: [newIncident, ...state.offlineQueue],
      }));
    } else {
      set((state) => {
        const updatedRoadStatuses = {
          ...state.roadStatuses,
          [newIncident.roadSegmentId]: newIncident.roadStatus,
        };

        const isDisrupted = newIncident.roadStatus === 'BLOCKED' || newIncident.roadStatus === 'RESTRICTED';
        const updatedVehicles = state.vehicles.map((v) =>
          v.currentRouteId === newIncident.roadSegmentId
            ? { ...v, routeAtRisk: isDisrupted }
            : v
        );

        return {
          incidents: [newIncident, ...state.incidents],
          roadStatuses: updatedRoadStatuses,
          vehicles: updatedVehicles,
          selectedIncident: newIncident,
          focusCoordinates: newIncident.coordinates,
          regionalRiskIndex: Math.min(state.regionalRiskIndex + 15, 95),
          districtConnectivity: {
            ...state.districtConnectivity,
            blocked: newIncident.roadStatus === 'BLOCKED' ? state.districtConnectivity.blocked + 1 : state.districtConnectivity.blocked,
            restricted: newIncident.roadStatus === 'RESTRICTED' ? state.districtConnectivity.restricted + 1 : state.districtConnectivity.restricted,
          },
        };
      });
    }
  },

  syncOfflineQueue: () => {
    const queue = get().offlineQueue;
    if (queue.length === 0) return;

    set({ isSyncing: true });

    setTimeout(() => {
      const synced = queue.map((item) => ({ ...item, syncStatus: 'SYNCED' as const }));

      set((state) => {
        let updatedRoadStatuses = { ...state.roadStatuses };
        synced.forEach((inc) => {
          updatedRoadStatuses[inc.roadSegmentId] = inc.roadStatus;
        });

        const updatedVehicles = state.vehicles.map((v) => {
          const matchingInc = synced.find((inc) => inc.roadSegmentId === v.currentRouteId);
          if (matchingInc && (matchingInc.roadStatus === 'BLOCKED' || matchingInc.roadStatus === 'RESTRICTED')) {
            return { ...v, routeAtRisk: true };
          }
          return v;
        });

        return {
          incidents: [...synced, ...state.incidents],
          roadStatuses: updatedRoadStatuses,
          vehicles: updatedVehicles,
          offlineQueue: [],
          isOffline: false,
          isSyncing: false,
        };
      });
    }, 700);
  },
}));
