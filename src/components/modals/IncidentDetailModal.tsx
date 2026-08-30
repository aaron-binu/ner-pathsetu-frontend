import React from 'react';
import { usePathSetuStore } from '../../store/usePathSetuStore';

export const IncidentDetailModal: React.FC = () => {
  const { incidentDetailModalOpen, closeModals, selectedIncident, openRouteDecision } = usePathSetuStore();
  if (!incidentDetailModalOpen || !selectedIncident) return null;
  const isBlocked = selectedIncident.roadStatus==='BLOCKED';
  return (
    <div className="modal-backdrop" onClick={closeModals}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h2>{selectedIncident.type} — {selectedIncident.roadSegmentId}</h2>
          <button className="x" onClick={closeModals}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            <div style={{flex:1,minWidth:220}}>
              <div className={`status-pill ${isBlocked?'blocked':'restricted'}`} style={{marginBottom:12}}><span className="sdot"></span>{selectedIncident.roadStatus}</div>
              <div className="why-box" style={{marginBottom:12}}>{selectedIncident.notes || 'Field Sentinel report verified.'}</div>
              <div style={{fontSize:12,color:'var(--text-dim)'}}><b>Location:</b> {selectedIncident.roadName}</div>
              <div style={{fontSize:12,color:'var(--text-dim)',marginTop:4}}><b>Reported:</b> {selectedIncident.timeLogged} · {selectedIncident.reportedBy}</div>
              <div style={{fontSize:11,color:'var(--text-faint)',marginTop:8}}>Source: {selectedIncident.source || 'Field Sentinel'}</div>
            </div>
            <div style={{width:160,height:120,borderRadius:12,background:'var(--surface-2)',border:'1px solid var(--border-soft)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'var(--text-faint)'}}>
              Photo
            </div>
          </div>
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn" style={{flex:1}} onClick={closeModals}>View on Map</button>
            <button className="btn btn-primary" style={{flex:1}} onClick={()=>{ closeModals(); openRouteDecision(); }}>Affected Vehicles</button>
          </div>
        </div>
      </div>
    </div>
  );
};
