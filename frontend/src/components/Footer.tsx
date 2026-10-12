import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        marginTop: 60,
        borderTop: '1px solid var(--border-subtle)',
        padding: '30px 0 40px',
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-muted)',
        fontSize: 12,
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 20, fontWeight: 600 }}>
          <Link to="/cheeses">Cheeses</Link>
          <Link to="/lists">Lists</Link>
          <Link to="/members">Members</Link>
        </div>

        <div>
          🧀 <strong>Cheeseboxd</strong> — The social network for cheese lovers. Track what you’ve tasted, rate your favorites, and discover world-class curds.
        </div>

        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
          Data enriched via Wikipedia REST API. Letterboxd-style logging mechanics. Made for artisanal discovery.
        </div>
      </div>
    </footer>
  );
};
