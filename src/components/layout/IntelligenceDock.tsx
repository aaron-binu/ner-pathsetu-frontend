import React from 'react';
import { usePathSetuStore } from '../../store/usePathSetuStore';

export const IntelligenceDock: React.FC = () => {
  const { simulationActive, regionalRiskIndex, incidents, vehicles } = usePathSetuStore();
  if (!simulationActive) return null;
  const blocked = incidents.filter(i=>i.roadStatus==='BLOCKED').length;
  return (
    <div className="absolute bottom-14 left-3.5 z-20 hidden md:flex items-center gap-2 bg-white border border-[#E8D9BC] rounded-sm px-3 py-2" style={{backdropFilter:'blur(10px)', background:'rgba(255,255,255,.92)', boxShadow:'0 4px 12px rgba(42,33,26,.08)'}}>
      <span className="w-2 h-2 rounded-full bg-[var(--crit)] animate-pulse" />
      <span className="text-[11px] font-bold tracking-wide text-[var(--crit)]">INTEL</span>
      <span className="text-[11px] text-[var(--text-dim)]">Risk {regionalRiskIndex} · {blocked} blocked · {vehicles.filter(v=>v.routeAtRisk).length} at risk</span>
    </div>
  );
};
