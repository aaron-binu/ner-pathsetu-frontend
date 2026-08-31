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
    <div className="modal-backdrop" onClick={closeModals}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:720}}>
        <div className="modal-head">
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:32, height:32, borderRadius:9, background:'var(--crit)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff'}}>
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <h2 style={{display:'flex', alignItems:'center', gap:8, fontSize:14}}>Route Decision Panel <span className="mono" style={{fontSize:10, padding:'2px 7px', borderRadius:7, background:'var(--crit-dim)', color:'var(--crit)', border:'1px solid rgba(201,79,73,.2)', fontWeight:800}}>{selectedVehicle.id}</span></h2>
              <div style={{fontSize:11, color:'var(--text-dim)', marginTop:2}}>{selectedVehicle.cargo} · <span className={`priority-pill ${selectedVehicle.priority.toLowerCase()}`} style={{padding:'2px 6px', fontSize:9, verticalAlign:'middle'}}>{selectedVehicle.priority}</span></div>
            </div>
          </div>
          <button className="x" onClick={closeModals}>✕</button>
        </div>

        <div className="modal-body">
          <div style={{display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap', padding:'11px 13px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border-soft)', marginBottom:14}}>
            <div>
              <div style={{fontSize:10, fontWeight:800, letterSpacing:.5, textTransform:'uppercase', color:'var(--text-faint)'}}>Target Destination (Unchanged)</div>
              <div style={{fontWeight:700, fontSize:13, marginTop:4, display:'flex', alignItems:'center', gap:6}}>
                <MapPin className="w-4 h-4" style={{color:'var(--crit)'}} />
                {selectedVehicle.destination}
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:10, fontWeight:800, letterSpacing:.5, textTransform:'uppercase', color:'var(--text-faint)'}}>Disruption Reason</div>
              <div style={{fontWeight:800, color:'var(--crit)', fontSize:12, marginTop:4, display:'inline-flex', alignItems:'center', gap:6}}>
                <AlertTriangle className="w-3.5 h-3.5" /> Landslide on NH-37
              </div>
            </div>
          </div>

          <div className="route-compare">
            <div className="route-card" style={{borderColor:'rgba(201,79,73,.35)', background:'var(--crit-dim)'}}>
              <div className="rc-top">
                <span className="rc-badge orig" style={{background:'var(--crit)', color:'#fff'}}>Primary · NH-37</span>
                <span className="status-pill blocked" style={{padding:'3px 8px', fontSize:10}}><span className="sdot"></span>BLOCKED</span>
              </div>
              <div style={{fontWeight:700, fontSize:13}}>Via Kaziranga Corridor</div>
              <div style={{fontSize:11, color:'var(--text-dim)', marginTop:2}}>Guwahati → Nagaon → Kaziranga</div>
              <div className="route-line-mini"><div className="fill" style={{background:'var(--crit)', width:'88%'}}></div><div className="dotend" style={{left:'88%', background:'var(--crit)', border:'2px solid #fff'}}></div></div>
              <div style={{display:'flex', flexDirection:'column', gap:5, fontSize:11, borderTop:'1px solid var(--border-soft)', paddingTop:10, marginTop:8}}>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'var(--text-faint)'}}>Status</span><b style={{color:'var(--crit)'}}>Impassable (Km 142)</b></div>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'var(--text-faint)'}}>Delay</span><b className="mono" style={{color:'var(--crit)'}}>+4 to 6 Hours</b></div>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'var(--text-faint)'}}>Risk</span><b style={{color:'var(--crit)'}}>Critical (84/100)</b></div>
              </div>
            </div>

            <div className="route-card rec">
              <div className="rc-top">
                <span className="rc-badge rec-badge">Detour · ALT-ROUTE-B</span>
                <span style={{display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:800, padding:'3px 7px', borderRadius:7, background:'var(--open-dim)', color:'var(--open)', border:'1px solid rgba(124,163,107,.2)'}}><ShieldCheck className="w-3 h-3" /> RECOMMENDED</span>
              </div>
              <div style={{fontWeight:700, fontSize:13}}>Via Golaghat Southern Bypass</div>
              <div style={{fontSize:11, color:'var(--text-dim)', marginTop:2}}>Nagaon → Hojai → Golaghat → Jorhat</div>
              <div className="route-line-mini"><div className="fill" style={{background:'var(--open)', width:'72%'}}></div><div className="dotend" style={{left:'72%', background:'var(--open)', border:'2px solid #fff'}}></div></div>
              <div style={{display:'flex', flexDirection:'column', gap:5, fontSize:11, borderTop:'1px solid var(--border-soft)', paddingTop:10, marginTop:8}}>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'var(--text-faint)'}}>ETA</span><b className="mono" style={{color:'var(--open)'}}>5h 50m (+45 min)</b></div>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'var(--text-faint)'}}>Road</span><b style={{color:'var(--open)'}}>Paved / Operational</b></div>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'var(--text-faint)'}}>Risk</span><b style={{color:'var(--open)'}}>Low (24/100)</b></div>
              </div>
            </div>
          </div>

          <div style={{display:'flex', gap:10, alignItems:'center', padding:'11px 13px', borderRadius:11, background:'var(--route-dim)', border:'1px solid rgba(108,147,168,.25)', fontSize:12, color:'var(--text)', marginTop:4}}>
            <Navigation className="w-4 h-4" style={{color:'var(--route)', flexShrink:0}} />
            <span>Convoy diverts at <b>Nagaon Junction</b>, bypassing Kaziranga via Golaghat to <b>Jorhat Central Hospital</b> — same destination, new corridor.</span>
          </div>
        </div>

        <div style={{display:'flex', justifyContent:'space-between', gap:10, padding:'14px 18px', borderTop:'1px solid var(--border-soft)', background:'var(--surface-2)', borderRadius:'0 0 20px 20px'}}>
          <button className="btn" style={{padding:'9px 14px', fontSize:12, fontWeight:700}} onClick={closeModals}>Review on Map</button>
          <button className="btn btn-primary" style={{padding:'9px 16px', fontSize:12, fontWeight:800, gap:6}} onClick={()=>acceptReroute(selectedVehicle.id)}>
            <Check className="w-4 h-4" /> Accept Reroute · Golaghat Bypass
          </button>
        </div>
      </div>
    </div>
  );
};
