import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, ListOrdered, X } from 'lucide-react';
import { api, CustomList, Cheese } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PosterCard } from '../components/PosterCard';

export const ListsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, openAuthModal } = useAuth();

  const [lists, setLists] = useState<CustomList[]>([]);
  const [selectedList, setSelectedList] = useState<CustomList | null>(null);
  const [loading, setLoading] = useState(true);

  // Create List Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isRanked, setIsRanked] = useState(true);
  const [selectedCheeseIds, setSelectedCheeseIds] = useState<string[]>([]);
  const [catalogCheeses, setCatalogCheeses] = useState<Cheese[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (id) {
          const res = await api.getList(id);
          setSelectedList(res.list);
        } else {
          const res = await api.getLists();
          setLists(res.lists);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const openCreateModal = async () => {
    if (!user) {
      openAuthModal('signin');
      return;
    }
    setCreateModalOpen(true);
    try {
      const res = await api.getCheeses({ limit: 40 });
      setCatalogCheeses(res.items);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createList({
        title,
        description,
        isRanked,
        cheeseIds: selectedCheeseIds,
      });
      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setSelectedCheeseIds([]);
      const res = await api.getLists();
      setLists(res.lists);
    } catch (e: any) {
      alert(e.message || 'Failed to create list');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCheeseSelection = (cheeseId: string) => {
    if (selectedCheeseIds.includes(cheeseId)) {
      setSelectedCheeseIds(selectedCheeseIds.filter((cid) => cid !== cheeseId));
    } else {
      setSelectedCheeseIds([...selectedCheeseIds, cheeseId]);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading lists...
      </div>
    );
  }

  // Single List Detail View
  if (id && selectedList) {
    return (
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/lists" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            ← All Lists
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>
              {selectedList.title}
            </h1>
            {selectedList.isRanked && (
              <span className="tag-pill" style={{ color: 'var(--accent-gold)' }}>
                <ListOrdered size={12} /> Ranked
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Created by{' '}
            <Link to={`/users/${selectedList.user.username}`} style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
              {selectedList.user.displayName}
            </Link>{' '}
            • {selectedList.items?.length || 0} cheeses
          </div>
          {selectedList.description && (
            <p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: 14, maxWidth: 640 }}>
              {selectedList.description}
            </p>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 20,
          }}
        >
          {selectedList.items?.map((item) => (
            <div key={item.id} style={{ position: 'relative' }}>
              {selectedList.isRanked && (
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    zIndex: 5,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    color: 'var(--accent-gold)',
                    fontWeight: 800,
                    fontSize: 13,
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(229, 169, 59, 0.5)',
                  }}
                >
                  {item.position}
                </div>
              )}
              <PosterCard cheese={item.cheese} showDetails />
              {item.notes && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                  "{item.notes}"
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Lists Gallery View
  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Curated Cheese Lists</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Ranked lineups and themed selections from the community
          </div>
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={15} /> Start a New List
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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
            {/* 5-Poster Fanned Preview Stack */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                height: 110,
                borderRadius: 4,
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {list.title}
                </h3>
                {list.isRanked && (
                  <span style={{ fontSize: 10, color: 'var(--accent-gold)', fontWeight: 700 }}>
                    #RANKED
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                by {list.user.displayName} • {list.itemsCount} cheeses
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Create List Modal */}
      {createModalOpen && (
        <div className="modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New List</h3>
              <button className="modal-close-btn" onClick={() => setCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateList}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    List Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Best Cheeses for Grilled Cheese or Top Cottage Cheeses Ranked"
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 4, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Brief intro for your list..."
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 4, outline: 'none' }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isRanked}
                    onChange={(e) => setIsRanked(e.target.checked)}
                  />
                  <span>Ranked list (numbered 1, 2, 3...)</span>
                </label>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Select Cheeses to Include ({selectedCheeseIds.length} selected)
                  </label>
                  <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {catalogCheeses.map((c) => {
                      const isSelected = selectedCheeseIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleCheeseSelection(c.id)}
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
                            {isSelected ? '✓ Added' : '+ Add'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Save List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
