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

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [stockItem, setStockItem] = useState<Item | null>(null);
  const [stockDelta, setStockDelta] = useState(0);

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

  function openAdjustModal(item: Item) {
    setStockItem(item);
    setStockDelta(0);
  }

  function closeAdjustModal() {
    setStockItem(null);
    setStockDelta(0);
  }

  async function saveAdjust() {
    if (!stockItem) return;
    if (!stockDelta) {
      alert('Set an adjustment before saving.');
      return;
    }
    try {
      await api(`/menu/items/${stockItem.id}/stock?quantity=${stockDelta}`, {
        method: 'PUT',
      });
      await loadItems();
      closeAdjustModal();
    } catch (e) {
      alert('Update failed: ' + (e as Error).message);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const highestCount = Math.max(1, ...items.map(i => i.available_count));

  return (
    <section className="page">
      <div className="card glass scroll-card">
        <table className="data-table items-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id}>
                <td className="mono muted">{i.id}</td>
                <td>{i.name}</td>
                <td>Rs {Number(i.price).toFixed(0)}</td>
                <td>
                  <div className="availability-bar">
                    <span style={{ width: `${Math.round((i.available_count / highestCount) * 100)}%` }} />
                  </div>
                  <strong>{i.available_count}</strong>
                </td>
                <td>
                  <button className="primary" onClick={() => openAdjustModal(i)}>Adjust stock</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!items.length && (
          <div className="empty">
            <p>No items available.</p>
          </div>
        )}
      </div>

      {stockItem && (
        <div className="modal-overlay" onClick={closeAdjustModal}>
          <div className="card glass modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="mono tiny muted">Item #{stockItem.id}</p>
                <h3>{stockItem.name}</h3>
              </div>
              <button type="button" className="ghost" onClick={closeAdjustModal}>Close</button>
            </div>

            <div className="modal-meta">
              <div>
                <dt>Current stock</dt>
                <dd>{stockItem.available_count}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>Rs {Number(stockItem.price).toFixed(0)}</dd>
              </div>
            </div>

            <div className="stock-stepper">
              <button type="button" className="ghost" onClick={() => setStockDelta(d => d - 1)}>-</button>
              <input
                type="number"
                value={stockDelta}
                onChange={e => {
                  const val = Number(e.target.value);
                  setStockDelta(Number.isNaN(val) ? 0 : Math.trunc(val));
                }}
              />
              <button type="button" className="ghost" onClick={() => setStockDelta(d => d + 1)}>+</button>
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost" onClick={closeAdjustModal}>Cancel</button>
              <button type="button" className="primary" onClick={saveAdjust}>Save</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
