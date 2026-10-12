import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Clock, Star } from 'lucide-react';
import { Cheese, api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PosterCardProps {
  cheese: Cheese;
  showDetails?: boolean;
}

export const PosterCard: React.FC<PosterCardProps> = ({
  cheese,
  showDetails = false,
}) => {
  const { user, openLogModal, openAuthModal } = useAuth();
  const [isLiked, setIsLiked] = useState<boolean>(cheese.userState?.isLiked || false);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(cheese.userState?.isWishlisted || false);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openAuthModal('signin');
      return;
    }
    // Toggle like via log or fast state
    setIsLiked(!isLiked);
  };

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openAuthModal('signin');
      return;
    }
    try {
      const nextState = !isWishlisted;
      setIsWishlisted(nextState);
      await api.toggleWishlist(cheese.id);
    } catch (err) {
      setIsWishlisted(isWishlisted);
    }
  };

  const handleLogClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openLogModal(cheese);
  };

  const imageUrl = cheese.imageUrl || cheese.type?.thumbnailUrl;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Link to={`/cheeses/${cheese.slug}`} className="poster-card">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${cheese.maker} ${cheese.name}`}
            className="poster-image"
            loading="lazy"
          />
        ) : (
          <div className="poster-placeholder">
            <span className="badge">{cheese.type?.name || 'Cheese'}</span>
            <span className="title">{cheese.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              {cheese.maker}
            </span>
          </div>
        )}

        {/* Hover Shroud Overlay (Letterboxd Style) */}
        <div className="poster-shroud">
          <div className="shroud-actions">
            <button
              className="shroud-action-btn"
              title="Log or Review this Cheese"
              onClick={handleLogClick}
            >
              <Eye size={15} />
            </button>
            <button
              className={`shroud-action-btn ${isLiked ? 'active-like' : ''}`}
              title={isLiked ? 'Liked' : 'Like'}
              onClick={handleLikeClick}
            >
              <Heart size={15} fill={isLiked ? 'var(--accent-orange)' : 'none'} />
            </button>
            <button
              className={`shroud-action-btn ${isWishlisted ? 'active-wish' : ''}`}
              title={isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
              onClick={handleWishlistClick}
            >
              <Clock size={15} />
            </button>
          </div>

          <div className="shroud-details">
            <div className="shroud-maker">{cheese.maker}</div>
            <div className="shroud-title">{cheese.name}</div>
            {cheese.stats?.avgRating && (
              <div className="shroud-rating">
                <Star size={12} fill="var(--accent-gold)" stroke="none" />
                <span>{cheese.stats.avgRating.toFixed(1)}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 400 }}>
                  ({cheese.stats.logsCount})
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {showDetails && (
        <div style={{ padding: '0 2px' }}>
          <Link
            to={`/cheeses/${cheese.slug}`}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.25,
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {cheese.name}
          </Link>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              marginTop: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{cheese.maker}</span>
            {cheese.stats?.avgRating && (
              <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>
                ★ {cheese.stats.avgRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
