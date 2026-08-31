import React, { Suspense } from 'react';
import { Header } from './components/layout/Header';
import { FieldSentinel } from './components/mobile/FieldSentinel';
import { RouteDecisionModal } from './components/modals/RouteDecisionModal';
import { VehicleDetailModal } from './components/modals/VehicleDetailModal';
import { IncidentDetailModal } from './components/modals/IncidentDetailModal';
import { AlertBroadcastModal } from './components/modals/AlertBroadcastModal';
import { usePathSetuStore } from './store/usePathSetuStore';
import { playMultilingualAlert } from './utils/audio';
import { ErrorBoundary } from './components/ErrorBoundary';
import initialDeliveries from './data/deliveries.json';
import districtsGeoJSON from './data/districts.geojson';

const MapView = React.lazy(() => import('./components/map/MapView').then(m => ({ default: m.MapView })));



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
  const { vehicles, roadStatuses, openRouteDecision, setSelectedVehicle } = usePathSetuStore();
  const [tab, setTab] = React.useState<'fleet'|'districts'>('fleet');
  const critical = vehicles.filter(v=> v.priority==='CRITICAL' || v.priority==='HIGH');
  const blockedCount = critical.filter(v=> (roadStatuses[v.currentRouteId]||'OPEN')==='BLOCKED').length;

  return (
    <div className="panel" style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <div style={{padding:'6px 8px 4px', borderBottom:'1px solid var(--border-soft)', display:'flex', gap:4, background:'var(--surface)', flexShrink:0}}>
        <button 
          onClick={()=>setTab('fleet')}
          style={{
            flex:1, padding:'4px 6px', borderRadius:7, border:'none',
            background: tab==='fleet' ? 'var(--surface-3)' : 'transparent',
            color: tab==='fleet' ? 'var(--text)' : 'var(--text-dim)',
            fontWeight: tab==='fleet' ? 700 : 500,
            fontSize:'11px', cursor:'pointer', transition:'.18s var(--ease-soft)'
          }}
        >
          🚚 Deliveries ({critical.length})
        </button>
        <button 
          onClick={()=>setTab('districts')}
          style={{
            flex:1, padding:'4px 6px', borderRadius:7, border:'none',
            background: tab==='districts' ? 'var(--surface-3)' : 'transparent',
            color: tab==='districts' ? 'var(--text)' : 'var(--text-dim)',
            fontWeight: tab==='districts' ? 700 : 500,
            fontSize:'11px', cursor:'pointer', transition:'.18s var(--ease-soft)'
          }}
        >
          📍 Districts (4)
        </button>
      </div>

      {tab==='fleet' ? (
        <div style={{flex:1,overflowY:'auto',padding:'6px 8px 8px',display:'flex',flexDirection:'column',gap:7}}>
          {critical.map(v=>{
            const s = roadStatuses[v.currentRouteId] || 'OPEN';
            const statusCls = s==='BLOCKED'?'blocked':s==='RESTRICTED'?'restricted':'open';
            const affected = s==='BLOCKED';
            return (
              <div 
                key={v.id} 
                className={`cargo-card ${affected?'affected':''}`} 
                style={{minWidth:0, width:'100%', padding:'8px 10px', cursor:'pointer'}}
                onClick={()=>setSelectedVehicle(v)}
              >
                <div className="cargo-top" style={{marginBottom:3}}>
                  <span className={`priority-pill ${v.priority.toLowerCase()}`}>{v.priority}</span>
                  <span className={`status-pill ${statusCls}`} style={{padding:'2px 5px',fontSize:'9px',margin:0}}><span className="sdot"></span>{s}</span>
                </div>
                <div className="cname" style={{fontSize:'12px', fontWeight:700}}>{v.cargo}</div>
                <div className="croute mono" style={{fontSize:'10px',color:'var(--text-dim)'}}>{v.id} · {v.currentRouteId}</div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:4,fontSize:'10px',color:'var(--text-faint)'}}>
                  <span>ETA <b style={{color:'var(--text)',fontFamily:'IBM Plex Mono'}}>{v.eta}</b></span>
                  <span>{v.driver.split(' ')[0]}</span>
                </div>
                <button className="mini-btn" style={{marginTop:5, padding:'4px 6px', fontSize:'10px'}} onClick={(e)=>{ e.stopPropagation(); openRouteDecision(v); }}>Optimize Route</button>
              </div>
            );
          })}
          {critical.length===0 && <div style={{fontSize:11.5,color:'var(--text-faint)',textAlign:'center',padding:16}}>No critical deliveries</div>}
          
          <div style={{marginTop:'auto', padding:'6px 8px', background:'var(--surface-2)', border:'1px solid var(--border-soft)', borderRadius:8, fontSize:10}}>
            <div style={{display:'flex', justifyContent:'space-between', color:'var(--text-dim)', fontWeight:600}}>
              <span>Fleet Telemetry</span>
              <span style={{color:'var(--open)', display:'inline-flex', alignItems:'center', gap:3}}>● Live</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', color:'var(--text-faint)', marginTop:2, fontSize:9.5}}>
              <span>Active GPS: {vehicles.length} units</span>
              <span>Updated: 2s ago</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{flex:1,overflowY:'auto',padding:'4px 8px 8px'}}>
          <DistrictList />
        </div>
      )}

      <div style={{padding:'5px 10px',borderTop:'1px solid var(--border-soft)',fontSize:'10px',color:'var(--text-faint)',background:'var(--surface-2)',borderRadius:'0 0 var(--radius-lg) var(--radius-lg)', flexShrink:0}}>
        {tab==='fleet' ? `${critical.length} priority · ${blockedCount} needs reroute` : '4 regional corridors tracked'}
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
  const { selectedIncident, selectedVehicle, roadStatuses, regionalRiskIndex, openRouteDecision, openIncidentDetail, incidents } = usePathSetuStore();
  const roadId = selectedIncident?.roadSegmentId || selectedVehicle?.currentRouteId || 'NH-37';
  const roadName = selectedIncident?.roadName || 'NH-37 near Kaziranga / Jiribam Corridor';
  const status = (selectedIncident?.roadStatus as string) || roadStatuses[roadId] || 'OPEN';
  const risk = regionalRiskIndex;
  const reason = selectedIncident?.notes || 'Elevated landslide susceptibility on steep cut-slope; moderate rainfall accumulation. Field Sentinel verification pending.';
  const sources = selectedIncident?.source ? [selectedIncident.source] : ['Satellite','Weather Model','Field Report'];

  const handleViewFieldReport = () => {
    if (selectedIncident) {
      openIncidentDetail(selectedIncident);
    } else {
      const matched = incidents.find(i => i.roadSegmentId === roadId) || {
        id: 'INC-2026-081',
        type: 'Landslide',
        severity: 'CRITICAL',
        roadSegmentId: roadId,
        roadName: roadName,
        roadStatus: (status as any) || 'BLOCKED',
        coordinates: [93.1800, 26.5800] as [number, number],
        timeLogged: '12 min ago',
        photoUrl: '/assets/landslide-cam.jpg',
        reportedBy: 'Field Sentinel Unit #04',
        syncStatus: 'SYNCED' as const,
        notes: reason,
        source: 'Field Sentinel Landslide Sensor',
      };
      openIncidentDetail(matched);
    }
  };

  return (
    <div className="drawer">
      <div className="drawer-head">
        <div className="rname">{roadId}</div>
        <div className="rseg">{roadName}</div>
        <div className={`status-pill ${status==='BLOCKED'?'blocked':status==='RESTRICTED'?'restricted':'open'}`}>
          <span className="sdot"></span>{status}
        </div>
      </div>
      <div className="drawer-body">
        <div className="dsection">
          <div className="dsection-lbl">Why</div>
          <div className="why-box">{reason}</div>
        </div>
        <div className="dsection">
          <div className="dsection-lbl">Risk Score</div>
          <div className="risk-score-big">{risk}<span> / 100</span></div>
          <div style={{marginTop:8}}>
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
        <button className="btn" onClick={handleViewFieldReport}>View Field Report</button>
      </div>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toastNotification, setToastNotification } = usePathSetuStore() as any;
  React.useEffect(() => {
    if (toastNotification) {
      const t = setTimeout(() => setToastNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastNotification, setToastNotification]);
  if (!toastNotification) return null;
  const cls = toastNotification.type === 'danger' ? 'crit' : toastNotification.type === 'success' ? 'ok' : 'warn';
  return (
    <div className="toast-stack" role="status" aria-live="polite" aria-atomic="true">
      <div className={`toast ${cls}`} role="alert">
        <div className="ttitle">{toastNotification.title}</div>
        <div className="tbody">{toastNotification.body}</div>
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
            <div className="dash-grid" style={{gridTemplateColumns:'224px 1fr', minHeight:620}}>
              <LayerRail />
              <div className="map-wrap" style={{height:'85vh', minHeight:620}}>
                <ErrorBoundary>
                  <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--text-faint)',fontSize:12}}>Loading map…</div>}>
                    <MapView className="w-full h-full" hideLayersButton />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>
          </div>
        ) : activeTab === 'Logistics' ? (
          <div className="view">
            <div className="panel" style={{padding:'20px 22px', overflow:'hidden'}}>
              <div className="logistics-head">
                <div>
                  <div className="logistics-title">Fleet & Cargo Intelligence</div>
                  <div className="logistics-sub">Monitoring essential commodities (d) · V2V + GPS proven offline sync</div>
                </div>
                <div className="logistics-kpis">
                  <LogisticsKPIs />
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10, fontWeight:800, letterSpacing:.5, textTransform:'uppercase', color:'var(--text-faint)', marginBottom:8}}>Supply Health (by district stock)</div>
                <div className="supply-strip">
                  <SupplyMini name="Food" pct={82} days="24/30 days" color="var(--open)" />
                  <SupplyMini name="Medicine" pct={46} days="9/21 days" color="var(--crit)" />
                  <SupplyMini name="Construction" pct={71} days="32/45 days" color="var(--warn)" />
                </div>
              </div>
              <div className="logi-wrap">
                <FleetTable />
              </div>
              <div style={{marginTop:12, paddingTop:10, borderTop:'1px solid var(--border-soft)', display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-faint)'}}>
                <span>Tap Focus to locate on map · Reroute opens decision modal</span>
                <span className="mono" id="fleet-count-footer">—</span>
              </div>
            </div>
          </div>
        ) : activeTab === 'Incidents' ? (
          <div className="view">
            <IncidentsView />
          </div>
        ) : activeTab === 'Alerts' ? (
          <div className="view">
            <AlertsView />
          </div>
        ) : activeTab === 'Analytics' ? (
          <AnalyticsView />
        ) : (
          // Dashboard default — layers via dropdown inside map, critical deliveries as left rail
          <div className="view" id="view-dashboard">
            <div className="dash-hero">
              <KPIrow />
              <div className="dash-grid">
                <CriticalLeftPanel />
                <div className="map-wrap">
                  <ErrorBoundary>
                    <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--text-faint)',fontSize:12}}>Loading map…</div>}>
                      <MapView className="w-full h-full" />
                    </Suspense>
                  </ErrorBoundary>
                </div>
                <Drawer />
              </div>
            </div>
            <DashboardBottomSection />
          </div>
        )}
      </main>

      <div className="footer-note">NER-PathSetu — prototype interface · mock intelligence data for demonstration · Smart India Hackathon</div>
      <ToastContainer />

      <RouteDecisionModal />
      <VehicleDetailModal />
      <IncidentDetailModal />
      <AlertBroadcastModal />
    </div>
  );
};

