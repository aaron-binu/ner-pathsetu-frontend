import React from 'react';
import { usePathSetuStore } from '../../store/usePathSetuStore';

const TABS = [
  { id: 'Dashboard', label: 'Dashboard' },
  { id: 'Map', label: 'Map' },
  { id: 'Logistics', label: 'Logistics' },
  { id: 'Incidents', label: 'Incidents' },
  { id: 'Alerts', label: 'Alerts' },
  { id: 'Analytics', label: 'Analytics' },
] as const;

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeView,
    setActiveView,
    simulationActive,
    triggerDisruptionSimulation,
    resetSimulation,
  } = usePathSetuStore();

  const [demoRunning, setDemoRunning] = React.useState(false);
  const role: 'government' | 'field' =
    activeView === 'field-sentinel' ? 'field' : 'government';

  const runDemo = async () => {
    if (demoRunning) return;
    setDemoRunning(true);
    triggerDisruptionSimulation();
    setActiveTab('Dashboard' as any);
    setActiveView('dashboard');
    setTimeout(() => setDemoRunning(false), 2600);
  };

  const handleRole = (r: string) => {
    if (r === 'government') { setActiveView('dashboard'); setActiveTab('Dashboard' as any); }
    if (r === 'field') { setActiveView('field-sentinel'); }
  };

  return (
    <header className="topbar">
      <div className="brand-mark">
        <div className="brand-glyph">MM</div>
        <div className="brand-text">
          <div className="name">MargMitra</div>
          <div className="tag">Logistics Resilience Intelligence</div>
        </div>
      </div>

      <div className="navtabs" id="navtabs">
        {TABS.map(t => {
          const active = activeView === 'dashboard' && activeTab === t.id;
          return (
            <button
              key={t.id}
              data-tab={t.id.toLowerCase()}
              className={active ? 'active' : ''}
              onClick={() => {
                setActiveView('dashboard');
                setActiveTab(t.id as any);
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="topbar-right">
        <button className={`demo-btn ${demoRunning || simulationActive ? 'running' : ''}`} id="demoBtn" onClick={() => simulationActive ? resetSimulation() : runDemo()}>
          <span>{simulationActive ? '■ Running Scenario…' : '▶  Simulate Live Event'}</span>
        </button>
        <div className="role-switch" id="roleSwitch">
          {[
            { id: 'government', label: 'Government' },
            { id: 'field', label: 'Field Officer' },
          ].map(r => (
            <button
              key={r.id}
              data-role={r.id}
              className={role === r.id ? 'active' : ''}
              onClick={() => handleRole(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
