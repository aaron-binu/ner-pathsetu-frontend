import React from 'react';
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
  Activity
} from 'lucide-react';
import { usePathSetuStore } from '../../store/usePathSetuStore';
import { LanguageCode } from '../../types';
import { playMultilingualAlert } from '../../utils/audio';

export const IntelSidebar: React.FC = () => {
  const {
    regionalRiskIndex,
    supplyStatus,
    districtConnectivity,
    incidents,
    setSelectedIncident,
    setFocusCoordinates,
    openIncidentDetail,
    selectedLanguage,
    setSelectedLanguage
  } = usePathSetuStore();

  const isRiskHigh = regionalRiskIndex >= 70;

  return (
    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 select-none z-20 overflow-y-auto">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
          Regional Intelligence
        </h2>
        <span className="text-[10px] font-bold text-slate-400">NER Operations</span>
      </div>

      <div className="p-3.5 space-y-4">
        {/* Section 1: Regional Risk */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Regional Risk
            </span>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-red-600">
              <TrendingUp className="w-3 h-3" />
              <span>Increasing trend</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-black text-red-600 leading-none">
                {regionalRiskIndex}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ 100</span>
            </div>

            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
              HIGH RISK
            </span>
          </div>
        </div>

        {/* Section Divider */}
        <div className="border-t border-slate-100" />

        {/* Section 2: Supply Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Supply Status
            </span>
            {supplyStatus.districtsAtRisk > 0 && (
              <span className="text-[10px] font-bold text-orange-600 flex items-center gap-0.5">
                <span>▲</span> {supplyStatus.districtsAtRisk} Districts at Risk
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs font-medium text-slate-700">
            {/* Food */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-600">Food</span>
                <span className="font-bold text-slate-800">{supplyStatus.food}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${supplyStatus.food}%` }}
                />
              </div>
            </div>

            {/* Medicine */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-600">Medicine</span>
                <span className="font-bold text-orange-600">{supplyStatus.medicine}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${supplyStatus.medicine}%` }}
                />
              </div>
            </div>

            {/* Construction */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-600">Construction</span>
                <span className="font-bold text-slate-800">{supplyStatus.construction}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${supplyStatus.construction}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Divider */}
        <div className="border-t border-slate-100" />

        {/* Section 3: District Connectivity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              District Connectivity
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">Total: 18</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200/80">
              <span className="font-mono text-lg font-black text-emerald-600 block leading-tight">
                {districtConnectivity.accessible}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Accessible
              </span>
            </div>

            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200/80">
              <span className="font-mono text-lg font-black text-amber-600 block leading-tight">
                {districtConnectivity.restricted}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Restricted
              </span>
            </div>

            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200/80">
              <span className="font-mono text-lg font-black text-red-600 block leading-tight">
                {districtConnectivity.blocked}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Blocked
              </span>
            </div>
          </div>
        </div>

        {/* Section Divider */}
        <div className="border-t border-slate-100" />

        {/* Section 4: Active Incidents */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Active Incidents ({incidents.length})
            </span>
            <button className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
              <span>View all</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            {incidents.map((inc) => {
              const isBlocked = inc.roadStatus === 'BLOCKED';

              return (
                <div
                  key={inc.id}
                  onClick={() => {
                    setSelectedIncident(inc);
                    setFocusCoordinates(inc.coordinates);
                    openIncidentDetail(inc);
                  }}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${isBlocked ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                      {isBlocked ? <Waves className="w-3.5 h-3.5" /> : <Hammer className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="font-mono text-xs font-bold text-slate-900 leading-tight">
                        {inc.type} — {inc.roadSegmentId}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 font-medium">
                        {inc.timeLogged}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      isBlocked
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {inc.roadStatus}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section Divider */}
        <div className="border-t border-slate-100" />

        {/* Section 5: Compact Broadcast Alert Layer */}
        <div className="p-2.5 rounded-lg border border-red-200 bg-red-50/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-red-700 uppercase tracking-wide">
              <Megaphone className="w-3.5 h-3.5 text-red-600" />
              <span>ROAD BLOCKED AHEAD</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          </div>

          <p className="text-[11px] text-slate-600 font-medium leading-snug">
            Landslide reported on NH-37 near Jiribam. Use alternative route.
          </p>

          <div className="flex items-center gap-1.5 pt-1">
            <div className="relative flex-1">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as LanguageCode)}
                className="w-full pl-2 pr-6 py-1 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-800 focus:outline-none cursor-pointer appearance-none shadow-xs"
              >
                <option value="en">English</option>
                <option value="as">Assamese (অসমীয়া)</option>
                <option value="mni">Manipuri (মৈতৈলোন্)</option>
                <option value="lus">Mizo</option>
                <option value="kha">Khasi</option>
                <option value="brx">Bodo</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <button
              onClick={() => playMultilingualAlert(selectedLanguage)}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-xs flex items-center justify-center"
              title="Play Voice Advisory"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

