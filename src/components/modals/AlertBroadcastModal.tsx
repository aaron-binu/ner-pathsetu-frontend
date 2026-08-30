import React from 'react';
import { usePathSetuStore } from '../../store/usePathSetuStore';
import { playMultilingualAlert } from '../../utils/audio';

export const AlertBroadcastModal: React.FC = () => {
  const { alertBroadcastModalOpen, closeModals, selectedLanguage, setSelectedLanguage } = usePathSetuStore();
  if (!alertBroadcastModalOpen) return null;
  return (
    <div className="modal-backdrop" onClick={closeModals}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:520}}>
        <div className="modal-head">
          <h2>Broadcast Alert</h2>
          <button className="x" onClick={closeModals}>✕</button>
        </div>
        <div className="modal-body">
          <div className="panel" style={{padding:16,textAlign:'center',background:'var(--surface-2)'}}>
            <div style={{fontWeight:700,fontSize:15}}>Road Blocked Ahead — NH-37</div>
            <div style={{fontSize:12,color:'var(--text-dim)',marginTop:6}}>Landslide near Kaziranga. Use Haflong bypass. Voice alert will play in selected language.</div>
          </div>
          <div style={{marginTop:14}}>
            <div style={{fontSize:10,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'.6px',fontWeight:700,marginBottom:6}}>Language Channel</div>
            <select value={selectedLanguage} onChange={e=>setSelectedLanguage(e.target.value as any)} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1px solid var(--border)',background:'var(--surface)',fontSize:13}}>
              <option value="en">English (Default)</option>
              <option value="as">Assamese (অসমীয়া)</option>
              <option value="hi">Hindi (हिन्दी)</option>
              <option value="mni">Manipuri (মৈতৈলোন্)</option>
              <option value="lus">Mizo (Mizo ṭawng)</option>
              <option value="kha">Khasi (Ka Ktien Khasi)</option>
              <option value="brx">Bodo (बर')</option>
              <option value="bn">Bengali (বাংলা)</option>
            </select>
          </div>
          <div style={{display:'flex',gap:10,marginTop:16}}>
            <button className="btn" style={{flex:1}} onClick={closeModals}>Dismiss</button>
            <button className="btn btn-primary" style={{flex:1}} onClick={()=>playMultilingualAlert(selectedLanguage)}>🔊 Play Voice Alert</button>
          </div>
        </div>
      </div>
    </div>
  );
};
