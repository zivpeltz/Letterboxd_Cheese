import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Edit3, MapPin, Calendar, BookOpen, Clock, Heart, Plus, X } from 'lucide-react';
import { api, UserProfile, CheeseLog, Cheese } from '../services/api';
import { PosterCard } from '../components/PosterCard';
import { RatingStars } from '../components/RatingStars';
import { HistogramChart } from '../components/HistogramChart';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();

  const currentTab = searchParams.get('tab') || 'profile';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [diaryLogs, setDiaryLogs] = useState<CheeseLog[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Array<{ addedAt: string; cheese: Cheese }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Top 4 Modal state
  const [editTop4Modal, setEditTop4Modal] = useState(false);
  const [favoriteCandidateIds, setFavoriteCandidateIds] = useState<string[]>([]);
  const [allCheeses, setAllCheeses] = useState<Cheese[]>([]);
  const [favSearchQuery, setFavSearchQuery] = useState('');

  const isOwnProfile = currentUser && profile && currentUser.username.toLowerCase() === profile.user.username.toLowerCase();

  const loadProfile = async () => {
    if (!username) return;
    try {
      const data = await api.getUserProfile(username);
      setProfile(data);
      setFavoriteCandidateIds(data.top4.map((f) => f.cheese.id));

      if (currentTab === 'diary' || currentTab === 'reviews') {
        const logsRes = await api.getLogs({ username });
        setDiaryLogs(logsRes.items);
      } else if (currentTab === 'wishlist') {
        const wishRes = await api.getWishlist(username);
        setWishlistItems(wishRes.items);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username, currentTab]);

  const openFavoritesModal = async () => {
    setEditTop4Modal(true);
    try {
      const res = await api.getCheeses({ limit: 50 });
      setAllCheeses(res.items);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveFavorites = async () => {
    try {
      await api.setTopFavorites(favoriteCandidateIds);
      setEditTop4Modal(false);
      loadProfile();
    } catch (e: any) {
      alert(e.message || 'Failed to save favorites');
    }
  };

  const toggleFavoriteChoice = (id: string) => {
    if (favoriteCandidateIds.includes(id)) {
      setFavoriteCandidateIds(favoriteCandidateIds.filter((cid) => cid !== id));
    } else {
      if (favoriteCandidateIds.length >= 4) {
        alert('You can select up to 4 cheeses for your Top 4.');
        return;
      }
      setFavoriteCandidateIds([...favoriteCandidateIds, id]);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading profile...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>User not found</h2>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: 16 }}>
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      {/* Profile Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          paddingBottom: 24,
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {profile.user.avatarUrl ? (
            <img
              src={profile.user.avatarUrl}
              alt={profile.user.displayName}
              style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-focus)' }}
            />
          ) : (
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: '50%',
                backgroundColor: 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 34,
                border: '2px solid var(--border-subtle)',
              }}
            >
              🧀
            </div>
          )}

          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
              {profile.user.displayName}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
              @{profile.user.username}
            </div>

            {profile.user.bio && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 460, lineHeight: 1.45 }}>
                {profile.user.bio}
              </p>
            )}

            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              {profile.user.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={13} /> {profile.user.location}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} /> Member since {new Date(profile.user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Counter Bar (Letterboxd Style) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 20px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              {profile.stats.totalLogs}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Logs
            </div>
          </div>
          <div style={{ width: 1, height: 28, backgroundColor: 'var(--border-subtle)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              {profile.stats.uniqueCheeses}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Cheeses
            </div>
          </div>
          <div style={{ width: 1, height: 28, backgroundColor: 'var(--border-subtle)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              {profile.stats.totalReviews}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Reviews
            </div>
          </div>
          <div style={{ width: 1, height: 28, backgroundColor: 'var(--border-subtle)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              {profile.stats.totalWishlist}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Wishlist
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 32,
        }}
      >
        {[
          { key: 'profile', label: 'Profile' },
          { key: 'diary', label: 'Diary' },
          { key: 'reviews', label: 'Reviews' },
          { key: 'wishlist', label: 'Wishlist' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSearchParams({ tab: tab.key })}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 0',
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: currentTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: currentTab === tab.key ? '2px solid var(--accent-gold)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Profile Overview */}
      {currentTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {/* The Iconic "Top 4" Favorites */}
          <section>
            <div className="section-heading">
              <span>Favorite Cheeses (Top 4)</span>
              {isOwnProfile && (
                <button
                  onClick={openFavoritesModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-blue)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Edit3 size={12} /> Edit Favorites
                </button>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16,
              }}
            >
              {[1, 2, 3, 4].map((pos) => {
                const fav = profile.top4.find((f) => f.position === pos);
                return (
                  <div key={pos}>
                    {fav ? (
                      <PosterCard cheese={fav.cheese} showDetails />
                    ) : (
                      <div
                        onClick={() => {
                          if (isOwnProfile) openFavoritesModal();
                        }}
                        style={{
                          aspectRatio: '2/3',
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px dashed var(--border-focus)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          color: 'var(--text-muted)',
                          cursor: isOwnProfile ? 'pointer' : 'default',
                        }}
                      >
                        <Plus size={20} />
                        <span style={{ fontSize: 11, fontWeight: 600 }}>Slot #{pos}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Rating Distribution & Palate Insights Side-by-Side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* User Rating Histogram */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 20,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>
                Rating Distribution ({profile.stats.totalLogs} Ratings)
              </div>
              <HistogramChart distribution={profile.stats.ratingHistogram} />
            </div>

            {/* Palate Insights */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Palate DNA
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                  Most Tasted Styles
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {profile.stats.topTypes.map((t) => (
                    <span key={t.name} className="tag-pill">
                      🧀 {t.name} ({t.count})
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                  Most Logged Makers
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {profile.stats.topMakers.map((m) => (
                    <span key={m.name} className="tag-pill">
                      🏢 {m.name} ({m.count})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <section>
            <div className="section-heading">
              <span>Recent Diary Entries</span>
              <button
                onClick={() => setSearchParams({ tab: 'diary' })}
                style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: 11, cursor: 'pointer' }}
              >
                View full diary →
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 16,
              }}
            >
              {profile.recentLogs.map((log) => (
                <PosterCard key={log.id} cheese={log.cheese} showDetails />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: Full Diary (Letterboxd Style) */}
      {currentTab === 'diary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-heading">
            <span>Chronological Diary ({diaryLogs.length})</span>
          </div>

          {diaryLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              No cheeses logged yet.
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
              }}
            >
              {diaryLogs.map((log, index) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '12px 18px',
                    borderBottom: index < diaryLogs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Date Column */}
                  <div style={{ width: 85, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {new Date(log.consumedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  {/* Thumbnail */}
                  <Link
                    to={`/cheeses/${log.cheese.slug}`}
                    style={{ width: 36, height: 50, borderRadius: 2, overflow: 'hidden', backgroundColor: '#222' }}
                  >
                    <img
                      src={log.photoUrl || log.cheese.imageUrl || log.cheese.type?.thumbnailUrl || ''}
                      alt={log.cheese.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Link>

                  {/* Title & Maker */}
                  <div style={{ flex: 1 }}>
                    <Link
                      to={`/cheeses/${log.cheese.slug}`}
                      style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}
                    >
                      {log.cheese.name}
                    </Link>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      by {log.cheese.maker} {log.cheese.fatPercentage && `• ${log.cheese.fatPercentage}% fat`}
                    </div>
                  </div>

                  {/* Rating Stars & Like */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <RatingStars value={log.rating} size={15} />
                    {log.isLiked && <Heart size={14} fill="var(--accent-orange)" color="var(--accent-orange)" />}
                  </div>

                  {/* Review preview icon */}
                  {log.reviewText && (
                    <div title={log.reviewText} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <BookOpen size={16} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Reviews */}
      {currentTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-heading">
            <span>Written Reviews</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {diaryLogs
              .filter((l) => l.reviewText && l.reviewText.trim().length > 0)
              .map((log) => (
                <div
                  key={log.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 18,
                    display: 'flex',
                    gap: 16,
                  }}
                >
                  <Link
                    to={`/cheeses/${log.cheese.slug}`}
                    style={{ width: 65, aspectRatio: '2/3', borderRadius: 3, overflow: 'hidden' }}
                  >
                    <img
                      src={log.photoUrl || log.cheese.imageUrl || log.cheese.type?.thumbnailUrl || ''}
                      alt={log.cheese.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Link>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Link to={`/cheeses/${log.cheese.slug}`} style={{ fontSize: 16, fontWeight: 700 }}>
                          {log.cheese.name}
                        </Link>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {log.cheese.maker} • Logged on {new Date(log.consumedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <RatingStars value={log.rating} size={15} />
                        {log.isLiked && <Heart size={14} fill="var(--accent-orange)" color="var(--accent-orange)" />}
                      </div>
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {log.reviewText}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: Wishlist ("Want to Taste") */}
      {currentTab === 'wishlist' && (
        <div>
          <div className="section-heading">
            <span>Wishlist ({wishlistItems.length})</span>
          </div>

          {wishlistItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              Wishlist is empty. Click the clock icon on any cheese to save it here!
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 20,
              }}
            >
              {wishlistItems.map((item) => (
                <PosterCard key={item.cheese.id} cheese={item.cheese} showDetails />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Top 4 Modal */}
      {editTop4Modal && (
        <div className="modal-overlay" onClick={() => setEditTop4Modal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Your Top 4 Cheeses</h3>
              <button className="modal-close-btn" onClick={() => setEditTop4Modal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Pick up to 4 signature cheeses ({favoriteCandidateIds.length}/4 selected):
              </div>

              <input
                type="text"
                value={favSearchQuery}
                onChange={(e) => setFavSearchQuery(e.target.value)}
                placeholder="Filter catalog..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 4,
                  outline: 'none',
                }}
              />

              <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {allCheeses
                  .filter((c) =>
                    !favSearchQuery ||
                    c.name.toLowerCase().includes(favSearchQuery.toLowerCase()) ||
                    c.maker.toLowerCase().includes(favSearchQuery.toLowerCase())
                  )
                  .map((c) => {
                    const isSelected = favoriteCandidateIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleFavoriteChoice(c.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: isSelected ? 'rgba(229, 169, 59, 0.15)' : 'var(--bg-elevated)',
                          border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.maker}</div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                          {isSelected ? '✓ Selected' : '+ Pick'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditTop4Modal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveFavorites}>
                Save Top 4
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
