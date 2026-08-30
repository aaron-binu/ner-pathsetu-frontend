import React from 'react';
import { Header } from './components/layout/Header';
import { MapView } from './components/map/MapView';
import { FieldSentinel } from './components/mobile/FieldSentinel';
import { RouteDecisionModal } from './components/modals/RouteDecisionModal';
import { VehicleDetailModal } from './components/modals/VehicleDetailModal';
import { IncidentDetailModal } from './components/modals/IncidentDetailModal';
import { AlertBroadcastModal } from './components/modals/AlertBroadcastModal';
import { usePathSetuStore } from './store/usePathSetuStore';



const KPIrow: React.FC = () => {
  const { roadStatuses, vehicles, incidents, districtConnectivity, regionalRiskIndex } = usePathSetuStore();
  const blocked = Object.values(roadStatuses).filter(v=>v==='BLOCKED').length;
  const restricted = Object.values(roadStatuses).filter(v=>v==='RESTRICTED').length;
  const highRisk = incidents.filter(i=>i.severity==='CRITICAL').length;
  const critical = vehicles.filter(v=>v.priority==='CRITICAL').length;
  const districtsAtRisk = districtConnectivity.blocked + districtConnectivity.restricted;

  // animate values via stagger handled by CSS
  const kpis = [
    { v: blocked, l:'Blocked Roads', cls:'crit' },
    { v: restricted || highRisk, l:'High-Risk Roads', cls:'warn' },
    { v: vehicles.length, l:'Active Vehicles', cls:'brand' },
    { v: critical, l:'Critical Deliveries', cls:'warn' },
    { v: districtsAtRisk, l:'Districts at Supply Risk', cls:'crit' },
  ];
  return (
    <div className="kpirow stagger">
      {kpis.map(k=>(
        <div key={k.l} className={`kpi ${k.cls}`}>
          <div className="val mono">{k.v}</div>
          <div className="lbl">{k.l}</div>
        </div>
      ))}
    </div>
  );
};

const CriticalLeftPanel: React.FC = () => {
  const { vehicles, roadStatuses, openRouteDecision } = usePathSetuStore();
  const critical = vehicles.filter(v=> v.priority==='CRITICAL' || v.priority==='HIGH');
  const blockedCount = critical.filter(v=> (roadStatuses[v.currentRouteId]||'OPEN')==='BLOCKED').length;
  return (
    <div className="panel" style={{display:'flex',flexDirection:'column',maxHeight:560, overflow:'hidden'}}>
      <div className="panel-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span>Critical Deliveries</span>
        {blockedCount>0 && <span style={{background:'var(--crit-dim)',color:'var(--crit)',fontSize:'10px',padding:'2px 6px',borderRadius:6,fontWeight:700}}>{blockedCount} blocked</span>}
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'8px 10px 12px',display:'flex',flexDirection:'column',gap:10}}>
        {critical.map(v=>{
          const s = roadStatuses[v.currentRouteId] || 'OPEN';
          const statusCls = s==='BLOCKED'?'blocked':s==='RESTRICTED'?'restricted':'open';
          const affected = s==='BLOCKED';
          return (
            <div key={v.id} className={`cargo-card ${affected?'affected':''}`} style={{minWidth:0, width:'100%', padding:'12px 12px'}}>
              <div className="cargo-top">
                <span className={`priority-pill ${v.priority.toLowerCase()}`}>{v.priority}</span>
                <span className={`status-pill ${statusCls}`} style={{padding:'3px 7px',fontSize:'10px'}}><span className="sdot"></span>{s}</span>
              </div>
              <div className="cname" style={{fontSize:'13px'}}>{v.cargo}</div>
              <div className="croute mono" style={{fontSize:'11px',color:'var(--text-dim)'}}>{v.id} · {v.currentRouteId}</div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:'11px',color:'var(--text-faint)'}}>
                <span>ETA <b style={{color:'var(--text)',fontFamily:'IBM Plex Mono'}}>{v.eta}</b></span>
                <span>{v.driver.split(' ')[0]}</span>
              </div>
              <button className="mini-btn" style={{marginTop:8}} onClick={()=>openRouteDecision(v)}>Optimize Route</button>
            </div>
          );
        })}
        {critical.length===0 && <div style={{fontSize:12,color:'var(--text-faint)',textAlign:'center',padding:20}}>No critical deliveries</div>}
      </div>
      <div style={{padding:'8px 12px',borderTop:'1px solid var(--border-soft)',fontSize:'11px',color:'var(--text-faint)',background:'var(--surface-2)',borderRadius:'0 0 var(--radius-lg) var(--radius-lg)'}}>
        {critical.length} priority · {blockedCount} needs reroute
      </div>
    </div>
  );
};

