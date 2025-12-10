import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type Item = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  flavor: string;
  available_count: number;
};

const CATEGORIES = ['Cone', 'Cup', 'Sundae', 'Stick'];
const FLAVORS = ['Vanilla', 'Chocolate', 'Strawberry', 'Mint'];

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFlavor, setSelectedFlavor] = useState('');

  // Admin-only: we only manage stock here. Creation/deletion are disabled.

  async function loadItems() {
    try {
        const data = await api('/menu/items/all');
      setItems(data.items || []);
    } catch (e) {
      alert('Failed to load items: ' + (e as Error).message);
    }
  }

    // Item creation is disabled for this admin: only stock adjustments are allowed.

  async function updateCount(id: number) {
    // Prompt for a delta value (can be negative) to adjust stock
    const deltaStr = prompt('Adjust stock by (use negative to decrement), e.g. 5 or -2:');
    if (!deltaStr) return;
    const delta = parseInt(deltaStr);
    if (Number.isNaN(delta)) return alert('Invalid number');
    try {
      await api(`/menu/items/${id}/stock`, {
        method: 'PUT',
        body: JSON.stringify({ delta }),
      });
      await loadItems();
    } catch (e) {
      alert('Update failed: ' + (e as Error).message);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    let filtered = items;
    if (selectedCategory) {
      filtered = filtered.filter(i => i.category === selectedCategory);
    }
    if (selectedFlavor) {
      filtered = filtered.filter(i => i.flavor === selectedFlavor);
    }
    setFilteredItems(filtered);
  }, [items, selectedCategory, selectedFlavor]);

  const matches = filteredItems.length;
  const highestCount = Math.max(1, ...items.map(i => i.available_count));

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Inventory Intelligence</p>
          <h2>Menu Availability</h2>
          <p className="muted">Live look at every flavor family plus quick adjustments.</p>
        </div>
        <div className="page-actions">
          <button className="ghost" onClick={loadItems}>Refresh Sync</button>
          <div className="metric-pill">
            <span>Visible items</span>
            <strong>{matches.toString().padStart(2, '0')}</strong>
          </div>
        </div>
      </div>

      <div className="filters card glass">
        <div>
          <label>Category</label>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Flavor</label>
          <select value={selectedFlavor} onChange={e => setSelectedFlavor(e.target.value)}>
            <option value="">All flavors</option>
            {FLAVORS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="filters-summary">
          <p>Filters combine in real-time. Reset to show everything.</p>
          <button className="pill-btn" onClick={() => { setSelectedCategory(''); setSelectedFlavor(''); }}>
            Clear filters
          </button>
        </div>
      </div>

      <div className="card glass scroll-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Price</th>
              <th>Category</th>
              <th>Flavor</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(i => (
              <tr key={i.id}>
                <td className="mono muted">{i.id}</td>
                <td>
                  <div className="cell-title">{i.name}</div>
                  <span className="muted tiny">{i.description}</span>
                </td>
                <td>Rs {Number(i.price).toFixed(0)}</td>
                <td><span className="pill subtle">{i.category}</span></td>
                <td><span className="pill subtle">{i.flavor}</span></td>
                <td>
                  <div className="availability-bar">
                    <span style={{ width: `${Math.round((i.available_count / highestCount) * 100)}%` }} />
                  </div>
                  <strong>{i.available_count}</strong>
                </td>
                <td>
                  <button className="primary" onClick={() => updateCount(i.id)}>Adjust stock</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!filteredItems.length && (
          <div className="empty">
            <p>No items match these filters yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
