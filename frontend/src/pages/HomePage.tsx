import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Heart, Sparkles } from 'lucide-react';
import { api, Cheese, CheeseLog, CustomList, CheeseType } from '../services/api';
import { PosterCard } from '../components/PosterCard';
import { RatingStars } from '../components/RatingStars';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { user, openAuthModal, openLogModal } = useAuth();

  const [popularCheeses, setPopularCheeses] = useState<Cheese[]>([]);
  const [recentLogs, setRecentLogs] = useState<CheeseLog[]>([]);
  const [lists, setLists] = useState<CustomList[]>([]);
  const [types, setTypes] = useState<CheeseType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cheesesRes, logsRes, listsRes, typesRes] = await Promise.all([
          api.getCheeses({ limit: 6, sort: 'popular' }),
          api.getLogs({ limit: 6 }),
          api.getLists(),
          api.getCheeseTypes(),
        ]);

        setPopularCheeses(cheesesRes.items);
        setRecentLogs(logsRes.items);
        setLists(listsRes.lists.slice(0, 3));
        setTypes(typesRes.types);
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Re-load if log was created
    const handler = () => loadData();
    window.addEventListener('cheeseboxd:log-created', handler);
    return () => window.removeEventListener('cheeseboxd:log-created', handler);
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Cheeseboxd...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40, paddingBottom: 40 }}>
      {/* Hero Welcome Banner */}
      {!user ? (
        <section
          style={{
            position: 'relative',
            background: 'linear-gradient(180deg, rgba(31, 39, 46, 0.8) 0%, rgba(20, 24, 28, 1) 100%)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '50px 0 40px',
            textAlign: 'center',
          }}
        >
          <div className="container" style={{ maxWidth: 760 }}>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                marginBottom: 12,
              }}
            >
              Track cheeses you’ve tasted.<br />Save those you want to try.<br />Tell your friends what’s good.
            </h1>
            <p
              style={{
                fontSize: 15,
                color: 'var(--text-secondary)',
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              The social network for cheese lovers. Rate, review, and discover everything from artisanal aged gouda to the sharpest farmhouse cheddar.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                className="btn btn-primary"
                style={{ padding: '10px 22px', fontSize: 14 }}
                onClick={() => openAuthModal('register')}
              >
                Get Started — It’s Free
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: '10px 20px', fontSize: 14 }}
                onClick={() => openAuthModal('signin')}
              >
                Sign In
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div
          style={{
            background: 'linear-gradient(180deg, #1d252c 0%, var(--bg-base) 100%)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '24px 0',
          }}
        >
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Welcome back,</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                {user.displayName}
              </h2>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => openLogModal()}
            >
              <Sparkles size={15} /> Log What You're Eating
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {/* Popular This Week Ribbon */}
        <section>
          <div className="section-heading">
            <span>Popular This Week</span>
            <Link to="/cheeses" className="see-more">
              Browse all <ChevronRight size={13} />
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 16,
            }}
          >
            {popularCheeses.map((cheese) => (
              <PosterCard key={cheese.id} cheese={cheese} showDetails />
            ))}
          </div>
        </section>

        {/* Just Reviewed Feed */}
        <section>
          <div className="section-heading">
            <span>Just Reviewed</span>
            <Link to="/cheeses" className="see-more">
              More reviews <ChevronRight size={13} />
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            {recentLogs
              .filter((log) => log.reviewText && log.reviewText.trim().length > 0)
              .map((log) => (
                <div
                  key={log.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 16,
                    display: 'flex',
                    gap: 14,
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  {/* Reviewer Details */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Link to={`/users/${log.user.username}`}>
                        {log.user.avatarUrl ? (
                          <img
                            src={log.user.avatarUrl}
                            alt={log.user.displayName}
                            style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              backgroundColor: 'var(--bg-elevated)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                            }}
                          >
                            🧀
                          </div>
                        )}
                      </Link>
                      <div>
                        <Link
                          to={`/users/${log.user.username}`}
                          style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}
                        >
                          {log.user.displayName}
                        </Link>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          reviewed{' '}
                          <Link to={`/cheeses/${log.cheese.slug}`} style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                            {log.cheese.name}
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <RatingStars value={log.rating} size={14} />
                      {log.isLiked && <Heart size={13} fill="var(--accent-orange)" color="var(--accent-orange)" />}
                    </div>

                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {log.reviewText}
                    </p>
                  </div>

                  {/* Cheese Poster Thumbnail */}
                  <Link
                    to={`/cheeses/${log.cheese.slug}`}
                    style={{
                      width: 65,
                      flexShrink: 0,
                      aspectRatio: '2/3',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <img
                      src={log.photoUrl || log.cheese.imageUrl || log.cheese.type?.thumbnailUrl || ''}
                      alt={log.cheese.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Link>
                </div>
              ))}
          </div>
        </section>

        {/* Popular Curated Lists (Letterboxd Style) */}
        {lists.length > 0 && (
          <section>
            <div className="section-heading">
              <span>Popular Lists</span>
              <Link to="/lists" className="see-more">
                View all lists <ChevronRight size={13} />
              </Link>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 20,
              }}
            >
              {lists.map((list) => (
                <Link
                  key={list.id}
                  to={`/lists/${list.id}`}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  {/* Fanned / Stacked Poster Previews */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      height: 100,
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    {list.previewItems.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          backgroundColor: 'var(--bg-elevated)',
                          overflow: 'hidden',
                        }}
                      >
                        {item.cheese.imageUrl ? (
                          <img
                            src={item.cheese.imageUrl}
                            alt={item.cheese.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                            🧀
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {list.title}
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      by {list.user.displayName} • {list.itemsCount} cheeses
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Cheese Styles / Types Grid */}
        <section>
          <div className="section-heading">
            <span>Explore by Style</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {types.map((type) => (
              <Link
                key={type.id}
                to={`/cheeses?type=${encodeURIComponent(type.slug)}`}
                className="tag-pill"
                style={{ padding: '6px 12px', fontSize: 13 }}
              >
                🧀 {type.name}
                {type.cheeseCount !== undefined && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 2 }}>
                    ({type.cheeseCount})
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