// keep LayerRail for Map tab if needed but hide from dashboard left
const LayerRail: React.FC = () => {
  const { layers, toggleLayer } = usePathSetuStore();
  return (
    <div className="panel layer-rail">
      <div className="panel-title">Map Layers</div>
      <div className="layer-group">
        <div className="layer-group-title">Default</div>
        <label className="layer-chip">
          <input type="checkbox" checked={layers.roadAccessibility} onChange={()=>toggleLayer('roadAccessibility')} data-layer="roadnetwork" />
          <span className="swatch" style={{background:'#A69A8A'}}></span>Road Network<span className="check"></span>
        </label>
        <label className="layer-chip">
          <input type="checkbox" checked={layers.roadAccessibility} onChange={()=>toggleLayer('roadAccessibility')} data-layer="roadstatus" />
          <span className="swatch" style={{background:'#7CA36B'}}></span>Road Status<span className="check"></span>
        </label>
        <label className="layer-chip">
          <input type="checkbox" checked={layers.hazardRisk} onChange={()=>toggleLayer('hazardRisk')} data-layer="risk" />
          <span className="swatch" style={{background:'#C94F49'}}></span>Risk Intensity<span className="check"></span>
        </label>
      </div>
      <div className="layer-group">
        <div className="layer-group-title">Hazard</div>
        <label className="layer-chip">
          <input type="checkbox" checked={layers.waterways} onChange={()=>toggleLayer('waterways')} data-layer="waterways" />
          <span className="swatch" style={{background:'#6C93A8'}}></span>Waterways<span className="check"></span>
        </label>
        <label className="layer-chip">
          <input type="checkbox" checked={layers.hazardRisk} onChange={()=>toggleLayer('hazardRisk')} data-layer="flood" />
          <span className="swatch" style={{background:'#B97A4E'}}></span>Landslide Zones<span className="check"></span>
        </label>
        <label className="layer-chip">
          <input type="checkbox" checked={layers.hazardRisk} onChange={()=>toggleLayer('hazardRisk')} data-layer="ground" />
          <span className="swatch" style={{background:'#B08FB0'}}></span>Ground Movement<span className="check"></span>
        </label>
      </div>
      <div className="layer-group">
        <div className="layer-group-title">Infrastructure</div>
        <label className="layer-chip">
          <input type="checkbox" checked={layers.bridges} onChange={()=>toggleLayer('bridges')} data-layer="bridges" />
          <span className="swatch" style={{background:'#ADA08D'}}></span>Bridges<span className="check"></span>
        </label>
        <label className="layer-chip">
          <input type="checkbox" checked={layers.activeVehicles} onChange={()=>toggleLayer('activeVehicles')} data-layer="vehicles" />
          <span className="swatch" style={{background:'#E2726B'}}></span>Vehicles<span className="check"></span>
        </label>
        <label className="layer-chip">
          <input type="checkbox" checked={layers.incidents} onChange={()=>toggleLayer('incidents')} data-layer="incidents" />
          <span className="swatch" style={{background:'#C94F49'}}></span>Incidents<span className="check"></span>
        </label>
        <label className="layer-chip">
          <input type="checkbox" checked={layers.waterways} onChange={()=>toggleLayer('waterways')} data-layer="ferry" />
          <span className="swatch" style={{background:'#6C93A8'}}></span>Ferry Terminals<span className="check"></span>
        </label>
      </div>
    </div>
  );
};

