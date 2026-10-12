import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { api, Cheese, CheeseType } from '../services/api';
import { PosterCard } from '../components/PosterCard';
import { useAuth } from '../context/AuthContext';

export const CheesesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, openAuthModal } = useAuth();

  const [cheeses, setCheeses] = useState<Cheese[]>([]);
  const [types, setTypes] = useState<CheeseType[]>([]);
  const [makers, setMakers] = useState<Array<{ name: string; cheeseCount: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Add Cheese Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMaker, setNewMaker] = useState('');
  const [newTypeName, setNewTypeName] = useState('Cottage');
  const [newFat, setNewFat] = useState<string>('');
  const [newImage, setNewImage] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const query = searchParams.get('q') || '';
  const currentType = searchParams.get('type') || '';
  const currentMaker = searchParams.get('maker') || '';
  const currentSort = searchParams.get('sort') || 'popular';
  const currentFat = searchParams.get('fat') || '';

  useEffect(() => {
    async function loadMeta() {
      try {
        const [typesRes, makersRes] = await Promise.all([
          api.getCheeseTypes(),
          api.getMakers(),
        ]);
        setTypes(typesRes.types);
        setMakers(makersRes.makers);
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    async function loadCheeses() {
      setLoading(true);
      try {
        let minFat: number | undefined;
        let maxFat: number | undefined;

        if (currentFat === 'low') {
          maxFat = 4.0;
        } else if (currentFat === 'mid') {
          minFat = 4.0;
          maxFat = 9.0;
        } else if (currentFat === 'high') {
          minFat = 9.1;
        }

        const res = await api.getCheeses({
          q: query || undefined,
          type: currentType || undefined,
          maker: currentMaker || undefined,
          sort: currentSort,
          minFat,
          maxFat,
          limit: 36,
        });

        setCheeses(res.items);
        setTotalCount(res.pagination.total);
      } catch (err) {
        console.error('Failed to load cheeses:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCheeses();
  }, [query, currentType, currentMaker, currentSort, currentFat]);

  const updateFilter = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams);
    if (!val) {
      next.delete(key);
    } else {
      next.set(key, val);
    }
    setSearchParams(next);
  };

  const handleAddCheese = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('signin');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createCheese({
        name: newName.trim(),
        maker: newMaker.trim(),
        typeName: newTypeName.trim(),
        fatPercentage: newFat ? parseFloat(newFat) : null,
        description: newDesc.trim() || undefined,
        imageUrl: newImage.trim() || undefined,
      });

      setAddModalOpen(false);
      setNewName('');
      setNewMaker('');
      setNewFat('');
      setNewImage('');
      setNewDesc('');

      // Refresh catalog
      const res = await api.getCheeses({ limit: 36 });
      setCheeses(res.items);
    } catch (err: any) {
      alert(err.message || 'Failed to add cheese');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
      {/* Header and Add Cheese Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            Browse Cheeses
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Explore {totalCount} cheeses by brand, style, or fat percentage
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => {
            if (!user) {
              openAuthModal('signin');
            } else {
              setAddModalOpen(true);
            }
          }}
        >
          <Plus size={15} /> Add Missing Cheese
        </button>
      </div>

      {/* Filter / Subnav Bar (Letterboxd Style) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 16px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 24,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {/* Style / Type Filter */}
          <select
            value={currentType}
            onChange={(e) => updateFilter('type', e.target.value)}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 600,
              outline: 'none',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">All Styles (Cottage, Cheddar...)</option>
            {types.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Maker / Brand Filter */}
          <select
            value={currentMaker}
            onChange={(e) => updateFilter('maker', e.target.value)}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 600,
              outline: 'none',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">All Makers / Brands</option>
            {makers.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} ({m.cheeseCount})
              </option>
            ))}
          </select>

          {/* Fat % Filter */}
          <select
            value={currentFat}
            onChange={(e) => updateFilter('fat', e.target.value)}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 600,
              outline: 'none',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Any Fat %</option>
            <option value="low">Under 4% Fat (Lowfat Cottage)</option>
            <option value="mid">4% to 9% Fat (Classic Cottage)</option>
            <option value="high">Over 9% Fat (Rich Curd)</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Sort By:
          </span>
          <select
            value={currentSort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 600,
              outline: 'none',
              color: 'var(--text-primary)',
            }}
          >
            <option value="popular">Most Logged</option>
            <option value="rating">Highest Rated</option>
            <option value="name">Alphabetical</option>
            <option value="newest">Recently Added</option>
          </select>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {(query || currentType || currentMaker || currentFat) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active filters:</span>
          {query && (
            <span className="tag-pill">
              Search: "{query}" <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter('q', '')} />
            </span>
          )}
          {currentType && (
            <span className="tag-pill">
              Style: {currentType} <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter('type', '')} />
            </span>
          )}
          {currentMaker && (
            <span className="tag-pill">
              Maker: {currentMaker} <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter('maker', '')} />
            </span>
          )}
          {currentFat && (
            <span className="tag-pill">
              Fat Filter <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter('fat', '')} />
            </span>
          )}
          <button
            onClick={() => setSearchParams({})}
            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: 12, cursor: 'pointer' }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Cheese Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading catalog...
        </div>
      ) : cheeses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', backgroundColor: 'var(--bg-surface)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🧀</div>
          <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>No cheeses matched your filter</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
            Try broadening your search or add this missing cheese to the database!
          </p>
          <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}>
            <Plus size={15} /> Add This Cheese
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 20,
          }}
        >
          {cheeses.map((cheese) => (
            <PosterCard key={cheese.id} cheese={cheese} showDetails />
          ))}
        </div>
      )}

      {/* Add Missing Cheese Modal */}
      {addModalOpen && (
        <div className="modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Missing Cheese to Catalog</h3>
              <button className="modal-close-btn" onClick={() => setAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCheese}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Cheese Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Classic 5% Cottage Cheese or Clothbound Cheddar"
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 4, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Maker / Brand *
                    </label>
                    <input
                      type="text"
                      required
                      value={newMaker}
                      onChange={(e) => setNewMaker(e.target.value)}
                      placeholder="e.g. Tnuva, Cabot, Kerrygold"
                      style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 4, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Style / Type *
                    </label>
                    <input
                      type="text"
                      required
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder="e.g. Cottage, Cheddar, Gouda"
                      style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 4, outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Fat Percentage (Optional - e.g. 5.0 for 5% Cottage)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={newFat}
                    onChange={(e) => setNewFat(e.target.value)}
                    placeholder="e.g. 5.0 or 9.0"
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 4, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="https://.../photo.jpg"
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 4, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Specific Notes / Description (Optional)
                  </label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Wikipedia summary will be auto-attached for the cheese style if left blank."
                    rows={3}
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 4, outline: 'none', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Save to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
