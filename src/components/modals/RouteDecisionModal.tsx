import React from 'react';
import { usePathSetuStore } from '../../store/usePathSetuStore';

export const RouteDecisionModal: React.FC = () => {
  const { routeDecisionModalOpen, closeModals, selectedVehicle, acceptReroute } = usePathSetuStore();
  if (!routeDecisionModalOpen || !selectedVehicle) return null;
  return (
    <div className="modal-backdrop" onClick={closeModals}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h2>Route Optimization · {selectedVehicle.id} ({selectedVehicle.cargo})</h2>
          <button className="x" onClick={closeModals}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-note">{selectedVehicle.id} carrying {selectedVehicle.cargo} is affected by a blocked segment. PathSetu evaluated feasible alternatives below.</div>
          <div className="route-compare">
            <div className="route-card">
              <div className="rc-top"><span className="rc-badge orig">Original Route</span><span className="status-pill blocked"><span className="sdot"></span>BLOCKED</span></div>
              <div style={{fontSize:'12.5px',color:'var(--text-dim)'}}>via NH-37, Rangpo – Singtam</div>
              <div className="rc-metrics">
                <div className="rc-metric"><div className="n mono">210 km</div><div className="l">Distance</div></div>
                <div className="rc-metric"><div className="n mono">6h 20m</div><div className="l">Duration</div></div>
                <div className="rc-metric"><div className="n mono" style={{color:'var(--crit)'}}>HIGH</div><div className="l">Risk</div></div>
              </div>
              <div className="route-line-mini"><div className="fill" style={{background:'#A69A8A'}}></div><div className="dotend" style={{left:0,background:'#A69A8A'}}></div><div className="dotend" style={{left:'86%',background:'var(--crit)'}}></div></div>
            </div>
            <div className="route-card rec">
              <div className="rc-top"><span className="rc-badge rec-badge">Recommended</span><span className="status-pill open"><span className="sdot"></span>SAFE</span></div>
              <div style={{fontSize:'12.5px',color:'var(--text-dim)'}}>via NH-10 diversion → Guwahati ferry crossing → NH-27</div>
              <div className="rc-metrics">
                <div className="rc-metric"><div className="n mono">228 km</div><div className="l">Distance</div></div>
                <div className="rc-metric"><div className="n mono">7h 05m</div><div className="l">Duration</div></div>
                <div className="rc-metric"><div className="n mono" style={{color:'var(--open)'}}>LOW</div><div className="l">Risk</div></div>
              </div>
              <div className="route-line-mini"><div className="fill" style={{background:'var(--route)'}}></div><div className="dotend" style={{left:0,background:'var(--route)'}}></div><div className="dotend" style={{left:'86%',background:'var(--route)'}}></div></div>
              <div className="mode-strip">
                <div className="mode-icon">🚚</div><span className="mode-arrow">→</span><div className="mode-icon">⛴️</div><span className="mode-arrow">→</span><div className="mode-icon">🚚</div>
                <span style={{fontSize:'11.5px',color:'var(--text-dim)',marginLeft:6}}>Multimodal · Road → Ferry → Road</span>
              </div>
            </div>
          </div>
          <div className="bridge-warn">
            <div style={{fontSize:16}}>⚠️</div>
            <div><b>Candidate rejected — bridge capacity</b><br/>Vehicle weight <b>15 tonnes</b> exceeds Rongli Bridge's <b>10 tonne restriction</b>. This route is not feasible.</div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button className="btn" onClick={closeModals}>Cancel</button>
            <button className="btn btn-primary" style={{flex:1}} onClick={()=>acceptReroute(selectedVehicle.id)}>Start Route</button>
          </div>
        </div>
      </div>
    </div>
  );
};
