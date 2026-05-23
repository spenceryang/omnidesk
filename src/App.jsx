import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Film } from 'lucide-react';

import LiveGeneration from './components/LiveGeneration';
import { getHealth } from './services/liveApi';

export default function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth({ ok: false, configured: false }));
  }, []);

  const isLive = Boolean(health?.configured);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">O</div>
          <div>
            <strong>Omnidesk</strong>
            <span>Music video studio</span>
          </div>
        </div>

        <div className={`status-pill ${isLive ? 'ready' : 'missing'}`}>
          {isLive ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{isLive ? 'Live API' : 'API offline'}</span>
        </div>
      </header>

      <main className="workspace">
        <section className="studio-intro">
          <div>
            <div className="eyebrow">
              <Film size={15} />
              10 scenes · 60 seconds · managed agents
            </div>
            <h1>Turn a track, prompt, or creator asset into a music video plan.</h1>
            <p>Build the storyboard, check it with agents, then generate selected clips.</p>
          </div>
        </section>

        <LiveGeneration health={health} />
      </main>
    </div>
  );
}
