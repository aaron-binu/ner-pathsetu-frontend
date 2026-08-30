import { create } from 'zustand';
import { Vehicle, Incident, RoadStatus, LanguageCode, PriorityLevel } from '../types';
import initialVehicles from '../data/vehicles.json';
import initialIncidents from '../data/incidents.json';

interface LayerState {
  hazardRisk: boolean;
  roadAccessibility: boolean;
  bridges: boolean;
  activeVehicles: boolean;
  incidents: boolean;
  waterways: boolean;
}

export interface ToastNotification {
  title: string;
  body: string;
  type: 'danger' | 'success' | 'info';
}

export interface AlertItem {
  id: string;
  severity: PriorityLevel;
  corridor: string;
  title: string;
  message: string;
  timestamp: string;
  lang: string;
  recipient: string;
  vehicles: string[];
}

interface PathSetuState {
  activeTab: 'Dashboard' | 'Map' | 'Logistics' | 'Incidents' | 'Alerts' | 'Analytics' | 'Fleet' | 'Archive';
  leftSidebarTab: 'fleet' | 'risk' | 'intel';
  activeView: 'dashboard' | 'field-sentinel';
  routeDecisionModalOpen: boolean;
  alertBroadcastModalOpen: boolean;
  vehicleDetailModalOpen: boolean;
  incidentDetailModalOpen: boolean;
  
  toastNotification: ToastNotification | null;
  setToastNotification: (toast: ToastNotification | null) => void;

  selectedVehicle: Vehicle | null;
  selectedVehicleId: string | null;
  selectedIncident: Incident | null;
  focusCoordinates: [number, number] | null;

  isTrackingPlaying: boolean;
  toggleTrackingPlay: () => void;
  setFocusCoordinates: (coords: [number, number] | null) => void;

  layers: LayerState;

  simulationActive: boolean;
  roadStatuses: Record<string, RoadStatus>;
  vehicles: Vehicle[];
  incidents: Incident[];
  alerts: AlertItem[];
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

  selectedLanguage: LanguageCode;

