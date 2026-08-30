import React, { useState } from 'react';
import {
  Truck,
  Shield,
  Globe2,
  BellRing,
  Search,
  AlertTriangle,
  Play,
  Pause,
  Clock,
} from 'lucide-react';
import { usePathSetuStore } from '../../store/usePathSetuStore';

export const FleetSidebar: React.FC = () => {
  const {
    vehicles,
    leftSidebarTab,
    setLeftSidebarTab,
    selectedVehicle,
    selectedVehicleId,
    setSelectedVehicle,
    openAlertBroadcast,
    triggerDisruptionSimulation,
    isTrackingPlaying,
    toggleTrackingPlay
  } = usePathSetuStore();

  const [searchTerm, setSearchTerm] = useState('');

  const filteredVehicles = vehicles.filter((v) =>
    v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeVeh = vehicles.find((v) => v.id === selectedVehicleId) || selectedVehicle || vehicles[0];

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 select-none z-20 overflow-hidden">
      {/* 1. Header with GPS Tracking Active status */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
            Fleet Operations
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>GPS Tracking Active</span>
          </div>
        </div>

        {/* Play/Pause GPS Simulation control */}
        <button
          onClick={toggleTrackingPlay}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors shadow-xs ${
            isTrackingPlaying
              ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
          title={isTrackingPlaying ? 'Pause GPS movement simulation' : 'Play GPS movement simulation'}
        >
          {isTrackingPlaying ? <Pause className="w-3 h-3 text-blue-600" /> : <Play className="w-3 h-3 text-emerald-600" />}
          <span>{isTrackingPlaying ? 'Sim: Running' : 'Sim: Paused'}</span>
        </button>
      </div>

      {/* 2. Navigation Pills */}
      <div className="p-2 border-b border-slate-100 grid grid-cols-2 gap-1 bg-slate-50/60 text-xs">
        <button
          onClick={() => setLeftSidebarTab('fleet')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-semibold transition-all ${
            leftSidebarTab === 'fleet'
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200 font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-blue-600" />
          <span>Fleet Status</span>
        </button>

        <button
          onClick={() => setLeftSidebarTab('risk')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-semibold transition-all ${
            leftSidebarTab === 'risk'
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200 font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          <span>Risk Assess</span>
        </button>

        <button
          onClick={() => setLeftSidebarTab('intel')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-semibold transition-all ${
            leftSidebarTab === 'intel'
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200 font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe2 className="w-3.5 h-3.5 text-indigo-500" />
          <span>Regional Intel</span>
        </button>

        <button
          onClick={() => openAlertBroadcast()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-semibold text-slate-600 hover:bg-slate-100 transition-all"
        >
          <BellRing className="w-3.5 h-3.5 text-red-500" />
          <span>Broadcast</span>
        </button>
      </div>

      {/* 3. Selected Vehicle Detail Panel */}
      {activeVeh && (
        <div className="px-4 py-3.5 bg-blue-50/40 border-b border-blue-100 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900 text-sm tracking-tight">
                {activeVeh.id}
              </span>
              <span
                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                  activeVeh.priority === 'CRITICAL'
                    ? 'bg-red-100 text-red-700'
                    : activeVeh.priority === 'HIGH'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {activeVeh.priority}
              </span>
            </div>

            <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {activeVeh.lastUpdateSec || 1}s ago
            </span>
          </div>

          <div className="font-semibold text-slate-800 text-[11px] line-clamp-1">
            {activeVeh.cargo}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5 text-[10px] text-slate-600">
            <div>
              <span className="text-slate-400 block mb-0.5">Location</span>
              <span className="font-mono font-medium text-slate-700 line-clamp-1 text-[10px]">
                {activeVeh.currentLocationName || activeVeh.currentRouteId}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Destination</span>
              <span className="font-mono font-medium text-slate-700 line-clamp-1 text-[10px]">
                {activeVeh.destination}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-blue-100/80">
            <span className="text-slate-500 text-[10px]">
              ETA: <span className="font-mono font-bold text-slate-800">{activeVeh.eta}</span>
            </span>
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 font-mono text-[9px] rounded font-bold tracking-tight">
              PROTOTYPE GPS
            </span>
          </div>
        </div>
      )}

      {/* 4. Search Filter */}
      <div className="p-2.5 pb-1.5 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vehicle or cargo..."
            className="w-full pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
          {filteredVehicles.length} Active
        </span>
      </div>

      {/* 5. Vehicles List with GPS Status Badges (LIVE / WEAK / OFFLINE) */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredVehicles.map((veh) => {
          const isCritical = veh.priority === 'CRITICAL';
          const isHigh = veh.priority === 'HIGH';
          const isSelected = selectedVehicleId === veh.id;
          const signal = veh.gpsSignal || 'LIVE';

          return (
            <div
              key={veh.id}
              onClick={() => setSelectedVehicle(veh)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/60 border-blue-400 shadow-sm ring-1 ring-blue-300'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              } ${
                isCritical
                  ? 'border-l-4 border-l-red-500'
                  : isHigh
                  ? 'border-l-4 border-l-orange-500'
                  : 'border-l-4 border-l-blue-500'
              }`}
            >
              {/* Top Row: ID + Priority + Risk Status */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono font-bold text-slate-900 text-xs tracking-tight">
                  {veh.id}
                </span>
                <div className="flex items-center gap-1">
                  {veh.routeAtRisk && (
                    <span className="text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-red-100 text-red-700 border border-red-300 animate-pulse flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>AT RISK</span>
                    </span>
                  )}
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      isCritical
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : isHigh
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {veh.priority}
                  </span>
                </div>
              </div>

              {/* Cargo Name */}
              <div className="text-xs font-medium text-slate-700 line-clamp-1">
                {veh.cargo}
              </div>

              {/* Footer: ETA + GPS Status (LIVE / WEAK / OFFLINE) */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <div className="text-slate-500">
                  ETA: <span className="font-mono font-bold text-slate-800">{veh.eta}</span>
                </div>

                <div className="flex items-center gap-1 font-bold">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      signal === 'LIVE'
                        ? 'bg-emerald-500 animate-pulse'
                        : signal === 'WEAK'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span
                    className={`${
                      signal === 'LIVE'
                        ? 'text-emerald-700'
                        : signal === 'WEAK'
                        ? 'text-amber-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {signal}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Disruption Trigger */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={() => triggerDisruptionSimulation()}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs font-bold transition-all shadow-xs active:scale-[0.99]"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          <span>Simulate Disruption</span>
        </button>
      </div>
    </aside>
  );
};
