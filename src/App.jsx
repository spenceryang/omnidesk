import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Compass, Film } from 'lucide-react';

import Discover from './components/Discover';
import LiveGeneration from './components/LiveGeneration';
import { getHealth } from './services/liveApi';

export default function App() {
  const [health, setHealth] = useState(null);
  const [view, setView] = useState('create');

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
          <div className="brand-mark">
            <img src="/favicon.svg" alt="" />
          </div>
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
              2 scenes · 16 seconds · managed agents
            </div>
            <h1>Create music videos and discover what other creators made.</h1>
            <p>Plan a rights-safe video from lyrics, a prompt, or creator assets, then generate clips and publish the result to Discover.</p>
          </div>
        </section>

        <nav className="view-tabs" aria-label="Workspace views">
          <button className={view === 'create' ? 'active' : ''} onClick={() => setView('create')}>
            <Film size={16} />
            <span>Create</span>
          </button>
          <button className={view === 'discover' ? 'active' : ''} onClick={() => setView('discover')}>
            <Compass size={16} />
            <span>Discover</span>
          </button>
        </nav>

        {view === 'create' ? <LiveGeneration health={health} /> : <Discover />}
      </main>

      <footer className="site-footer">
        <div>
          <strong>Omnidesk</strong>
          <span>© 2026 Omnidesk. All rights reserved.</span>
        </div>
        <nav aria-label="Footer">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms</a>
          <a href="#contact">Contact</a>
        </nav>
      </footer>
    </div>
  );
}
