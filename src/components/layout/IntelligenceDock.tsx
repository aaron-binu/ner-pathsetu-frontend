import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  Waves,
  Hammer,
  Megaphone,
  Volume2,
  ChevronDown,
  ArrowRight,
  Shield,
  Activity,
  CheckCircle2,
  X,
  Package,
  Radio,
  Layers
} from 'lucide-react';
import { usePathSetuStore } from '../../store/usePathSetuStore';
import { LanguageCode } from '../../types';
import { playMultilingualAlert } from '../../utils/audio';

type ActiveFlyout = 'risk' | 'supplies' | 'incidents' | 'broadcast' | null;

export const IntelligenceDock: React.FC = () => {
  const {
    regionalRiskIndex,
    supplyStatus,
    districtConnectivity,
    incidents,
    setSelectedIncident,
    setFocusCoordinates,
    selectedLanguage,
    setSelectedLanguage,
    simulationActive,
    openAlertBroadcast
  } = usePathSetuStore();

  const [activeFlyout, setActiveFlyout] = useState<ActiveFlyout>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  const isRiskHigh = regionalRiskIndex >= 70;

  // Close flyout on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setActiveFlyout(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleFlyout = (flyout: ActiveFlyout) => {
    setActiveFlyout(activeFlyout === flyout ? null : flyout);
  };

  return (
    <div ref={dockRef} className="absolute top-3.5 right-14 z-30 select-none">
      {/* 1. Sleek Floating Quick-Dock Bar */}
      <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-1 shadow-md">
        {/* Dock Item 1: Risk Index */}
        <button
          onClick={() => toggleFlyout('risk')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeFlyout === 'risk'
              ? 'bg-red-50 text-red-700 border border-red-200 shadow-2xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Regional Risk & Hazard Assessment"
        >
          <div className="relative flex items-center justify-center">
            <Shield className={`w-3.5 h-3.5 ${isRiskHigh ? 'text-red-600' : 'text-emerald-600'}`} />
            {isRiskHigh && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </div>
          <span>Risk: <b className={`font-mono ${isRiskHigh ? 'text-red-700' : 'text-emerald-700'}`}>{regionalRiskIndex}</b></span>
        </button>

        {/* Dock Item 2: Supply Reserves */}
        <button
          onClick={() => toggleFlyout('supplies')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeFlyout === 'supplies'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Essential Commodity Reserves"
        >
          <Package className="w-3.5 h-3.5 text-blue-600" />
          <span>Reserves</span>
          {supplyStatus.districtsAtRisk > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-700 text-[10px] font-extrabold">
              {supplyStatus.districtsAtRisk}
            </span>
          )}
        </button>

        {/* Dock Item 3: Active Incidents */}
        <button
          onClick={() => toggleFlyout('incidents')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeFlyout === 'incidents'
              ? 'bg-red-50 text-red-700 border border-red-200 shadow-2xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Active Blockages & Hazards"
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${incidents.length > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          <span>Incidents</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
            incidents.length > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'
          }`}>
            {incidents.length}
          </span>
        </button>

        {/* Dock Item 4: Emergency Broadcast */}
        <button
          onClick={() => toggleFlyout('broadcast')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeFlyout === 'broadcast'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Multilingual Emergency Audio Broadcast"
        >
          <Megaphone className="w-3.5 h-3.5 text-indigo-600" />
          <span>Broadcast</span>
        </button>
      </div>

      {/* 2. Floating Flyout Popover Cards */}
      {activeFlyout && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl p-4 text-xs z-40 animate-fadeIn">
          {/* Flyout 1: Risk Assessment Card */}
          {activeFlyout === 'risk' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Regional Risk Matrix</span>
                </div>
                <button
                  onClick={() => setActiveFlyout(null)}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Threat Index</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className={`font-mono text-2xl font-black ${isRiskHigh ? 'text-red-600' : 'text-emerald-700'}`}>
                      {regionalRiskIndex}
                    </span>
                    <span className="text-slate-400 font-semibold text-xs">/ 100</span>
                  </div>
                </div>

                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                  isRiskHigh ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>
                  {isRiskHigh ? 'HIGH RISK' : 'LOW RISK'}
                </span>
              </div>

              {/* District Connectivity Overview */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  District Accessibility (18 Total)
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="block font-mono text-base font-black text-emerald-700">
                      {districtConnectivity.accessible}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-800 uppercase">Open</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <span className="block font-mono text-base font-black text-amber-700">
                      {districtConnectivity.restricted}
                    </span>
                    <span className="text-[9px] font-bold text-amber-800 uppercase">Restricted</span>
                  </div>
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                    <span className="block font-mono text-base font-black text-red-700">
                      {districtConnectivity.blocked}
                    </span>
                    <span className="text-[9px] font-bold text-red-800 uppercase">Blocked</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Flyout 2: Supply Reserves Card */}
          {activeFlyout === 'supplies' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Essential Commodity Reserves</span>
                </div>
                <button
                  onClick={() => setActiveFlyout(null)}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {/* Food */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-slate-700">Food Supplies</span>
                    <span className="font-mono font-bold text-slate-900">{supplyStatus.food}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${supplyStatus.food}%` }}
                    />
                  </div>
                </div>

                {/* Medicine */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-slate-700">Emergency Medicine</span>
                    <span className="font-mono font-bold text-orange-600">{supplyStatus.medicine}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${supplyStatus.medicine}%` }}
                    />
                  </div>
                </div>

                {/* Infrastructure */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-slate-700">Disaster Recovery Supplies</span>
                    <span className="font-mono font-bold text-slate-900">{supplyStatus.construction}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${supplyStatus.construction}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Flyout 3: Incidents Feed Card */}
          {activeFlyout === 'incidents' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Active Blockages & Alerts ({incidents.length})</span>
                </div>
                <button
                  onClick={() => setActiveFlyout(null)}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {incidents.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <span className="font-bold block">All Corridors Clear</span>
                  <span className="text-[10px]">No active blockages logged</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {incidents.map((inc) => {
                    const isBlocked = inc.roadStatus === 'BLOCKED';
                    return (
                      <div
                        key={inc.id}
                        onClick={() => {
                          setSelectedIncident(inc);
                          setFocusCoordinates(inc.coordinates);
                          setActiveFlyout(null);
                        }}
                        className="p-2.5 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100/70 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-red-900">
                            {inc.type} — {inc.roadName}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-600 text-white">
                            {inc.roadStatus}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-600 flex items-center justify-between mt-1">
                          <span>Logged: {inc.timeLogged}</span>
                          <span className="text-blue-600 font-bold flex items-center gap-0.5">
                            Locate on Map <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Flyout 4: Voice Broadcast Card */}
          {activeFlyout === 'broadcast' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs">
                  <Megaphone className="w-4 h-4 text-indigo-600" />
                  <span>Multilingual Voice Alert</span>
                </div>
                <button
                  onClick={() => setActiveFlyout(null)}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Active Dispatch Advisory
                </span>
                <p className="text-[11px] text-slate-800 font-medium leading-relaxed">
                  {simulationActive
                    ? 'Road blocked ahead on NH-37 (Kaziranga). Alternative bypass route active.'
                    : 'All regional logistics corridors operational. Weather alert standing.'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value as LanguageCode)}
                    className="w-full py-1.5 px-2.5 pr-7 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="as">অসমীয়া (Assamese)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="mni">মৈতৈলোন্ (Manipuri)</option>
                    <option value="bdo">बड़ो (Bodo)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  onClick={() => playMultilingualAlert(selectedLanguage)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  title="Play live audio announcement"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Broadcast</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntelligenceDock;
