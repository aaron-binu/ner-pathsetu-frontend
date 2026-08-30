import React from 'react';
import { GitFork, AlertTriangle, X, Check, ShieldCheck, Clock, ArrowRight, ShieldAlert, MapPin, Navigation } from 'lucide-react';
import { usePathSetuStore } from '../../store/usePathSetuStore';

export const RouteDecisionModal: React.FC = () => {
  const {
    routeDecisionModalOpen,
    closeModals,
    selectedVehicle,
    acceptReroute
  } = usePathSetuStore();

  if (!routeDecisionModalOpen || !selectedVehicle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden select-none">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wide flex items-center gap-2">
                <span>Route Decision Panel</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/30 text-red-300 border border-red-400/40 font-mono">
                  {selectedVehicle.id}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {selectedVehicle.cargo} • Priority {selectedVehicle.priority}
              </p>
            </div>
          </div>

          <button
            onClick={() => closeModals()}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Situation Notice with Clear Destination Unchanged Tag */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Destination (Unchanged)</span>
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-4 h-4 text-red-600 shrink-0" />
                <span>{selectedVehicle.destination}</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Disruption Reason</span>
              <span className="font-bold text-red-600 text-xs">Landslide on NH-37</span>
            </div>
          </div>

          {/* Route Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 1. Current Route (Blocked) */}
            <div className="p-4 rounded-xl border-2 border-red-400 bg-red-50/40 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-red-700 uppercase tracking-wider">
                  Primary Path (NH-37)
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-600 text-white">
                  BLOCKED
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Via Kaziranga Corridor</h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Guwahati ➔ Nagaon ➔ Kaziranga</p>
              </div>

              <div className="space-y-1.5 text-[11px] pt-1.5 border-t border-red-200/70 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <b className="text-red-700">Impassable (Km 142)</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Delay:</span>
                  <b className="font-mono text-red-700">+4 to 6 Hours</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Risk Factor:</span>
                  <b className="text-red-700">Critical (84/100)</b>
                </div>
              </div>
            </div>

            {/* 2. Recommended Alternative Route */}
            <div className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50/50 space-y-3 relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider">
                  Detour Path (ALT-ROUTE-B)
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>RECOMMENDED</span>
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Via Golaghat Southern Bypass</h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Nagaon ➔ Hojai ➔ Golaghat ➔ Jorhat</p>
              </div>

              <div className="space-y-1.5 text-[11px] pt-1.5 border-t border-blue-200/70 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Updated Arrival:</span>
                  <b className="font-mono text-blue-700">5h 50m (+45 min delta)</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Road Quality:</span>
                  <b className="text-emerald-700">Paved / Operational</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Terrain Risk:</span>
                  <b className="text-emerald-700">Low (24/100)</b>
                </div>
              </div>
            </div>
          </div>

          {/* Diversion Junction Info */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2.5 text-xs text-blue-900">
            <Navigation className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Convoy will divert at <b>Nagaon Junction</b>, bypassing Kaziranga through Golaghat directly into <b>Jorhat Central Hospital</b>.
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => closeModals()}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Review on Map
          </button>
          
          <button
            onClick={() => acceptReroute(selectedVehicle.id)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 active:scale-95 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Accept Reroute (Divert via Haflong)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
