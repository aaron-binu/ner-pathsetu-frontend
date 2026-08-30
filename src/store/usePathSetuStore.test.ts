import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePathSetuStore } from './usePathSetuStore';
import { Incident, PriorityLevel, RoadStatus } from '../types';

const initialState = usePathSetuStore.getState();

const makeReport = (overrides: Partial<Incident> = {}) => ({
  type: 'Landslide',
  severity: 'CRITICAL' as PriorityLevel,
  roadStatus: 'BLOCKED' as RoadStatus,
  roadSegmentId: 'NH-37',
  roadName: 'NH-37 Test Sector',
  coordinates: [93.18, 26.58] as [number, number],
  photoUrl: '/assets/landslide-cam.jpg',
  reportedBy: 'Test Officer',
  notes: 'unit test report',
  ...overrides,
});

beforeEach(() => {
  usePathSetuStore.setState(initialState);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('submitFieldReport', () => {
  it('applies incident ripple to shared state when online', () => {
    const riskBefore = usePathSetuStore.getState().regionalRiskIndex;
    const blockedBefore = usePathSetuStore.getState().districtConnectivity.blocked;

    usePathSetuStore.getState().submitFieldReport(makeReport());

    const st = usePathSetuStore.getState();
    expect(st.incidents[0].roadStatus).toBe('BLOCKED');
    expect(st.incidents[0].syncStatus).toBe('SYNCED');
    expect(st.roadStatuses['NH-37']).toBe('BLOCKED');
    expect(st.regionalRiskIndex).toBe(Math.min(riskBefore + 15, 95));
    expect(st.districtConnectivity.blocked).toBe(blockedBefore + 1);
  });

  it('restricts roads without bumping blocked count for non-blocked reports', () => {
    const blockedBefore = usePathSetuStore.getState().districtConnectivity.blocked;
    const restrictedBefore = usePathSetuStore.getState().districtConnectivity.restricted;

    usePathSetuStore.getState().submitFieldReport(
      makeReport({ roadSegmentId: 'NH-6', roadStatus: 'RESTRICTED' })
    );

    const st = usePathSetuStore.getState();
    expect(st.roadStatuses['NH-6']).toBe('RESTRICTED');
    expect(st.districtConnectivity.blocked).toBe(blockedBefore);
    expect(st.districtConnectivity.restricted).toBe(restrictedBefore + 1);
  });

  it('queues the report when offline without mutating live state', () => {
    usePathSetuStore.getState().setOfflineMode(true);
    const incidentCount = usePathSetuStore.getState().incidents.length;
    const nh27Before = usePathSetuStore.getState().roadStatuses['NH-27'];

    usePathSetuStore.getState().submitFieldReport(
      makeReport({ roadSegmentId: 'NH-27', roadStatus: 'RESTRICTED' })
    );

    const st = usePathSetuStore.getState();
    expect(st.offlineQueue).toHaveLength(1);
    expect(st.offlineQueue[0].syncStatus).toBe('PENDING');
    expect(st.incidents).toHaveLength(incidentCount);
    expect(st.roadStatuses['NH-27']).toBe(nh27Before);
  });
});

describe('syncOfflineQueue', () => {
  it('applies queued reports to shared state and clears the queue', () => {
    vi.useFakeTimers();
    usePathSetuStore.getState().setOfflineMode(true);
    usePathSetuStore.getState().submitFieldReport(
      makeReport({ roadSegmentId: 'NH-37', roadStatus: 'BLOCKED' })
    );
    usePathSetuStore.getState().submitFieldReport(
      makeReport({ roadSegmentId: 'NH-6', roadStatus: 'RESTRICTED' })
    );

    usePathSetuStore.getState().syncOfflineQueue();
    expect(usePathSetuStore.getState().isSyncing).toBe(true);

    vi.advanceTimersByTime(700);

    const st = usePathSetuStore.getState();
    expect(st.offlineQueue).toHaveLength(0);
    expect(st.isOffline).toBe(false);
    expect(st.isSyncing).toBe(false);
    expect(st.roadStatuses['NH-37']).toBe('BLOCKED');
    expect(st.roadStatuses['NH-6']).toBe('RESTRICTED');
    expect(st.incidents.length).toBeGreaterThanOrEqual(2);
    expect(st.incidents.every((i) => i.syncStatus === 'SYNCED')).toBe(true);
  });
});

describe('disruption simulation', () => {
  it('blocks NH-37 and opens the reroute decision', () => {
    usePathSetuStore.getState().triggerDisruptionSimulation();

    const st = usePathSetuStore.getState();
    expect(st.roadStatuses['NH-37']).toBe('BLOCKED');
    expect(st.routeDecisionModalOpen).toBe(true);
    expect(st.incidents.some((i) => i.id === 'INC-2026-081')).toBe(true);
    expect(st.selectedVehicleId).toBe('VEH-104');
    expect(st.selectedVehicle?.routeAtRisk).toBe(true);
  });

  it('resets road statuses and closes modals', () => {
    usePathSetuStore.getState().triggerDisruptionSimulation();
    usePathSetuStore.getState().resetSimulation();

    const st = usePathSetuStore.getState();
    expect(st.simulationActive).toBe(false);
    expect(st.roadStatuses['NH-37']).toBe('OPEN');
    expect(st.roadStatuses['NH-6']).toBe('OPEN');
    expect(st.routeDecisionModalOpen).toBe(false);
    expect(st.alertBroadcastModalOpen).toBe(false);
    expect(st.regionalRiskIndex).toBe(38);
  });
});

describe('acceptReroute', () => {
  it('switches the vehicle onto the alternative route', () => {
    usePathSetuStore.getState().openRouteDecision();
    usePathSetuStore.getState().acceptReroute('VEH-104');

    const st = usePathSetuStore.getState();
    const veh = st.vehicles.find((v) => v.id === 'VEH-104');
    expect(veh?.currentRouteId).toBe('ALT-ROUTE-B');
    expect(veh?.rerouteAccepted).toBe(true);
    expect(veh?.routeAtRisk).toBe(false);
    expect(st.routeDecisionModalOpen).toBe(false);
    expect(st.focusCoordinates).not.toBeNull();
  });
});

describe('layers', () => {
  it('toggles a single layer without clobbering others', () => {
    const before = usePathSetuStore.getState().layers;
    usePathSetuStore.getState().toggleLayer('hazardRisk');

    const st = usePathSetuStore.getState();
    expect(st.layers.hazardRisk).toBe(!before.hazardRisk);
    expect(st.layers.roadAccessibility).toBe(before.roadAccessibility);
    expect(st.layers.bridges).toBe(before.bridges);
    expect(st.layers.incidents).toBe(before.incidents);
    expect(st.layers.waterways).toBe(before.waterways);
    expect(st.layers.activeVehicles).toBe(before.activeVehicles);
  });
});

describe('GPS tracking', () => {
  it('moves vehicle and extends its trail', () => {
    usePathSetuStore.getState().updateVehiclePosition('VEH-104', [93.0001, 26.0001]);

    const veh = usePathSetuStore.getState().vehicles.find((v) => v.id === 'VEH-104');
    expect(veh?.coordinates).toEqual([93.0001, 26.0001]);
    expect((veh?.trailCoordinates || []).length).toBeGreaterThan(1);
    expect(veh?.lastUpdateSec).toBe(1);
  });

  it('keeps trail bounded to 20 points', () => {
    const state = usePathSetuStore.getState();
    for (let i = 0; i < 30; i++) {
      usePathSetuStore.getState().updateVehiclePosition('VEH-104', [93.0 + i / 1000, 26.0]);
    }
    void state;
    const veh = usePathSetuStore.getState().vehicles.find((v) => v.id === 'VEH-104');
    expect((veh?.trailCoordinates || []).length).toBeLessThanOrEqual(21);
  });
});

describe('navigation', () => {
  it('opens the vehicle detail modal on Fleet tab', () => {
    usePathSetuStore.getState().setActiveTab('Fleet');
    expect(usePathSetuStore.getState().vehicleDetailModalOpen).toBe(true);
    expect(usePathSetuStore.getState().activeTab).toBe('Fleet');
  });
});