const Drawer: React.FC = () => {
  const { selectedIncident, selectedVehicle, roadStatuses, regionalRiskIndex, openRouteDecision, setSelectedIncident } = usePathSetuStore();
  const roadId = selectedIncident?.roadSegmentId || selectedVehicle?.currentRouteId || 'NH-37';
  const roadName = selectedIncident?.roadName || 'NH-37 near Kaziranga / Jiribam Corridor';
  const status = (selectedIncident?.roadStatus as string) || roadStatuses[roadId] || 'OPEN';
  const risk = regionalRiskIndex;
  const reason = selectedIncident?.notes || 'Elevated landslide susceptibility on steep cut-slope; moderate rainfall accumulation. Field Sentinel verification pending.';
  const sources = selectedIncident?.source ? [selectedIncident.source] : ['Satellite','Weather Model','Field Report'];

  if (!selectedIncident && !selectedVehicle) {
    return (
      <div className="drawer">
        <div className="drawer-empty">
          <div className="ico">🗺️</div>
          <div style={{fontWeight:600, color:'var(--text-dim)'}}>Select a road on the map</div>
          <div style={{fontSize:'12px', maxWidth:220}}>Click any colored road segment to see status, risk breakdown and recommended actions.</div>
        </div>
      </div>
    );
  }

  const statusCls = status==='BLOCKED'?'blocked':status==='RESTRICTED'?'restricted':'open';
  return (
    <div className="drawer">
      <div className="drawer-head">
        <div className="rname">{roadId}</div>
        <div className="rseg">{roadName}</div>
        <div className={`status-pill ${statusCls}`}><span className="sdot"></span>{status}</div>
      </div>
      <div className="drawer-body">
        <div className="dsection">
          <div className="dsection-lbl">Why</div>
          <div className="why-box">{reason}</div>
        </div>
        <div className="dsection">
          <div className="dsection-lbl">Risk Score</div>
          <div className="risk-score-big">{risk}<span> / 100</span></div>
          <div style={{marginTop:12}}>
            <div className="breakdown-row"><div className="blbl">Landslide Risk</div><div className="breakdown-track"><div className="breakdown-fill" style={{width:'58%', background:'#B97A4E'}}></div></div><div className="bval mono">58%</div></div>
            <div className="breakdown-row"><div className="blbl">Rainfall (mm/24h)</div><div className="breakdown-track"><div className="breakdown-fill" style={{width:'48%', background:'#7CA36B'}}></div></div><div className="bval mono">96</div></div>
            <div className="breakdown-row"><div className="blbl">Terrain Risk</div><div className="breakdown-track"><div className="breakdown-fill" style={{width:'75%', background:'#B08FB0'}}></div></div><div className="bval mono">75%</div></div>
          </div>
        </div>
        <div className="dsection">
          <div className="dsection-lbl">Source</div>
          <div className="source-chips">{sources.map(s=><span key={s} className="source-chip">{s}</span>)}</div>
          <div className="meta-line">Last updated 12 min ago · {selectedIncident?.timeLogged || 'Live'}</div>
        </div>
      </div>
      <div className="drawer-actions">
        <button className="btn btn-primary" onClick={()=>openRouteDecision(selectedVehicle || undefined)}>Find Alternate Route</button>
        <button className="btn" onClick={()=>selectedIncident && setSelectedIncident(selectedIncident)}>View Field Report</button>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const { activeView, activeTab } = usePathSetuStore();

  return (
    <div id="app" className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {activeView === 'field-sentinel' ? (
          <div className="phone-stage">
            <div className="phone-caption">
              <div className="fc-pill">📍 Field Sentinel</div>
              <h3>Report from the ground, in seconds.</h3>
              <p>Field officers confirm what satellites only suspect. A verified report turns a possible risk into a blocked road.</p>
            </div>
            <div className="phone">
              <div className="phone-notch"></div>
              <div className="phone-screen" style={{ ['--field-bg' as any]: '#FDF6EA', ['--field-text' as any]: '#2A211A' }}>
                <FieldSentinel />
              </div>
            </div>
          </div>
        ) : activeTab === 'Map' ? (
          <div className="view">
            <div className="dash-grid" style={{gridTemplateColumns:'224px 1fr'}}>
              <LayerRail />
              <div className="map-wrap" style={{height:'74vh', minHeight:560}}>
                <MapView className="w-full h-full" />
              </div>
            </div>
          </div>
        ) : activeTab === 'Logistics' ? (
          <div className="view">
            <div className="panel" style={{padding:'17px 19px'}}>
              <div className="panel-title" style={{padding:'0 0 12px'}}>Fleet & Cargo Intelligence</div>
              <FleetTable />
            </div>
          </div>
        ) : activeTab === 'Incidents' ? (
          <div className="view">
            <IncidentsView />
          </div>
        ) : activeTab === 'Alerts' ? (
          <div className="view">
            <div className="panel" style={{padding:'17px 19px'}}>
              <div className="panel-title" style={{padding:'0 0 12px'}}>Multilingual Alert Log</div>
              <AlertsView />
            </div>
          </div>
        ) : activeTab === 'Analytics' ? (
          <AnalyticsView />
        ) : (
          // Dashboard default — layers via dropdown inside map, critical deliveries as left rail
          <div className="view" id="view-dashboard">
            <KPIrow />
            <div className="dash-grid">
              <CriticalLeftPanel />
              <div className="map-wrap" style={{height:560}}>
                <MapView className="w-full h-full" />
              </div>
              <Drawer />
            </div>
            <div className="panel" style={{marginTop:14}}>
              <div className="panel-title">District Connectivity — supply & access at a glance</div>
              <DistrictList />
            </div>
          </div>
        )}
      </main>

      <div className="footer-note">NER-PathSetu — prototype interface · mock intelligence data for demonstration · Smart India Hackathon</div>
      <div className="toast-stack" id="toastStack"></div>

      <RouteDecisionModal />
      <VehicleDetailModal />
      <IncidentDetailModal />
      <AlertBroadcastModal />
    </div>
  );
};

const FleetTable: React.FC = () => {
  const { vehicles, roadStatuses, selectedVehicleId, setSelectedVehicle, openRouteDecision } = usePathSetuStore();
  return (
    <table className="logi">
      <thead><tr><th>Vehicle</th><th>Cargo</th><th>Priority</th><th>Route</th><th>Status</th><th>ETA</th><th></th></tr></thead>
      <tbody>
        {vehicles.map(v=>{
          const s = roadStatuses[v.currentRouteId] || 'OPEN';
          const cls = s==='BLOCKED'?'blocked':s==='RESTRICTED'?'restricted':'open';
          const sel = selectedVehicleId===v.id;
          return (
            <tr key={v.id} style={sel?{background:'var(--surface-2)'}:undefined}>
              <td><b className="mono">{v.id}</b></td>
              <td>{v.cargo}</td>
              <td><span className={`priority-pill ${v.priority.toLowerCase()}`}>{v.priority}</span></td>
              <td className="mono" style={{fontSize:'12px'}}>{v.currentRouteId}</td>
              <td><span className={`status-pill ${cls}`} style={{padding:'3px 8px', fontSize:'10px'}}><span className="sdot"></span>{s}</span></td>
              <td className="mono">{v.eta}</td>
              <td>
                <div style={{display:'flex', gap:6}}>
                  <button className="btn" style={{padding:'6px 10px', fontSize:'11px'}} onClick={()=>setSelectedVehicle(v)}>Focus</button>
                  <button className="btn" style={{padding:'6px 10px', fontSize:'11px'}} onClick={()=>openRouteDecision(v)}>Reroute</button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const CargoScroller: React.FC = () => {
  const { vehicles, roadStatuses, openRouteDecision } = usePathSetuStore();
  const critical = vehicles.filter(v=> v.priority==='CRITICAL' || v.priority==='HIGH');
  return (
    <div className="scroller stagger">
      {critical.map(v=>{
        const s = roadStatuses[v.currentRouteId] || 'OPEN';
        const statusCls = s==='BLOCKED'?'blocked':s==='RESTRICTED'?'restricted':'open';
        const affected = s==='BLOCKED';
        return (
          <div key={v.id} className={`cargo-card ${affected?'affected':''}`}>
            <div className="cargo-top">
              <span className={`priority-pill ${v.priority.toLowerCase()}`}>{v.priority}</span>
              <span className={`status-pill ${statusCls}`} style={{padding:'3px 8px', fontSize:'10px'}}><span className="sdot"></span>{s}</span>
            </div>
            <div className="cname">{v.cargo}</div>
            <div className="croute mono" style={{fontSize:'11.5px'}}>{v.id} · {v.currentRouteId}</div>
            <div className="crow"><span>ETA</span><b>{v.eta}</b></div>
            <button className="mini-btn" onClick={()=>openRouteDecision(v)}>Optimize Route</button>
          </div>
        );
      })}
    </div>
  );
};

const DistrictList: React.FC = () => {
  const { districtConnectivity, supplyStatus } = usePathSetuStore();
  const districts = [
    { name:'East Sikkim', status: districtConnectivity.blocked>0?'risk':'ok', note: districtConnectivity.blocked?'Supply gap — NH-10 disrupted':'Fully connected' },
    { name:'Kamrup (M), Assam', status:'ok', note:'Fully connected' },
    { name:'East Khasi Hills, Meghalaya', status:'ok', note:'Fully connected' },
    { name:`Kolasib, Mizoram · ${supplyStatus.medicine}% meds`, status: supplyStatus.medicine<50?'risk':'ok', note: supplyStatus.medicine<50?'Medicine low':'Fully connected' },
  ];
  return (
    <div className="district-list stagger">
      {districts.map(d=>(
        <div key={d.name} className="district-row">
          <div className="dname">{d.name}</div>
          <div style={{fontSize:'11.5px', color:'var(--text-faint)', flex:1}}>{d.note}</div>
          <div className={`dstat ${d.status}`}>{d.status==='ok'?'Connected':'At Risk'}</div>
        </div>
      ))}
    </div>
  );
};

const IncidentsView: React.FC = () => {
  const { incidents, setSelectedIncident, setFocusCoordinates, openIncidentDetail } = usePathSetuStore();
  const [filter, setFilter] = React.useState<'all'|'critical'|'medium'>('all');
  const [q, setQ] = React.useState('');
  const filtered = incidents.filter(i=> {
    const f = filter==='all' ? true : filter==='critical' ? i.severity==='CRITICAL' : i.severity!=='CRITICAL';
    const s = !q || `${i.type} ${i.roadName} ${i.roadSegmentId} ${i.reportedBy}`.toLowerCase().includes(q.toLowerCase());
    return f && s;
  });
  const verified = incidents.filter(i=>i.syncStatus==='SYNCED').length;
  const pending = incidents.length - verified;
  return (
    <div className="panel" style={{overflow:'hidden'}}>
      <div style={{padding:'18px 18px 14px', borderBottom:'1px solid var(--border-soft)', background:'var(--surface)'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',alignItems:'flex-start'}}>
          <div>
            <div style={{fontFamily:'Space Grotesk',fontSize:18,fontWeight:700,lineHeight:1}}>Field Reports</div>
            <div style={{fontSize:12.5,color:'var(--text-dim)',marginTop:4}}>{incidents.length} reports · {verified} verified · {pending} pending verification · Ground truth from Field Sentinel</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{position:'relative'}}>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search road, type, reporter…" style={{width:220,padding:'8px 32px 8px 10px',borderRadius:10,border:'1px solid var(--border)',background:'var(--surface)',fontSize:12.5,outline:'none'}} />
              <span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',fontSize:12, color:'var(--text-faint)'}}>⌕</span>
            </div>
            <span style={{fontSize:11, color:'var(--text-faint)', whiteSpace:'nowrap'}}>{filtered.length} shown</span>
          </div>
        </div>
        <div className="filter-row" style={{marginTop:14,marginBottom:0}}>
          {(['all','critical','medium'] as const).map(t=>(
            <button key={t} className={`filter-chip ${filter===t?'active':''}`} onClick={()=>setFilter(t)}>
              {t==='all'?'All': t==='critical'?'Critical':'Medium'} {t==='all'?`· ${incidents.length}`: t==='critical'?`· ${incidents.filter(i=>i.severity==='CRITICAL').length}`:`· ${incidents.filter(i=>i.severity!=='CRITICAL').length}`}
            </button>
          ))}
        </div>
      </div>
      <div className="card-list" style={{padding:'12px 12px 16px', display:'flex', flexDirection:'column', gap:10, background:'var(--ink)'}}>
        {filtered.length===0 ? (
          <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-faint)',fontSize:13,background:'var(--surface)',border:'1px solid var(--border-soft)',borderRadius:14}}>
            No reports match filter. Try clearing search.
          </div>
        ) : filtered.map(i=>(
          <div key={i.id} className="inc-card" onClick={()=>{ setSelectedIncident(i); setFocusCoordinates(i.coordinates); openIncidentDetail(i); }} style={{cursor:'pointer', background:'var(--surface)', borderLeft:`4px solid ${i.severity==='CRITICAL'?'var(--crit)':'var(--warn)'}`, alignItems:'flex-start', borderRadius:14, paddingLeft:22}}>
            <div className={`inc-ico ${i.severity==='CRITICAL'?'crit':'warn'}`} style={{marginTop:2, flexShrink:0}}>{i.type==='Landslide'?'⛰️': i.type==='Flood'?'🌊': i.type.includes('Bridge')?'🌉':'🛣️'}</div>
            <div className="inc-body" style={{minWidth:0, flex:1}}>
              <div style={{display:'flex', justifyContent:'space-between', gap:12, alignItems:'flex-start'}}>
                <div style={{flex:1, minWidth:0}}>
                  <div className="inc-title" style={{fontWeight:700, fontSize:14, lineHeight:1.3, color:'var(--text)'}}>{i.type} — {i.roadName}</div>
                  <div style={{fontSize:12, color:'var(--text-dim)', marginTop:3, lineHeight:1.4}}>
                    Reported by {i.reportedBy}
                  </div>
                  <div className="mono" style={{fontSize:11, color:'var(--text-faint)', marginTop:2}}>
                    {i.roadSegmentId} · {i.coordinates[1].toFixed(2)}, {i.coordinates[0].toFixed(2)}
                  </div>
                </div>
                <div className="mono" style={{whiteSpace:'nowrap', fontSize:11, fontWeight:600, color:'var(--text-faint)', background:'var(--surface-2)', padding:'5px 9px', borderRadius:9, border:'1px solid var(--border-soft)', flexShrink:0}}>{i.timeLogged}</div>
              </div>
              <div style={{marginTop:10, display:'flex', gap:7, flexWrap:'wrap', alignItems:'center'}}>
                <span style={{fontSize:11.5, fontWeight:700, color: i.syncStatus==='SYNCED'?'var(--open)':'var(--text-faint)', display:'inline-flex', alignItems:'center', gap:4}}>
                  {i.syncStatus==='SYNCED'?'✓ Verified':'○ Pending'}
                </span>
                <span className="tag" style={{background: i.severity==='CRITICAL'?'var(--crit-dim)':'var(--warn-dim)', color: i.severity==='CRITICAL'?'var(--crit)':'var(--warn)', borderColor:'transparent', fontWeight:800, padding:'3px 8px'}}>{i.severity}</span>
                <span className="tag" style={{background: i.roadStatus==='BLOCKED'?'var(--crit-dim)': i.roadStatus==='RESTRICTED'?'var(--warn-dim)':'var(--open-dim)', color: i.roadStatus==='BLOCKED'?'var(--crit)': i.roadStatus==='RESTRICTED'?'var(--warn)':'var(--open)', borderColor:'transparent', fontWeight:800, padding:'3px 8px'}}>{i.roadStatus}</span>
                <span style={{marginLeft:'auto', fontSize:12, fontWeight:600, color:'var(--text-dim)', display:'inline-flex', alignItems:'center', gap:4, cursor:'pointer'}}>View <span style={{fontSize:13}}>→</span></span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{padding:'10px 14px', borderTop:'1px solid var(--border-soft)', background:'var(--surface-2)', display:'flex', justifyContent:'space-between', fontSize:11.5, color:'var(--text-faint)'}}>
        <span>Tap a report to view on map & see field evidence</span>
        <span className="mono">{filtered.length}/{incidents.length}</span>
      </div>
    </div>
  );
};

const AlertsView: React.FC = () => {
  const alerts = [
    { lang:'Assamese', msg:'NH-10 অগম্য। বিকল্প পথ পোৱা গৈছে।', recipient:'Truck #17 · Medicine', time:'—' },
    { lang:'English', msg:'NH-6 is blocked due to flooding. Reroute applied.', recipient:'Truck #09 · Fuel', time:'2 hr ago' },
    { lang:'Mizo', msg:'NH-6 kalh a buai — kawng dang hmang rawh.', recipient:'Truck #09 · Fuel', time:'2 hr ago' },
  ];
  return (
    <div className="card-list">
      {alerts.map(a=>(
        <div key={a.lang+a.msg} className="inc-card">
          <div className="inc-ico warn">🔊</div>
          <div className="inc-body">
            <div className="inc-top"><div className="inc-title">{a.lang} · {a.recipient}</div><div className="inc-time">{a.time}</div></div>
            <div className="inc-meta">{a.msg}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const AnalyticsView: React.FC = () => {
  const { roadStatuses, vehicles, incidents } = usePathSetuStore();
  const blocked = Object.values(roadStatuses).filter(v=>v==='BLOCKED').length;
  const high = incidents.filter(i=>i.severity==='CRITICAL').length;
  const tiles = [
    { n:blocked, l:'Blocked Roads' },
    { n:high, l:'High-Risk Roads' },
    { n:vehicles.length, l:'Active Vehicles' },
    { n:vehicles.filter(v=>v.priority==='CRITICAL').length, l:'Critical Deliveries' },
    { n:incidents.length, l:'Field Reports Today' },
    { n:'6 min', l:'Avg Verification Time' },
    { n:'94%', l:'Fleet On-Schedule Rate' },
    { n:blocked>0? 'Active':'Normal', l:'System Status' },
  ];
  return (
    <div className="view">
      <div className="warroom-tiles stagger">
        {tiles.map(t=>(
          <div key={t.l} className="wtile"><div className="n mono">{t.n}</div><div className="l">{t.l}</div></div>
        ))}
      </div>
      <div className="bottom-grid">
        <div className="panel">
          <div className="panel-title">Supply Gap by District</div>
          <div style={{padding:'14px 18px 18px'}}>
            <div className="supply-bar-row"><div className="sname">East Sikkim</div><div className="supply-track"><div className="supply-fill" style={{width:'64%'}}></div></div><div className="spct">64%</div></div>
            <div className="supply-bar-row"><div className="sname">Ukhrul, Manipur</div><div className="supply-track"><div className="supply-fill" style={{width:'31%', background:'linear-gradient(90deg,#D9A23A,#F3CC7E)'}}></div></div><div className="spct" style={{color:'var(--warn)'}}>31%</div></div>
            <div className="supply-bar-row"><div className="sname">Kolasib, Mizoram</div><div className="supply-track"><div className="supply-fill" style={{width:'18%', background:'linear-gradient(90deg,#D9A23A,#F3CC7E)'}}></div></div><div className="spct" style={{color:'var(--warn)'}}>18%</div></div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">District Connectivity</div>
          <DistrictList />
        </div>
      </div>
    </div>
  );
};

export default App;
