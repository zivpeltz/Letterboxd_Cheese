import React, { useState } from 'react';
import { X, User as UserIcon, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (authModalMode === 'signin') {
        await login(username, password);
      } else {
        await register(username, email, password, displayName);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = () => {
    setUsername('curdlover');
    setPassword('password123');
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="modal-content" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{authModalMode === 'signin' ? 'Sign In' : 'Create Account'}</h3>
          <button className="modal-close-btn" onClick={closeAuthModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(255, 77, 77, 0.15)',
                  border: '1px solid var(--accent-red)',
                  color: '#ff8080',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            {authModalMode === 'signin' && (
              <div
                style={{
                  backgroundColor: 'rgba(229, 169, 59, 0.12)',
                  border: '1px solid rgba(229, 169, 59, 0.3)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--accent-gold)' }}>
                  Demo user pre-seeded in database:
                </div>
                <button
                  type="button"
                  onClick={fillDemoAccount}
                  style={{
                    backgroundColor: 'var(--accent-gold)',
                    border: 'none',
                    color: '#000',
                    padding: '4px 8px',
                    borderRadius: 3,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Quick Fill Demo
                </button>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Username {authModalMode === 'signin' && 'or Email'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="e.g. curdlover"
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                  }}
                />
                <UserIcon size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
              </div>
            </div>

            {authModalMode === 'register' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    placeholder="e.g. Gouda Guy"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@domain.com"
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 36px',
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        outline: 'none',
                      }}
                    />
                    <Mail size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                  }}
                />
                <Lock size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => openAuthModal(authModalMode === 'signin' ? 'register' : 'signin')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-blue)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {authModalMode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Loading...' : authModalMode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
