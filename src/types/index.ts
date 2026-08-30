export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
export type RoadStatus = 'OPEN' | 'RESTRICTED' | 'BLOCKED' | 'REROUTED' | 'RECOMMENDED' | 'NORMAL_TRIP' | 'BACKGROUND_DIM';
export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED';
export type LanguageCode = 'en' | 'as' | 'mni' | 'lus' | 'kha' | 'brx';

export interface RoadFeatureProperties {
  id: string;
  name: string;
  type: string;
  status: RoadStatus;
  lengthKm: number;
  criticality: PriorityLevel;
  source: string;
  isSimulated?: boolean;
}

export interface RiskZoneProperties {
  id: string;
  name: string;
  riskLevel: PriorityLevel;
  riskScore: number;
  hazardType: string;
  source: string;
  isSimulated?: boolean;
}

export interface BridgeFeatureProperties {
  id: string;
  name: string;
  river: string;
  bridgeType: string;
  status: RoadStatus;
  source: string;
  isSimulated?: boolean;
}

export interface WaterwayFeatureProperties {
  id: string;
  name: string;
  type: 'Corridor' | 'Terminal';
  status: 'OPERATIONAL' | 'RESTRICTED' | 'INACTIVE';
  source: string;
  isSimulated?: boolean;
}

export interface Delivery {
  id: string;
  vehicleId: string;
  destination: string;
  cargoType: 'Medicine' | 'Food' | 'Construction Material' | 'Fuel';
  quantityTons: number;
  priority: PriorityLevel;
  scheduledArrival: string;
  status: 'IN_TRANSIT' | 'DELAYED' | 'DELIVERED';
  source: string;
}

export interface SupplyCategoryStatus {
  category: string;
  stockPercent: number;
  targetDaysReserve: number;
  currentDaysReserve: number;
  districtsAtRisk: number;
  source: string;
}

export interface Vehicle {
  id: string;
  driver: string;
  cargo: string;
  priority: PriorityLevel;
  eta: string;
  destination: string;
  coordinates: [number, number]; // [lng, lat]
  gpsStatus: 'LIVE' | 'OFFLINE' | 'SIMULATED';
  gpsSignal?: 'LIVE' | 'WEAK' | 'OFFLINE';
  lastUpdateSec?: number;
  currentLocationName?: string;
  speedKmh?: number;
  bearing?: number;
  routeAtRisk?: boolean;
  trailCoordinates?: [number, number][];
  currentRouteId: string;
  alternativeRouteId?: string;
  rerouteAccepted?: boolean;
  source?: string;
}

export interface Incident {
  id: string;
  type: string;
  severity: PriorityLevel;
  roadSegmentId: string;
  roadName: string;
  roadStatus: RoadStatus;
  coordinates: [number, number]; // [lng, lat]
  timeLogged: string;
  photoUrl: string;
  reportedBy: string;
  syncStatus: SyncStatus;
  notes?: string;
  source?: string;
}

export interface DistrictMetric {
  id: string;
  name: string;
  state: string;
  status: 'ACCESSIBLE' | 'RESTRICTED' | 'BLOCKED';
  riskLevel: PriorityLevel;
  foodStockPercent: number;
  medicineStockPercent: number;
  constructionStockPercent: number;
}

export interface SupplyChainStatus {
  foodPercent: number;
  medicinePercent: number;
  constructionPercent: number;
  districtsAtRiskCount: number;
}

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  severity: PriorityLevel;
  timestamp: string;
  corridor: string;
  translations: Record<LanguageCode, { title: string; message: string; audioText: string }>;
}