  isOffline: boolean;
  isSyncing: boolean;
  offlineQueue: Incident[];

  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;

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

const baseVehicles: Vehicle[] = (initialVehicles as Vehicle[]).map((v) => ({
  ...v,
  routeAtRisk: false,
  rerouteAccepted: false,
  eta: v.id === 'VEH-104' ? '5h 05m' : v.eta,
  currentRouteId: v.id === 'VEH-104' ? 'NH-37' : v.currentRouteId,
  currentLocationName: v.id === 'VEH-104' ? 'NH-37 (Guwahati–Nagaon Corridor)' : v.currentLocationName,
  destination: v.id === 'VEH-104' ? 'Jorhat Central Hospital, Upper Assam' : v.destination,
  lastUpdateSec: 0,
  trailCoordinates: [v.coordinates],
}));

const baseAlerts: AlertItem[] = [
  {
    id: 'ALT-002',
    severity: 'HIGH',
    corridor: 'NH-6 (Jowai – Silchar Corridor)',
    title: 'ROAD RESTRICTED — Single Lane Subsidence',
    message: 'Single-file convoy escort in effect. Heavy vehicles advised to proceed with caution near Sonapur tunnel.',
    timestamp: '10:15 HRS',
    lang: 'English',
    recipient: 'VEH-312 · Medical Oxygen',
    vehicles: ['VEH-312'],
  },
  {
    id: 'ALT-005',
    severity: 'NORMAL',
    corridor: 'NH-29 (Dimapur – Kohima Lifeline)',
    title: 'TRANSIT UPDATE — Mountain Route Open',
    message: 'All commercial freight passing normally through Medziphema checkpoint.',
    timestamp: '08:30 HRS',
    lang: 'English',
    recipient: 'VEH-409 · Construction Materials',
    vehicles: ['VEH-409'],
  }
];

export const usePathSetuStore = create<PathSetuState>((set, get) => ({
  activeTab: 'Dashboard',
  leftSidebarTab: 'fleet',
  activeView: 'dashboard',
  routeDecisionModalOpen: false,
  alertBroadcastModalOpen: false,
  vehicleDetailModalOpen: false,
  incidentDetailModalOpen: false,
  
  toastNotification: null,
  setToastNotification: (toast) => set({ toastNotification: toast }),

  selectedVehicle: baseVehicles[0],
  selectedVehicleId: 'VEH-104',
  selectedIncident: null,
  focusCoordinates: null,

  isTrackingPlaying: true,
  toggleTrackingPlay: () => set((state) => ({ isTrackingPlaying: !state.isTrackingPlaying })),
  setFocusCoordinates: (coords) => set({ focusCoordinates: coords }),

  layers: {
    hazardRisk: true,
    roadAccessibility: true,
    bridges: true,
    activeVehicles: true,
    incidents: true,
    waterways: true,
  },

  simulationActive: false,
  roadStatuses: {
    'NH-37': 'OPEN',
    'NH-27': 'OPEN',
    'NH-29': 'OPEN',
    'NH-6': 'OPEN',
    'ALT-ROUTE-B': 'OPEN',
  },
  vehicles: baseVehicles,
  incidents: initialIncidents as Incident[],
  alerts: baseAlerts,
  regionalRiskIndex: 32,
  supplyStatus: {
    food: 96,
    medicine: 94,
    construction: 90,
    districtsAtRisk: 0,
  },
  districtConnectivity: {
    accessible: 18,
    restricted: 0,
    blocked: 0,
  },

  selectedLanguage: 'en',
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
      roadName: 'NH-37 (Kaziranga / Upper Assam Sector)',
      roadStatus: 'BLOCKED',
      coordinates: [93.1800, 26.5800],
      timeLogged: '09:42 HRS',
      photoUrl: '/assets/landslide-cam.jpg',
      reportedBy: 'Field Sentinel Unit #04',
      syncStatus: 'SYNCED',
      notes: 'Major mud & boulder slide blocking both lanes at Km 142. Impassable for heavy convoys.',
      source: 'Field Sentinel Landslide Sensor',
    };

    const simulatedAlerts: AlertItem[] = [
      {
        id: 'ALT-001',
        severity: 'CRITICAL',
        corridor: 'NH-37 (Kaziranga / Upper Assam Sector)',
        title: 'ROAD BLOCKED — Landslide Disruption Detected',
        message: 'Major mud & boulder slide blocking both lanes at Km 142. VEH-104 halted before blockage. Bypass via ALT-ROUTE-B activated.',
        timestamp: '09:42 HRS',
        lang: 'Assamese',
        recipient: 'VEH-104 · Emergency Medicine (Critical)',
        vehicles: ['VEH-104'],
      },
      {
        id: 'ALT-003',
        severity: 'CRITICAL',
        corridor: 'NH-37 Kaziranga / Golaghat Bypass',
        title: 'CONVOY REROUTE MANDATE — Emergency Medicine',
        message: 'Emergency Medicine convoy halted before blockage at Nagaon Junction. Reroute via Golaghat bypass ready (+45 min).',
        timestamp: '09:44 HRS',
        lang: 'Mizo',
        recipient: 'VEH-104 · Emergency Medicine',
        vehicles: ['VEH-104'],
      },
      ...baseAlerts,
    ];

    set((state) => {
      const junctionCoords: [number, number] = [92.6841, 26.3450];
      const updatedVehicles = state.vehicles.map((v) =>
        v.id === 'VEH-104'
          ? {
              ...v,
              routeAtRisk: true,
              rerouteAccepted: false,
              eta: '5h 05m (+4h Blockage Delay)',
              coordinates: junctionCoords,
              currentLocationName: 'NH-37 (Halted near Nagaon Junction — Blockage Ahead)',
            }
          : v.id === 'VEH-205'
          ? {
              ...v,
              routeAtRisk: true,
              eta: '7h 20m (+2h Delay)',
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
        },
        incidents: [landslideIncident, ...(initialIncidents as Incident[])],
        alerts: simulatedAlerts,
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
        toastNotification: {
          title: 'LANDSLIDE DISRUPTION DETECTED',
          body: 'NH-37 is blocked at Km 142. VEH-104 halted before blockage. Golaghat bypass activated.',
          type: 'danger',
        },
      };
    });
  },

  resetSimulation: () => {
    set({
      simulationActive: false,
      roadStatuses: {
        'NH-37': 'OPEN',
        'NH-27': 'OPEN',
        'NH-29': 'OPEN',
        'NH-6': 'OPEN',
        'ALT-ROUTE-B': 'OPEN',
      },
      vehicles: baseVehicles,
      incidents: initialIncidents as Incident[],
      alerts: baseAlerts,
      regionalRiskIndex: 32,
      supplyStatus: {
        food: 96,
        medicine: 94,
        construction: 90,
        districtsAtRisk: 0,
      },
      districtConnectivity: {
        accessible: 18,
        restricted: 0,
        blocked: 0,
      },
      routeDecisionModalOpen: false,
      alertBroadcastModalOpen: false,
      selectedVehicle: baseVehicles[0],
      selectedVehicleId: 'VEH-104',
      selectedIncident: null,
      toastNotification: {
        title: 'NORMAL OPERATIONS RESTORED',
        body: 'All highway corridors operational. Fleet telemetry live with standard schedules.',
        type: 'info',
      },
    });
  },

  acceptReroute: (vehicleId: string) => {
    set((state) => {
      const junctionCoords: [number, number] = [92.6841, 26.3450];
      const updatedVehicles = state.vehicles.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              currentRouteId: 'ALT-ROUTE-B',
              rerouteAccepted: true,
              routeAtRisk: false,
              eta: '5h 50m (Bypass Active)',
              coordinates: junctionCoords,
              currentLocationName: 'ALT-ROUTE-B (Golaghat Bypass Corridor)',
            }
          : v
      );

      const rerouteAlert: AlertItem = {
        id: `ALT-REROUTE-${Date.now().toString().slice(-4)}`,
        severity: 'NORMAL',
        corridor: 'ALT-ROUTE-B (Golaghat Bypass Corridor)',
        title: 'REROUTE APPROVED — Convoy Resuming Transit',
        message: `${vehicleId} diverted via ALT-ROUTE-B to Jorhat Central Hospital. Active Navigation ETA: 5h 50m.`,
        timestamp: 'Just now',
        lang: 'English',
        recipient: `${vehicleId} · Emergency Medicine`,
        vehicles: [vehicleId],
      };

      const targetVehicle = updatedVehicles.find((v) => v.id === vehicleId) || state.selectedVehicle;

      return {
        vehicles: updatedVehicles,
        selectedVehicle: targetVehicle,
        focusCoordinates: junctionCoords,
        alerts: [rerouteAlert, ...state.alerts],
        roadStatuses: {
          ...state.roadStatuses,
          'ALT-ROUTE-B': 'REROUTED',
        },
        supplyStatus: {
          ...state.supplyStatus,
          medicine: 88,
          districtsAtRisk: 1,
        },
        districtConnectivity: {
          accessible: 14,
          restricted: 3,
          blocked: 1,
        },
        regionalRiskIndex: 42,
        routeDecisionModalOpen: false,
        toastNotification: {
          title: 'REROUTE ACCEPTED & DISPATCHED',
          body: `${vehicleId} successfully rerouted via Golaghat Bypass to Jorhat Hospital. ETA: 5h 50m.`,
          type: 'success',
        },
      };
    });
  },

  updateVehiclePosition: (vehicleId, coordinates, additionalProps) => {
    set((state) => {
      const updatedVehicles = state.vehicles.map((v) => {
        if (v.id === vehicleId) {
          const trail = v.trailCoordinates || [];
          return {
            ...v,
            coordinates,
            trailCoordinates: [...trail.slice(-19), coordinates],
            lastUpdateSec: (v.lastUpdateSec || 0) + 1,
            ...additionalProps,
          };
        }
        return v;
      });

      const updatedSelected =
        state.selectedVehicle && state.selectedVehicle.id === vehicleId
          ? updatedVehicles.find((v) => v.id === vehicleId) || state.selectedVehicle
          : state.selectedVehicle;

      return {
        vehicles: updatedVehicles,
        selectedVehicle: updatedSelected,
      };
    });
  },

  setSelectedVehicle: (vehicle) => {
    set({
      selectedVehicle: vehicle,
      selectedVehicleId: vehicle ? vehicle.id : null,
      selectedIncident: null,
      focusCoordinates: vehicle ? vehicle.coordinates : null,
    });
  },

  setSelectedIncident: (incident) => {
    set({
      selectedIncident: incident,
      selectedVehicle: null,
      selectedVehicleId: null,
      focusCoordinates: incident ? incident.coordinates : null,
    });
  },

  openRouteDecision: (vehicle) => {
    if (vehicle) {
      set({ selectedVehicle: vehicle, selectedVehicleId: vehicle.id });
    }
    set({ routeDecisionModalOpen: true });
  },

  openAlertBroadcast: () => set({ alertBroadcastModalOpen: true }),
  openVehicleDetail: (vehicle) => set({ selectedVehicle: vehicle, selectedVehicleId: vehicle.id, vehicleDetailModalOpen: true }),
  openIncidentDetail: (incident) => set({ selectedIncident: incident, incidentDetailModalOpen: true }),
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
    const isOffline = get().isOffline;
    const newIncident: Incident = {
      ...report,
      id: `INC-${Date.now().toString().slice(-4)}`,
      timeLogged: 'Just now',
      syncStatus: isOffline ? 'PENDING' : 'SYNCED',
    };

    if (isOffline) {
      set((state) => ({
        offlineQueue: [...state.offlineQueue, newIncident],
        toastNotification: {
          title: 'SAVED OFFLINE (PENDING SYNC)',
          body: 'Incident queued locally in IndexedDB cache.',
          type: 'info',
        },
      }));
    } else {
      const isBlocked = report.roadStatus === 'BLOCKED';
      const updatedStatuses = { ...get().roadStatuses };
      if (report.roadSegmentId) {
        updatedStatuses[report.roadSegmentId] = report.roadStatus;
      }

      set((state) => ({
        incidents: [newIncident, ...state.incidents],
        roadStatuses: updatedStatuses,
        regionalRiskIndex: Math.min(95, state.regionalRiskIndex + (isBlocked ? 15 : 6)),
        districtConnectivity: {
          ...state.districtConnectivity,
          blocked: state.districtConnectivity.blocked + (isBlocked ? 1 : 0),
          restricted: state.districtConnectivity.restricted + (!isBlocked ? 1 : 0),
        },
        toastNotification: {
          title: 'FIELD REPORT SUBMITTED',
          body: 'Incident verified & synchronized across intelligence network.',
          type: 'success',
        },
      }));
    }
  },

  syncOfflineQueue: () => {
    set({ isSyncing: true });
    setTimeout(() => {
      const queue = get().offlineQueue;
      const updatedStatuses = { ...get().roadStatuses };
      
      queue.forEach((item) => {
        if (item.roadSegmentId) {
          updatedStatuses[item.roadSegmentId] = item.roadStatus;
        }
      });

      const syncedItems: Incident[] = queue.map((item) => ({
        ...item,
        syncStatus: 'SYNCED' as const,
      }));

      set((state) => ({
        isOffline: false,
        isSyncing: false,
        offlineQueue: [],
        incidents: [...syncedItems, ...state.incidents],
        roadStatuses: updatedStatuses,
        toastNotification: {
          title: 'OFFLINE SYNC COMPLETED',
          body: 'All cached telemetry synced to central dashboard.',
          type: 'success',
        },
      }));
    }, 500);
  },
}));
