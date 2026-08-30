import React from 'react';
import { usePathSetuStore } from '../../store/usePathSetuStore';

export const VehicleDetailModal: React.FC = () => {
  const { vehicleDetailModalOpen, closeModals, selectedVehicle, openRouteDecision } = usePathSetuStore();
  if (!vehicleDetailModalOpen || !selectedVehicle) return null;
  return (
    <div className="modal-backdrop" onClick={closeModals}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:560}}>
        <div className="modal-head">
          <h2>{selectedVehicle.id} — {selectedVehicle.cargo}</h2>
          <button className="x" onClick={closeModals}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div>
              <div className="mono" style={{fontSize:18,fontWeight:700}}>{selectedVehicle.id}</div>
              <div style={{fontSize:13,color:'var(--text-dim)'}}>{selectedVehicle.cargo} · {selectedVehicle.driver}</div>
            </div>
            <span className={`priority-pill ${selectedVehicle.priority.toLowerCase()}`}>{selectedVehicle.priority}</span>
          </div>
          <div className="panel" style={{padding:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><div style={{fontSize:10,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'.5px',fontWeight:700}}>Driver</div><div style={{fontWeight:600,marginTop:4}}>{selectedVehicle.driver}</div></div>
            <div><div style={{fontSize:10,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'.5px',fontWeight:700}}>ETA</div><div className="mono" style={{fontWeight:600,marginTop:4}}>{selectedVehicle.eta}</div></div>
            <div style={{gridColumn:'1 / -1',borderTop:'1px solid var(--border-soft)',paddingTop:12}}>
              <div style={{fontSize:10,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'.5px',fontWeight:700}}>Destination</div>
              <div style={{fontWeight:600,marginTop:4}}>{selectedVehicle.destination}</div>
              <div style={{fontSize:12,color:'var(--text-dim)',marginTop:6}}>{selectedVehicle.currentLocationName} · {selectedVehicle.currentRouteId} · {selectedVehicle.speedKmh||48} km/h</div>
            </div>
          </div>
          <div style={{display:'flex',gap:10,marginTop:16}}>
            <button className="btn" style={{flex:1}} onClick={closeModals}>View Route</button>
            <button className="btn btn-primary" style={{flex:1}} onClick={()=>{ closeModals(); openRouteDecision(selectedVehicle); }}>Find Alternate Route</button>
          </div>
        </div>
      </div>
    </div>
  );
};
