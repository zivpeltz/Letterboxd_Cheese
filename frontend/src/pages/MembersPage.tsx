import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, UserProfile } from '../services/api';

export const MembersPage: React.FC = () => {
  const [demoProfiles, setDemoProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      try {
        // Fetch demo user profile
        const p = await api.getUserProfile('curdlover');
        setDemoProfiles([p]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, []);

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Community Members</h1>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Discover fellow cheese enthusiasts and explore their Top 4 favorites
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading members...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {demoProfiles.map((item) => (
            <Link
              key={item.user.id}
              to={`/users/${item.user.username}`}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {item.user.avatarUrl ? (
                  <img
                    src={item.user.avatarUrl}
                    alt={item.user.displayName}
                    style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-elevated)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}
                  >
                    🧀
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.user.displayName}
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    @{item.user.username} • {item.stats.totalLogs} logs
                  </div>
                </div>
              </div>

              {item.user.bio && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {item.user.bio}
                </p>
              )}

              {/* Top 4 Mini Posters */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Top 4 Cheeses
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {item.top4.map((fav) => (
                    <div
                      key={fav.position}
                      style={{
                        aspectRatio: '2/3',
                        borderRadius: 3,
                        overflow: 'hidden',
                        backgroundColor: 'var(--bg-elevated)',
                      }}
                    >
                      {fav.cheese.imageUrl ? (
                        <img
                          src={fav.cheese.imageUrl}
                          alt={fav.cheese.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                          🧀
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
