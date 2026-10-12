import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { api, Cheese } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface MemberItem {
  id: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  createdAt: string;
  stats: { totalLogs: number };
  top4: Array<{ position: number; cheese: Cheese }>;
}

export const MembersPage: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await api.getUsers();
        setMembers(res.users);
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
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Community Members</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Discover fellow cheese enthusiasts and explore their Top 4 favorites
          </div>
        </div>

        {!user && (
          <button className="btn btn-primary" onClick={() => openAuthModal('register')}>
            <UserPlus size={15} /> Join the Community
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading members...
        </div>
      ) : members.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '50px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div style={{ fontSize: 36 }}>🧀</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            No members registered yet
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 440, lineHeight: 1.5 }}>
            Create an account to become the founding member, start logging your cheeses, and showcase your Top 4!
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 8 }}
            onClick={() => openAuthModal(user ? 'signin' : 'register')}
          >
            {user ? 'View Your Profile' : 'Create Account'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {members.map((item) => (
            <Link
              key={item.id}
              to={`/users/${item.username}`}
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
                {item.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt={item.displayName}
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
                    {item.displayName}
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    @{item.username} • {item.stats.totalLogs} logs
                  </div>
                </div>
              </div>

              {item.bio && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {item.bio}
                </p>
              )}

              {item.top4.length > 0 && (
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
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
