import React, { useState, useEffect } from 'react';
import { X, Heart, Calendar, Image as ImageIcon, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, Cheese } from '../services/api';
import { RatingStars } from './RatingStars';

export const QuickLogModal: React.FC = () => {
  const { logModalOpen, closeLogModal, activeCheeseForLog } = useAuth();

  const [selectedCheese, setSelectedCheese] = useState<Cheese | null>(null);
  const [rating, setRating] = useState<number>(3.5);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isFirstTaste, setIsFirstTaste] = useState<boolean>(true);
  const [reviewText, setReviewText] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [consumedAt, setConsumedAt] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search state when logging without a preselected cheese
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Cheese[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (activeCheeseForLog) {
      setSelectedCheese(activeCheeseForLog);
      if (activeCheeseForLog.userState?.userRating) {
        setRating(activeCheeseForLog.userState.userRating);
      } else {
        setRating(3.5);
      }
      setIsLiked(activeCheeseForLog.userState?.isLiked || false);
      setReviewText(activeCheeseForLog.userState?.userReview || '');
    } else {
      setSelectedCheese(null);
      setRating(3.5);
      setIsLiked(false);
      setReviewText('');
    }
    setError(null);
  }, [activeCheeseForLog, logModalOpen]);

  // Debounced search when no cheese selected
  useEffect(() => {
    if (selectedCheese || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.getCheeses({ q: searchQuery, limit: 5 });
        setSearchResults(res.items);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCheese]);

  if (!logModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCheese) {
      setError('Please select a cheese to log.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.logCheese({
        cheeseId: selectedCheese.id,
        rating,
        isLiked,
        isFirstTaste,
        reviewText: reviewText.trim() || null,
        photoUrl: photoUrl.trim() || null,
        consumedAt,
      });

      closeLogModal();
      // Trigger a page refresh or window custom event to re-fetch logs
      window.dispatchEvent(new CustomEvent('cheeseboxd:log-created'));
    } catch (err: any) {
      setError(err.message || 'Failed to save log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeLogModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Log Cheese</h3>
          <button className="modal-close-btn" onClick={closeLogModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

            {/* Cheese Selection Header */}
            {selectedCheese ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {selectedCheese.imageUrl || selectedCheese.type?.thumbnailUrl ? (
                  <img
                    src={selectedCheese.imageUrl || selectedCheese.type?.thumbnailUrl || ''}
                    alt={selectedCheese.name}
                    style={{ width: 44, height: 60, objectFit: 'cover', borderRadius: 3 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 44,
                      height: 60,
                      backgroundColor: '#27313a',
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    🧀
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedCheese.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {selectedCheese.maker} • {selectedCheese.type?.name}
                    {selectedCheese.fatPercentage && ` (${selectedCheese.fatPercentage}%)`}
                  </div>
                </div>
                {!activeCheeseForLog && (
                  <button
                    type="button"
                    onClick={() => setSelectedCheese(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Change
                  </button>
                )}
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
                  Select Cheese
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by cheese or brand (e.g. Cabot, Cottage, Brie)..."
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      outline: 'none',
                    }}
                    autoFocus
                  />
                  <Search
                    size={16}
                    style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }}
                  />
                </div>

                {/* Dropdown Results */}
                {searchResults.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: 4,
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-focus)',
                      borderRadius: 'var(--radius-sm)',
                      zIndex: 10,
                      maxHeight: 220,
                      overflowY: 'auto',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    {searchResults.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCheese(c)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border-subtle)',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          by {c.maker}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Date Consumed */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
                Date Consumed
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} color="var(--text-muted)" />
                <input
                  type="date"
                  value={consumedAt}
                  onChange={(e) => setConsumedAt(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              </div>
            </div>

            {/* Rating Stars & Like */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Rating (0–5 Stars)
                </div>
                <RatingStars value={rating} onChange={setRating} interactive size={24} />
              </div>

              <button
                type="button"
                onClick={() => setIsLiked(!isLiked)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: isLiked ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                  backgroundColor: isLiked ? 'rgba(255, 128, 0, 0.15)' : 'transparent',
                  color: isLiked ? 'var(--accent-orange)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
              >
                <Heart size={16} fill={isLiked ? 'var(--accent-orange)' : 'none'} />
                <span>Like</span>
              </button>
            </div>

            {/* First Taste Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={!isFirstTaste}
                onChange={(e) => setIsFirstTaste(!e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>I've tasted this cheese before (repeat taste)</span>
            </label>

            {/* Review Box */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
                Review / Tasting Notes
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did it taste like? Sharpness, moisture, crunch crystals, pairings..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>

            {/* Optional Photo URL */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
                <ImageIcon size={14} /> Photo URL (Optional)
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://.../my_cheese_cut.jpg"
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
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeLogModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