const LogisticsKPIs: React.FC = () => {
  const { vehicles, roadStatuses } = usePathSetuStore();
  const atRisk = vehicles.filter(v=> roadStatuses[v.currentRouteId] === 'BLOCKED').length;
  const crit = vehicles.filter(v=> v.priority==='CRITICAL').length;
  return (
    <>
      <span><b>{vehicles.length}</b> vehicles</span>
      <span style={{background: atRisk? 'var(--crit-dim)': 'var(--open-dim)', color: atRisk? 'var(--crit)':'var(--open)', borderColor: atRisk? 'rgba(201,79,73,.2)':'rgba(124,163,107,.2)'}}><b>{atRisk}</b> at risk</span>
      <span><b>{crit}</b> critical</span>
    </>
  );
};

const SupplyMini: React.FC<{name:string; pct:number; days:string; color:string}> = ({name,pct,days,color}) => (
  <div className="supply-mini">
    <div className="sm-head"><span>{name}</span><span className="mono" style={{color}}>{pct}%</span></div>
    <div className="sm-bar"><div className="sm-fill" style={{width:`${pct}%`, background:color}} /></div>
    <div className="sm-foot">{days} · district stock</div>
  </div>
);

const FleetTable: React.FC = () => {
  const { vehicles, roadStatuses, selectedVehicleId, setSelectedVehicle, openRouteDecision } = usePathSetuStore();
  React.useEffect(()=>{ const el=document.getElementById('fleet-count-footer'); if(el) el.textContent=`${vehicles.length} units · ${vehicles.filter(v=>roadStatuses[v.currentRouteId]==='BLOCKED').length} blocked`},[vehicles, roadStatuses]);
  return (
    <table className="logi">
      <thead><tr><th>Vehicle</th><th>Cargo</th><th>Priority</th><th>Route</th><th>Status</th><th>ETA</th><th style={{textAlign:'right'}}>Actions</th></tr></thead>
      <tbody>
        {vehicles.map(v=>{
          const s = roadStatuses[v.currentRouteId] || 'OPEN';
          const cls = s==='BLOCKED'?'blocked':s==='RESTRICTED'?'restricted':'open';
          const sel = selectedVehicleId===v.id;
          const isDelay = v.eta.includes('+');
          const delayPart = isDelay ? v.eta.slice(v.eta.indexOf('(')) : '';
          const etaMain = isDelay ? v.eta.slice(0, v.eta.indexOf('(')).trim() : v.eta;
          return (
            <tr key={v.id} className={sel? 'is-selected':''}>
              <td>
                <div className="mono" style={{fontWeight:700, fontSize:12.5}}>{v.id}</div>
                <div style={{fontSize:11, color:'var(--text-faint)', marginTop:2}}>{v.driver}</div>
              </td>
              <td>
                <div style={{fontWeight:600, fontSize:13}}>{v.cargo}</div>
                <div className="mono" style={{fontSize:11, color:'var(--text-faint)', marginTop:2, whiteSpace:'nowrap'}}>{v.destination.split(',')[0]}</div>
              </td>
              <td style={{whiteSpace:'nowrap'}}><span className={`priority-pill ${v.priority.toLowerCase()}`} style={{padding:'4px 8px', fontSize:10}}>{v.priority}</span></td>
              <td className="mono" style={{fontSize:'12px', whiteSpace:'nowrap'}}>{v.currentRouteId}<span style={{color:'var(--text-faint)', marginLeft:6}}>{v.speedKmh? `${v.speedKmh}km/h`:''}</span></td>
              <td style={{whiteSpace:'nowrap'}}><span className={`status-pill ${cls}`} style={{padding:'4px 9px', fontSize:'10.5px'}}><span className="sdot"></span>{s}</span></td>
              <td className="mono" style={{whiteSpace:'nowrap'}}>{etaMain}{delayPart && <span className="logi-eta-delay">{delayPart}</span>}</td>
              <td>
                <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                  <button className="btn" style={{padding:'7px 12px', fontSize:'12px', minHeight:32, whiteSpace:'nowrap'}} onClick={()=>setSelectedVehicle(v)}>Focus</button>
                  <button className="btn btn-primary" style={{padding:'7px 13px', fontSize:'12px', minHeight:32, whiteSpace:'nowrap'}} onClick={()=>openRouteDecision(v)}>Reroute</button>
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

const DashboardBottomSection: React.FC = () => {
  const { vehicles, incidents, roadStatuses, regionalRiskIndex, setSelectedVehicle, setFocusCoordinates, openRouteDecision, openIncidentDetail } = usePathSetuStore();

  const essentialFleet = vehicles.filter(v => v.priority === 'CRITICAL' || v.priority === 'HIGH').slice(0, 6);
  const fleetToShow = essentialFleet.length > 0 ? essentialFleet : vehicles.slice(0, 6);

  const formatLastSync = (v: typeof vehicles[number]) => {
    const sec = v.lastUpdateSec ?? 180;
    const ago = sec < 60 ? `${sec}s ago` : `${Math.floor(sec/60)}m ago`;
    const via = v.gpsStatus === 'LIVE' ? 'V2V' : v.gpsStatus === 'OFFLINE' ? 'Offline' : v.gpsStatus === 'SIMULATED' ? 'V2V' : 'Cellular';
    const color = v.gpsStatus === 'OFFLINE' ? 'var(--crit)' : 'var(--open)';
    return { ago, via, color };
  };

  const timelineItems = (() => {
    const items: { time: string; icon: string; title: string; detail: string; source: string; severity: 'CRITICAL'|'HIGH'|'INFO'; onClick?: () => void }[] = [];
    const isBlocked = roadStatuses['NH-37'] === 'BLOCKED';
    const reroutedVeh = vehicles.find(v => v.rerouteAccepted);
    const atRiskVeh = vehicles.find(v => v.routeAtRisk);

    if (isBlocked) {
      items.push({ time:'10:15 AM', icon:'🚨', title:'DRAI Alert: NH-37 status changed to BLOCKED.', detail:'Major mud & boulder slide at Km 142, both lanes impassable.', source:'DRAI', severity:'CRITICAL' });
    } else {
      items.push({ time:'10:15 AM', icon:'✅', title:'DRAI: NH-37 corridor OPEN', detail:'All lanes operational, no active disruption.', source:'DRAI', severity:'INFO' });
    }

    if (incidents[0]) {
      const inc = incidents[0];
      items.push({
        time:'10:12 AM',
        icon:'📷',
        title:`Field Sentinel: Photo verification received from ${inc.reportedBy}`,
        detail:`${inc.type} — ${inc.roadName} (${inc.roadStatus})`,
        source:'Field Sentinel',
        severity: inc.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        onClick: () => openIncidentDetail(inc)
      });
    }

    items.push({
      time:'10:05 AM',
      icon:'🛰️',
      title:'NASA Nowcast: High earth-shift detected at Km 142.',
      detail:`Regional Risk ${regionalRiskIndex}/100 • ${isBlocked ? 'Landslide susceptibility 58% • Rainfall 96mm' : 'Monitoring normal'}`,
      source:'NASA LHASA',
      severity: regionalRiskIndex >= 70 ? 'CRITICAL' : 'HIGH'
    });

    if (reroutedVeh) {
      items.push({ time:'09:50 AM', icon:'🔄', title:`System: Reroute initiated for ${reroutedVeh.id}`, detail:`Diverted via ${reroutedVeh.currentRouteId} to ${reroutedVeh.destination} • ETA ${reroutedVeh.eta}`, source:'System', severity:'INFO', onClick: () => { setSelectedVehicle(reroutedVeh); setFocusCoordinates(reroutedVeh.coordinates); } });
    } else if (atRiskVeh) {
      items.push({ time:'09:50 AM', icon:'⚠️', title:`System: Reroute required for ${atRiskVeh.id}`, detail:`Halted at Nagaon — ALT-ROUTE-B ready (+45m)`, source:'System', severity:'CRITICAL', onClick: () => openRouteDecision(atRiskVeh) });
    } else {
      items.push({ time:'09:50 AM', icon:'📡', title:'System: Fleet telemetry nominal', detail:'All convoys on schedule, no reroute active.', source:'System', severity:'INFO' });
    }

    return items;
  })();

  return (
    <div className="bottom-grid" style={{marginTop: 14}}>
      <div className="panel" style={{display:'flex', flexDirection:'column', overflow:'hidden'}}>
        <div className="panel-title" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span>Active Essential Fleet Tracker</span>
          <span style={{fontSize:'10px', color:'var(--text-faint)', fontWeight:600}}>(d) Live • {fleetToShow.length} units</span>
        </div>
        <div style={{padding:'0', overflowX:'auto'}}>
          <table className="logi" style={{width:'100%', fontSize:12}}>
            <thead>
              <tr style={{background:'var(--surface-2)'}}>
                <th style={{textAlign:'left', padding:'8px 10px', fontSize:10, letterSpacing:.4, color:'var(--text-faint)'}}>Cargo ID</th>
                <th style={{padding:'8px 10px', fontSize:10, color:'var(--text-faint)'}}>Priority</th>
                <th style={{padding:'8px 10px', fontSize:10, color:'var(--text-faint)'}}>ETA / Delay</th>
                <th style={{padding:'8px 10px', fontSize:10, color:'var(--text-faint)'}}>Last Sync</th>
                <th style={{padding:'8px 10px'}}></th>
              </tr>
            </thead>
            <tbody>
              {fleetToShow.map(v=>{
                const { ago, via, color } = formatLastSync(v);
                const isDelay = v.eta.includes('+');
                const delayPart = isDelay ? v.eta.slice(v.eta.indexOf('(')) : '';
                const etaMain = isDelay ? v.eta.slice(0, v.eta.indexOf('(')).trim() : v.eta;
                return (
                  <tr key={v.id} style={{borderTop:'1px solid var(--border-soft)'}}>
                    <td style={{padding:'8px 10px'}}>
                      <div className="mono" style={{fontWeight:700, fontSize:12}}>{v.id}</div>
                      <div style={{fontSize:11, color:'var(--text-dim)', whiteSpace:'nowrap'}}>{v.cargo}</div>
                    </td>
                    <td style={{padding:'8px 10px', textAlign:'center'}}><span className={`priority-pill ${v.priority.toLowerCase()}`} style={{fontSize:9, padding:'2px 6px'}}>{v.priority}</span></td>
                    <td style={{padding:'8px 10px', whiteSpace:'nowrap'}}>
                      <span className="mono" style={{fontWeight:600}}>{etaMain}</span>
                      {delayPart && <span className="mono" style={{color:'var(--crit)', fontWeight:700, marginLeft:6}}>{delayPart}</span>}
                    </td>
                    <td style={{padding:'8px 10px', whiteSpace:'nowrap'}}>
                      <div style={{display:'flex', alignItems:'center', gap:6, fontSize:11}}>
                        <span style={{width:6, height:6, borderRadius:'50%', background:color, display:'inline-block'}}></span>
                        <span className="mono" style={{fontSize:11}}>{ago}</span>
                      </div>
                      <div style={{fontSize:10, color:'var(--text-faint)'}}>via {via}</div>
                    </td>
                    <td style={{padding:'8px 10px', textAlign:'right'}}>
                      <button className="btn" style={{padding:'5px 9px', fontSize:11, whiteSpace:'nowrap'}} onClick={()=>{ setSelectedVehicle(v); setFocusCoordinates(v.coordinates); openRouteDecision(v); }}>View Route</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{padding:'8px 12px', borderTop:'1px solid var(--border-soft)', background:'var(--surface-2)', fontSize:11, color:'var(--text-faint)', display:'flex', justifyContent:'space-between'}}>
          <span>Tracking movement of essential commodities (d) • V2V proves offline sync</span>
          <span className="mono">{vehicles.length} total</span>
        </div>
      </div>

      <div className="panel" style={{display:'flex', flexDirection:'column', overflow:'hidden'}}>
        <div className="panel-title" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span>Live Incident & Decision Log</span>
          <span style={{fontSize:'10px', color:'var(--crit)', fontWeight:700, display:'flex', alignItems:'center', gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:'var(--crit)', display:'inline-block'}}></span>Live</span>
        </div>
        <div style={{flex:1, overflowY:'auto', padding:'12px 16px 14px', position:'relative'}}>
          <div style={{position:'absolute', left:24, top:12, bottom:14, width:2, background:'var(--border-soft)', borderRadius:2}}></div>
          <div style={{display:'flex', flexDirection:'column', gap:14}}>
            {timelineItems.map((it, idx)=>(
              <div key={idx} onClick={it.onClick} style={{display:'flex', gap:12, alignItems:'flex-start', cursor: it.onClick ? 'pointer' : 'default', opacity: idx===0 ? 1 : 0.92}}>
                <div style={{width:20, height:20, borderRadius:'50%', background: it.severity==='CRITICAL'?'var(--crit)': it.severity==='HIGH'?'var(--warn)':'var(--open)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0, marginTop:2, border:'2px solid var(--surface)', boxShadow:'0 0 0 2px var(--border-soft)'}}>{it.icon}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                    <span className="mono" style={{fontSize:11, fontWeight:700, color:'var(--text-dim)', background:'var(--surface-2)', padding:'2px 6px', borderRadius:6, border:'1px solid var(--border-soft)'}}>{it.time}</span>
                    <span style={{fontSize:10, fontWeight:800, letterSpacing:.4, textTransform:'uppercase', padding:'2px 6px', borderRadius:6, background: it.severity==='CRITICAL'?'var(--crit-dim)': it.severity==='HIGH'?'var(--warn-dim)':'#EAF1E4', color: it.severity==='CRITICAL'?'var(--crit)': it.severity==='HIGH'?'var(--warn)':'var(--open)'}}>{it.source}</span>
                  </div>
                  <div style={{fontWeight:700, fontSize:13, lineHeight:1.35, marginTop:6, color:'var(--text)'}}>{it.title}</div>
                  <div style={{fontSize:12, color:'var(--text-dim)', marginTop:3, lineHeight:1.4}}>{it.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:'8px 12px', borderTop:'1px solid var(--border-soft)', background:'var(--surface-2)', fontSize:11, color:'var(--text-faint)', display:'flex', justifyContent:'space-between'}}>
          <span>(b) Predicts • (f) Field reports • Satellite (F1) ↔ Sentinel (F2)</span>
          <span className="mono">{timelineItems.length} events</span>
        </div>
      </div>
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
  const { alerts, selectedLanguage, setSelectedLanguage } = usePathSetuStore();
  const [filter, setFilter] = React.useState<'all'|'critical'|'high'>('all');
  const [q, setQ] = React.useState('');
  const filtered = alerts.filter(a=>{
    const f = filter==='all' ? true : filter==='critical' ? a.severity==='CRITICAL' : a.severity==='HIGH';
    const s = !q || `${a.title} ${a.corridor} ${a.message} ${a.recipient}`.toLowerCase().includes(q.toLowerCase());
    return f && s;
  });
  const critCount = alerts.filter(a=>a.severity==='CRITICAL').length;
  const highCount = alerts.length - critCount;
  return (
    <div className="panel" style={{overflow:'hidden'}}>
      <div className="list-head">
        <div style={{display:'flex',justifyContent:'space-between',gap:14,flexWrap:'wrap',alignItems:'flex-start'}}>
          <div>
            <div className="list-head-title">Multilingual Alert Log</div>
            <div className="list-head-sub">{alerts.length} broadcasts · <span style={{color: critCount? 'var(--crit)':'var(--text-dim)', fontWeight:700}}>{critCount} critical</span> · {highCount} high · Live gateway · TTS 8 languages</div>
          </div>
          <div className="list-head-tools">
            <div className="list-search">
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search corridor, vehicle…" />
              <span className="sico">⌕</span>
            </div>
            <div style={{position:'relative'}}>
              <select value={selectedLanguage} onChange={e=> (setSelectedLanguage as any)(e.target.value)} className="lang-select">
                <option value="en">EN</option><option value="as">AS (অসমীয়া)</option><option value="hi">HI (हिन्दी)</option><option value="mni">MNI (মৈতৈলোন্)</option><option value="lus">Mizo</option><option value="kha">Khasi</option><option value="brx">Bodo</option><option value="bn">BN (বাংলা)</option>
              </select>
              <span style={{position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'var(--text-faint)', pointerEvents:'none'}}>▾</span>
            </div>
          </div>
        </div>
        <div className="filter-row" style={{marginTop:14}}>
          {(['all','critical','high'] as const).map(t=>(
            <button key={t} className={`filter-chip ${filter===t?'active':''}`} onClick={()=>setFilter(t)}>
              {t==='all'?'All': t==='critical'?'Critical':'High'} {t==='all'?`· ${alerts.length}`: t==='critical'?`· ${critCount}`:`· ${highCount}`}
            </button>
          ))}
          <span className="mono" style={{marginLeft:'auto', fontSize:11, color:'var(--text-faint)', alignSelf:'center'}}>{filtered.length} shown</span>
        </div>
      </div>
      <div className="card-list" style={{padding:'14px 14px 16px', display:'flex', flexDirection:'column', gap:12}}>
        {filtered.map(a=>(
          <div key={a.id} className="inc-card" style={{borderLeft:`4px solid ${a.severity==='CRITICAL'?'var(--crit)':'var(--warn)'}`}}>
            <div className={`inc-ico ${a.severity==='CRITICAL'?'crit':'warn'}`}>🔊</div>
            <div className="inc-body">
              <div style={{display:'flex', justifyContent:'space-between', gap:12, alignItems:'flex-start'}}>
                <div style={{flex:1, minWidth:0}}>
                  <div className="inc-title">{a.title}</div>
                  <div style={{fontSize:12, color:'var(--text-dim)', marginTop:3}}>{a.corridor} · <span style={{color:'var(--text)', fontWeight:600}}>{a.recipient}</span></div>
                </div>
                <div className="mono" style={{whiteSpace:'nowrap', fontSize:11, fontWeight:700, color:'var(--text-faint)', background:'var(--surface-2)', padding:'6px 10px', borderRadius:9, border:'1px solid var(--border-soft)', flexShrink:0}}>{a.timestamp}</div>
              </div>
              <div className="alert-msg" style={{marginTop:10}}>{a.message}</div>
              <div className="mono" style={{fontSize:11, color:'var(--text-faint)', marginTop:7, display:'flex', gap:8, flexWrap:'wrap'}}>
                <span style={{background:'var(--surface-2)', border:'1px solid var(--border-soft)', padding:'2px 7px', borderRadius:7, fontWeight:700}}>{a.lang.toUpperCase()}</span>
                <span>{a.vehicles.join(' · ')}</span>
              </div>
              <div style={{marginTop:11, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
                <span className="tag" style={{background: a.severity==='CRITICAL'?'var(--crit-dim)':'var(--warn-dim)', color: a.severity==='CRITICAL'?'var(--crit)':'var(--warn)', borderColor:'transparent', fontWeight:800}}>{a.severity}</span>
                <span className="tag">{a.corridor.split('(')[0].trim()}</span>
                <span className="alert-actions" style={{marginLeft:'auto'}}>
                  <button className="btn" onClick={()=> playMultilingualAlert(a.lang)}>🔊 Play {a.lang.toUpperCase()}</button>
                  <button className="btn btn-primary" onClick={()=>{ playMultilingualAlert(selectedLanguage); }}>🔊 Channel Audio</button>
                </span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length===0 && <div style={{textAlign:'center',padding:'36px 20px',color:'var(--text-faint)',fontSize:13,background:'var(--surface)',border:'1px solid var(--border-soft)',borderRadius:14}}>No alerts match filter. Try clearing search or switching severity.</div>}
      </div>
      <div className="list-footer">
        <span>Broadcasts via gateway in selected language · TTS works offline</span>
        <span className="mono">{filtered.length} / {alerts.length}</span>
      </div>
    </div>
  );
};

const AnalyticsView: React.FC = () => {
  const { roadStatuses, vehicles, incidents, alerts, supplyStatus, districtConnectivity, regionalRiskIndex, simulationActive } = usePathSetuStore();
  const blocked = Object.values(roadStatuses).filter(v=>v==='BLOCKED').length;
  const high = incidents.filter(i=>i.severity==='CRITICAL').length;
  const onScheduleRate = Math.round((vehicles.filter(v=>!v.routeAtRisk).length / Math.max(1, vehicles.length)) * 100);
  const tiles = [
    { n:blocked, l:'Blocked Corridors' },
    { n:high, l:'High-Risk Hazards' },
    { n:vehicles.length, l:'Active Convoys' },
    { n:vehicles.filter(v=>v.priority==='CRITICAL').length, l:'Critical Deliveries' },
    { n:incidents.length, l:'Field Reports Logged' },
    { n:alerts.length, l:'Active Broadcasts' },
    { n:`${regionalRiskIndex}/100`, l:'Regional Risk Score' },
    { n:`${onScheduleRate}%`, l:'Fleet On-Schedule' },
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
          <div className="panel-title" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span>Supply Gap & Critical Inventory</span>
            <span style={{fontSize:'10px', color:'var(--text-faint)'}}>Live Stock Telemetry</span>
          </div>
          <div style={{padding:'14px 18px 18px'}}>
            <div className="supply-bar-row">
              <div className="sname">Emergency Medicine Buffer</div>
              <div className="supply-track">
                <div className="supply-fill" style={{width:`${supplyStatus.medicine}%`, background: supplyStatus.medicine < 50 ? 'linear-gradient(90deg,var(--crit),#EF8B7E)' : 'linear-gradient(90deg,var(--open),#A6C495)'}}></div>
              </div>
              <div className="spct" style={{color: supplyStatus.medicine < 50 ? 'var(--crit)' : 'var(--open)'}}>{supplyStatus.medicine}%</div>
            </div>
            <div className="supply-bar-row">
              <div className="sname">Food Supplies Reserve</div>
              <div className="supply-track">
                <div className="supply-fill" style={{width:`${supplyStatus.food}%`, background:'linear-gradient(90deg,var(--brand),#EF8B7E)'}}></div>
              </div>
              <div className="spct" style={{color:'var(--brand)'}}>{supplyStatus.food}%</div>
            </div>
            <div className="supply-bar-row">
              <div className="sname">Construction & Bridge Repair</div>
              <div className="supply-track">
                <div className="supply-fill" style={{width:`${supplyStatus.construction}%`, background:'linear-gradient(90deg,var(--route),#8EB5CA)'}}></div>
              </div>
              <div className="spct" style={{color:'var(--route)'}}>{supplyStatus.construction}%</div>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-title" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span>District Connectivity & Isolation Index</span>
            <span style={{fontSize:'10px', color:'var(--text-faint)'}}>{districtConnectivity.accessible} Accessible · {districtConnectivity.blocked} Blocked</span>
          </div>
          <DistrictList />
        </div>
      </div>
    </div>
  );
};

export default App;
