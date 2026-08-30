import React, { useState } from 'react';
import { usePathSetuStore } from '../../store/usePathSetuStore';
import { PriorityLevel, RoadStatus } from '../../types';

type View = 'home' | 'form' | 'success';

export const FieldSentinel: React.FC = () => {
  const { isOffline, setOfflineMode, offlineQueue, submitFieldReport, syncOfflineQueue, setActiveView } = usePathSetuStore();
  const [view, setView] = useState<View>('home');
  const [type, setType] = useState<string | null>(null);
  const [sev, setSev] = useState<PriorityLevel | null>(null);
  const [roadStatus, setRoadStatus] = useState<RoadStatus>('BLOCKED');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [desc, setDesc] = useState('');
  const [roadId, setRoadId] = useState('NH-37');
  const [successSynced, setSuccessSynced] = useState(true);

  const submit = () => {
    if (!type || !sev) return;
    const coords: Record<string,[number,number]> = {
      'NH-37':[93.18,26.58],'NH-6':[92.2,25.45],'NH-29':[93.85,25.8],'NH-27':[92.85,26.15],
    };
    submitFieldReport({
      type: type!, severity: sev!, roadStatus, roadSegmentId: roadId,
      roadName: `${roadId} Corridor Sector`,
      coordinates: coords[roadId] || [93.18,26.58],
      photoUrl:'/assets/landslide-cam.jpg',
      reportedBy:'Field Sentinel Unit #12',
      notes: desc || 'Field report submitted from ground.',
    });
    setSuccessSynced(!isOffline);
    setView('success');
  };

  if (view==='home') {
    return (
      <div className="f-app">
        <div className="f-head">
          <div className="f-title">Field Sentinel</div>
          <div className={`f-offline-badge ${isOffline?'':'online'}`}>{isOffline?'● Offline':'● Online'}</div>
        </div>
        <div className="f-loc-card">
          <div className="l1">Current Location</div>
          <div className="l2">27.3389° N, 88.6065° E · Rangpo, Sikkim</div>
        </div>
        <button className="f-big-btn" onClick={()=>{ setView('form'); setType(null); setSev(null); setHasPhoto(false); setDesc(''); }}>📷 &nbsp;Report Incident</button>
        <div className="f-sub">Recent Reports</div>
        <div className="f-report-row">
          <div className="f-report-ico">⛰️</div>
          <div className="frt"><div className="frt-title">Landslide — Ukhrul Link Road</div><div className="frt-sub">47 min ago</div></div>
          <span className="f-status-chip synced">SYNCED</span>
        </div>
        <div className="f-report-row">
          <div className="f-report-ico">🌊</div>
          <div className="frt"><div className="frt-title">Flood — NH-6, Vairengte</div><div className="frt-sub">2 hr ago</div></div>
          <span className="f-status-chip synced">SYNCED</span>
        </div>
        {offlineQueue.length>0 && (
          <div className="f-report-row">
            <div className="f-report-ico">⛰️</div>
            <div className="frt"><div className="frt-title">Landslide — {offlineQueue[0].roadSegmentId}</div><div className="frt-sub">Just now · {offlineQueue.length} pending</div></div>
            <span className="f-status-chip pending">PENDING</span>
          </div>
        )}
        <label style={{display:'flex',alignItems:'center',gap:8,marginTop:22,fontSize:'11.5px',color:'#9C8F78'}}>
          <input type="checkbox" checked={isOffline} onChange={e=>setOfflineMode(e.target.checked)} /> Simulate offline mode
        </label>
        {offlineQueue.length>0 && (
          <button className="btn" style={{marginTop:12,width:'100%'}} onClick={()=>syncOfflineQueue()}>Sync {offlineQueue.length} pending</button>
        )}
        <button className="btn" style={{marginTop:10,width:'100%',background:'transparent'}} onClick={()=>setActiveView('dashboard')}>← Back to War-Room</button>
      </div>
    );
  }

  if (view==='form') {
    const types = ['Landslide','Flood','Road Damage','Bridge Damage','Road Blockage','Other'];
    const sevs: PriorityLevel[] = ['LOW','MEDIUM' as any,'CRITICAL'] as any;
    // map LOW/MEDIUM to types store expects: LOW->LOW, MEDIUM->HIGH, CRITICAL->CRITICAL
    const sevMap: Record<string, PriorityLevel> = {Low:'LOW', Medium:'HIGH', Critical:'CRITICAL'};
    return (
      <div className="f-form">
        <button className="f-back" onClick={()=>setView('home')}>← Back</button>
        <div style={{fontFamily:'Space Grotesk',fontWeight:700,fontSize:'18px'}}>Report Incident</div>
        <div className="f-label">Location</div>
        <div className="f-loc-card" style={{marginBottom:0}}><div className="l1">Auto-detected</div><div className="l2">27.3389° N, 88.6065° E</div></div>

        <div className="f-label">Highway</div>
        <div className="f-chip-row">
          {['NH-37','NH-6','NH-29','NH-27'].map(r=>(
            <button key={r} className={`f-chip ${roadId===r?'sel':''}`} onClick={()=>setRoadId(r)}>{r}</button>
          ))}
        </div>

        <div className="f-label">Type</div>
        <div className="f-chip-row">{types.map(t=>(
          <button key={t} className={`f-chip ${type===t?'sel':''}`} onClick={()=>setType(t)}>{t}</button>
        ))}</div>

        <div className="f-label">Severity</div>
        <div className="f-chip-row">{[
          {label:'Low', sev:'LOW', cls:'low'},
          {label:'Medium', sev:'HIGH', cls:'medium'},
          {label:'Critical', sev:'CRITICAL', cls:'critical'},
        ].map(s=>(
          <button key={s.label} className={`f-chip sev-${s.cls} ${sev===s.sev?'sel':''}`} onClick={()=>setSev(s.sev as PriorityLevel)}>{s.label}</button>
        ))}</div>

        <div className="f-label">Road Status</div>
        <div className="f-chip-row">
          {(['BLOCKED','RESTRICTED','OPEN'] as RoadStatus[]).map(s=>(
            <button key={s} className={`f-chip ${roadStatus===s?'sel':''}`} onClick={()=>setRoadStatus(s)}>{s}</button>
          ))}
        </div>

        <div className="f-label">Photo</div>
        <div className={`f-photo-box ${hasPhoto?'taken':''}`} onClick={()=>setHasPhoto(!hasPhoto)}>
          <div style={{fontSize:22}}>{hasPhoto?'✅':'📷'}</div>
          <div>{hasPhoto?'Photo attached':'Tap to capture photo'}</div>
        </div>

        <div className="f-label">Description</div>
        <textarea className="f-textarea" rows={3} placeholder="Brief description of what you see..." value={desc} onChange={e=>setDesc(e.target.value)} />

        <button className="f-submit" disabled={!type || !sev} onClick={submit}>Submit Report</button>
      </div>
    );
  }

  // success
  return (
    <div className="f-success">
      <div className="f-check">✓</div>
      <h3>Incident Received</h3>
      <p>{successSynced? 'Your report has been submitted and synced.' : 'Saved on-device. Will sync automatically once connected.'}</p>
      <div className="f-meta-card">
        <div className="mrow"><span>GPS</span><b>Attached</b></div>
        <div className="mrow"><span>Timestamp</span><b>Attached</b></div>
        <div className="mrow"><span>Type</span><b>{type}</b></div>
        <div className="mrow"><span>Severity</span><b>{sev}</b></div>
        <div className="mrow"><span>Sync Status</span><b style={{color: successSynced?'#547A3F':'#B0741C'}}>{successSynced?'Synced':'Pending'}</b></div>
      </div>
      {!successSynced && <button className="f-submit" style={{background:'#2A211A'}} onClick={()=>{ setSuccessSynced(true); }}>Sync Now</button>}
      <button className="f-done-btn" onClick={()=>{
        setView('home');
        // stay on field view, user can go back via header
      }}>Done</button>
    </div>
  );
};
