import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, User as UserIcon, LogOut, BookOpen, Clock, Heart, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, Cheese } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout, openAuthModal, openLogModal } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Cheese[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.getCheeses({ q: searchQuery, limit: 6 });
        setSearchResults(res.items);
        setSearchOpen(true);
      } catch (err) {
        console.error(err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      navigate(`/cheeses?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(20, 24, 28, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        height: 60,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        {/* Logo & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: 'var(--text-primary)',
            }}
          >
            <span style={{ fontSize: 22 }}>🧀</span>
            <span>CHEESEBOXD</span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link
              to="/cheeses"
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}
            >
              CHEESES
            </Link>
            <Link
              to="/lists"
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}
            >
              LISTS
            </Link>
            <Link
              to="/members"
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}
            >
              MEMBERS
            </Link>
          </nav>
        </div>

        {/* Search, + LOG, Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Live Search */}
          <div ref={searchRef} style={{ position: 'relative' }}>
            <form onSubmit={handleSearchSubmit}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search cheeses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setSearchOpen(true);
                  }}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '6px 12px 6px 32px',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    width: 170,
                    outline: 'none',
                    transition: 'width 0.2s ease, border-color 0.2s ease',
                  }}
                  onFocusCapture={(e) => (e.currentTarget.style.width = '240px')}
                  onBlurCapture={(e) => {
                    if (!searchQuery) e.currentTarget.style.width = '170px';
                  }}
                />
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: 8,
                    color: 'var(--text-muted)',
                  }}
                />
              </div>
            </form>

            {/* Live Dropdown */}
            {searchOpen && searchResults.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  width: 300,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-focus)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-card)',
                  zIndex: 200,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '6px 12px',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  Cheeses
                </div>
                {searchResults.map((c) => (
                  <Link
                    key={c.id}
                    to={`/cheeses/${c.slug}`}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {c.maker} • {c.type?.name}
                      </div>
                    </div>
                    {c.stats?.avgRating && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-gold)' }}>
                        ★ {c.stats.avgRating.toFixed(1)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* + LOG Action Button */}
          <button
            className="btn btn-primary btn-pill"
            style={{ padding: '6px 14px', fontSize: 12, letterSpacing: '0.04em' }}
            onClick={() => openLogModal()}
          >
            <Plus size={14} strokeWidth={3} />
            <span>LOG</span>
          </button>

          {/* User Profile / Auth State */}
          {user ? (
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 'var(--radius-pill)',
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <UserIcon size={14} />
                  </div>
                )}
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user.displayName.split(' ')[0]}
                </span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 8,
                    width: 180,
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-focus)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-card)',
                    zIndex: 200,
                    overflow: 'hidden',
                  }}
                >
                  <Link
                    to={`/users/${user.username}`}
                    onClick={() => setProfileDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      fontSize: 13,
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <UserIcon size={14} /> Profile
                  </Link>
                  <Link
                    to={`/users/${user.username}?tab=diary`}
                    onClick={() => setProfileDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      fontSize: 13,
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <BookOpen size={14} /> Diary
                  </Link>
                  <Link
                    to={`/users/${user.username}?tab=wishlist`}
                    onClick={() => setProfileDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      fontSize: 13,
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <Clock size={14} /> Wishlist
                  </Link>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      fontSize: 13,
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-red)',
                      cursor: 'pointer',
                    }}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => openAuthModal('signin')}
              >
                Sign In
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => openAuthModal('register')}
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
