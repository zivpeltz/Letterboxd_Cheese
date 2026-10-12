import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Clock, Star, ExternalLink, Plus } from 'lucide-react';
import { api, Cheese } from '../services/api';
import { RatingStars } from '../components/RatingStars';
import { HistogramChart } from '../components/HistogramChart';
import { useAuth } from '../context/AuthContext';

export const CheeseDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, openLogModal, openAuthModal } = useAuth();

  const [cheese, setCheese] = useState<Cheese | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [userRating, setUserRating] = useState<number>(0);

  const loadCheese = async () => {
    if (!slug) return;
    try {
      const data = await api.getCheese(slug);
      setCheese(data);
      setIsLiked(data.userState?.isLiked || false);
      setIsWishlisted(data.userState?.isWishlisted || false);
      setUserRating(data.userState?.userRating || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load cheese');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheese();
    const handler = () => loadCheese();
    window.addEventListener('cheeseboxd:log-created', handler);
    return () => window.removeEventListener('cheeseboxd:log-created', handler);
  }, [slug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading cheese details...
      </div>
    );
  }

  if (error || !cheese) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Cheese not found</h2>
        <Link to="/cheeses" className="btn btn-secondary" style={{ marginTop: 16 }}>
          Back to catalog
        </Link>
      </div>
    );
  }

  const handleWishlistToggle = async () => {
    if (!user) {
      openAuthModal('signin');
      return;
    }
    const next = !isWishlisted;
    setIsWishlisted(next);
    try {
      await api.toggleWishlist(cheese.id);
    } catch (err) {
      setIsWishlisted(!next);
    }
  };

  const handlePersonalRating = async (newVal: number) => {
    if (!user) {
      openAuthModal('signin');
      return;
    }
    setUserRating(newVal);
    // Open log modal with prefilled star score for ease of review
    openLogModal(cheese);
  };

  const imageUrl = cheese.imageUrl || cheese.type?.thumbnailUrl;

  return (
    <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 260px) 1fr',
          gap: 36,
          alignItems: 'start',
        }}
      >
        {/* Left Column: Poster & Action Panel (Letterboxd Style) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            className="poster-card"
            style={{
              aspectRatio: '2/3',
              boxShadow: 'var(--shadow-card)',
              cursor: 'default',
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={cheese.name}
                className="poster-image"
              />
            ) : (
              <div className="poster-placeholder">
                <span className="badge">{cheese.type?.name}</span>
                <span className="title">{cheese.name}</span>
              </div>
            )}
          </div>

          {/* Action Box Panel */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px 0', fontSize: 13 }}
              onClick={() => openLogModal(cheese)}
            >
              <Plus size={16} /> {cheese.userState?.hasLogged ? 'Log Again / Edit' : 'Log Cheese'}
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (!user) openAuthModal('signin');
                  else openLogModal(cheese);
                }}
                style={{
                  color: isLiked ? 'var(--accent-orange)' : 'var(--text-secondary)',
                  borderColor: isLiked ? 'rgba(255, 128, 0, 0.4)' : 'var(--border-subtle)',
                }}
              >
                <Heart size={14} fill={isLiked ? 'var(--accent-orange)' : 'none'} />
                <span>{isLiked ? 'Liked' : 'Like'}</span>
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleWishlistToggle}
                style={{
                  color: isWishlisted ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  borderColor: isWishlisted ? 'rgba(64, 188, 244, 0.4)' : 'var(--border-subtle)',
                }}
              >
                <Clock size={14} />
                <span>{isWishlisted ? 'Saved' : 'Wishlist'}</span>
              </button>
            </div>

            {/* Interactive Rating Widget */}
            <div
              style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 12,
                marginTop: 4,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Your Rating
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <RatingStars
                  value={userRating}
                  onChange={handlePersonalRating}
                  interactive
                  size={22}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Details Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Title Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Link
                to={`/cheeses?maker=${encodeURIComponent(cheese.maker)}`}
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-secondary)',
                }}
              >
                {cheese.maker}
              </Link>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              {cheese.type && (
                <Link
                  to={`/cheeses?type=${encodeURIComponent(cheese.type.slug)}`}
                  className="tag-pill"
                >
                  {cheese.type.name} Style
                </Link>
              )}
            </div>

            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                marginBottom: 10,
              }}
            >
              {cheese.name}
            </h1>

            {/* Specs Line */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              <span>Maker: <strong style={{ color: 'var(--text-primary)' }}>{cheese.maker}</strong></span>
              <span>•</span>
              <span>Type: <strong style={{ color: 'var(--text-primary)' }}>{cheese.type?.name || 'Unspecified'}</strong></span>
              {cheese.fatPercentage !== null && cheese.fatPercentage !== undefined && (
                <>
                  <span>•</span>
                  <span>Fat Content: <strong style={{ color: 'var(--accent-gold)' }}>{cheese.fatPercentage}%</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Aggregate Community Score Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '14px 18px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={24} fill="var(--accent-gold)" stroke="none" />
                {cheese.stats?.avgRating ? cheese.stats.avgRating.toFixed(1) : '—'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Average of {cheese.stats?.logsCount || 0} {cheese.stats?.logsCount === 1 ? 'log' : 'logs'}
              </div>
            </div>

            <div style={{ flex: 1, borderLeft: '1px solid var(--border-subtle)', paddingLeft: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                Ratings Distribution
              </div>
              <HistogramChart distribution={cheese.stats?.ratingHistogram} totalCount={cheese.stats?.logsCount} />
            </div>
          </div>

          {/* Wikipedia Style Educational Summary */}
          {cheese.type?.description && (
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                  About {cheese.type.name} Cheese Style
                </span>
                {cheese.type.wikipediaUrl && (
                  <a
                    href={cheese.type.wikipediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 11,
                      color: 'var(--accent-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    Wikipedia <ExternalLink size={11} />
                  </a>
                )}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {cheese.description || cheese.type.description}
              </p>
            </div>
          )}

          {/* Community Reviews Section */}
          <div style={{ marginTop: 10 }}>
            <div className="section-heading">
              <span>Reviews ({cheese.recentReviews?.length || 0})</span>
              <button
                onClick={() => openLogModal(cheese)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-blue)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Write a review
              </button>
            </div>

            {cheese.recentReviews && cheese.recentReviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {cheese.recentReviews.map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Link to={`/users/${rev.user.username}`}>
                          {rev.user.avatarUrl ? (
                            <img
                              src={rev.user.avatarUrl}
                              alt={rev.user.displayName}
                              style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 28,
                                height: 28,
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
                            to={`/users/${rev.user.username}`}
                            style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}
                          >
                            {rev.user.displayName}
                          </Link>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            @{rev.user.username} • {new Date(rev.consumedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RatingStars value={rev.rating} size={14} />
                        {rev.isLiked && <Heart size={14} fill="var(--accent-orange)" color="var(--accent-orange)" />}
                      </div>
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {rev.reviewText}
                    </p>

                    {rev.photoUrl && (
                      <div style={{ marginTop: 4 }}>
                        <img
                          src={rev.photoUrl}
                          alt="Review attachment"
                          style={{ maxHeight: 180, borderRadius: 4, objectFit: 'cover' }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '30px 0',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                No reviews yet. Be the first to review {cheese.name}!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
