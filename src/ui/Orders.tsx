import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type OrderItem = {
  name: string;
  qty: number;
  amount: number;
  price: number;
  code?: number;
};

type Order = {
  id: string;
  customer_name: string;
  items?: OrderItem[];
  total: number;
  status: string;
  created_at: string;
  updated_at?: string;
};

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Done', value: 'done' },
  { label: 'Cancelled', value: 'cancelled' },
];

const MUTATION_STATUSES = ['pending', 'done', 'cancelled'];

const formatStatusKey = (status: string) => {
  const normalized = (status || '').toLowerCase();
  return normalized.replace('canceled', 'cancelled').replace('cancled', 'cancelled');
};

const formatStatusLabel = (status: string) => {
  const key = formatStatusKey(status);
  if (!key) return 'Unknown';
  return key.charAt(0).toUpperCase() + key.slice(1);
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  async function load() {
    try {
      const data = await api('/orders');
      const arr = Array.isArray(data) ? data[0]?.orders || [] : data.orders || [];
      setOrders(arr);
    } catch (e) {
      alert('Failed to load orders: ' + (e as Error).message);
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      const key = formatStatusKey(status);
      if (key === 'cancelled') {
        await api('/orders/cancel', {
          method: 'POST',
          body: JSON.stringify({ order_id: id }),
        });
      } else {
        await api(`/orders/${id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status }),
        });
      }
      setActiveOrder(prev => (prev && prev.id === id ? { ...prev, status } : prev));
      await load();
    } catch (e) {
      alert('Status update failed: ' + (e as Error).message);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!activeOrder) return;
    const next = orders.find(o => o.id === activeOrder.id);
    if (!next) {
      setActiveOrder(null);
      return;
    }
    if (next !== activeOrder) {
      setActiveOrder(next);
    }
  }, [orders, activeOrder]);

  useEffect(() => {
    if (!activeOrder) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveOrder(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeOrder]);

  const filtered = statusFilter
    ? orders.filter(o => formatStatusKey(o.status) === statusFilter)
    : orders;

  function openOrder(order: Order) {
    setActiveOrder(order);
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="page-actions">
          <button type="button" className="ghost" onClick={load}>Reload</button>
        </div>
      </div>

      <div className="status-filters">
        {STATUS_FILTERS.map(filter => (
          <button
            key={filter.label}
            type="button"
            className={`filter-pill${statusFilter === filter.value ? ' active' : ''}`}
            onClick={() => setStatusFilter(curr => (curr === filter.value ? '' : filter.value))}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="orders-grid">
        {filtered.map(order => {
          const statusKey = formatStatusKey(order.status || '');
          return (
            <button
              key={order.id}
              type="button"
              className="order-row"
              onClick={() => openOrder(order)}
            >
              <span className="mono tiny muted">#{order.id}</span>
              <span className="order-row-name">{order.customer_name || 'Walk-in guest'}</span>
              <span className="order-row-total">Rs {Number(order.total || 0).toFixed(0)}</span>
              <span className={`pill status-pill status-${statusKey || 'unknown'}`}>
                {formatStatusLabel(order.status)}
              </span>
            </button>
          );
        })}
      </div>

      {!filtered.length && (
        <div className="card glass empty">
          <p>No orders match this view yet.</p>
        </div>
      )}

      {activeOrder && (
        <div className="modal-overlay" onClick={() => setActiveOrder(null)}>
          <div className="card glass modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <p className="mono tiny muted">Order #{activeOrder.id}</p>
                  <h3>{activeOrder.customer_name || 'Walk-in guest'}</h3>
                </div>
                <button type="button" className="ghost" onClick={() => setActiveOrder(null)}>Close</button>
              </div>

            <div className="modal-meta">
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={`pill status-pill status-${formatStatusKey(activeOrder.status) || 'unknown'}`}>
                    {formatStatusLabel(activeOrder.status)}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>Rs {Number(activeOrder.total || 0).toFixed(0)}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{new Date(activeOrder.created_at).toLocaleString()}</dd>
              </div>
              {activeOrder.updated_at && (
                <div>
                  <dt>Updated</dt>
                  <dd>{new Date(activeOrder.updated_at).toLocaleString()}</dd>
                </div>
              )}
            </div>

            <div className="modal-items">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Amount</th>
                    <th>Code</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeOrder.items || []).map((item, idx) => (
                    <tr key={`${item.code}-${idx}`}>
                      <td>{item.name}</td>
                      <td>{item.qty}</td>
                      <td>Rs {Number(item.price || 0).toFixed(0)}</td>
                      <td>Rs {Number(item.amount || 0).toFixed(0)}</td>
                      <td className="mono tiny muted">{item.code ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!activeOrder.items?.length && (
                <p className="muted tiny">No line items on this order.</p>
              )}
            </div>

            <div className="modal-actions">
              {MUTATION_STATUSES.map(status => (
                <button
                  key={status}
                  type="button"
                  className={formatStatusKey(activeOrder.status) === status ? 'primary' : 'ghost'}
                  onClick={() => setStatus(activeOrder.id, status)}
                  disabled={formatStatusKey(activeOrder.status) === status}
                >
                  Mark {formatStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
