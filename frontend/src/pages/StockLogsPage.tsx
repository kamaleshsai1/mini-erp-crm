import React, { useEffect, useState } from 'react';
import { Search, ArrowDownRight, ArrowUpRight, History, Calendar, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';
import { StockMovementLog } from '../types';
import { useToast } from '../context/ToastContext';

export const StockLogsPage: React.FC = () => {
  const { error } = useToast();
  const [logs, setLogs] = useState<StockMovementLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [movementFilter, setMovementFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getStockLogs({
        search,
        movementType: movementFilter,
      });
      setLogs(data);
    } catch (err: any) {
      error(err.message || 'Failed to fetch inventory logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, movementFilter]);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Movement Audit Trail</h1>
          <p className="page-subtitle">Immutable chronological log of all stock receipts, challan deductions, and adjustments (ERP Inventory Audit)</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '380px' }}>
          <Search
            size={18}
            color="#94a3b8"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search by SKU (Stock Keeping Unit), product name, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Movement Type:</span>
          <select
            value={movementFilter}
            onChange={(e) => setMovementFilter(e.target.value)}
            className="form-select"
            style={{ width: '140px' }}
          >
            <option value="ALL">All Movements</option>
            <option value="IN">Stock IN (+)</option>
            <option value="OUT">Stock OUT (-)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Movement</th>
              <th>Product Details</th>
              <th style={{ textAlign: 'right' }}>Quantity</th>
              <th>Reason & Audit Notes</th>
              <th>Logged By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Loading stock movements...
                </td>
              </tr>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                      {new Date(log.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {new Date(log.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${log.movementType === 'IN' ? 'badge-success' : 'badge-danger'}`}
                    >
                      {log.movementType === 'IN' ? (
                        <>
                          <ArrowDownRight size={13} /> Stock IN
                        </>
                      ) : (
                        <>
                          <ArrowUpRight size={13} /> Stock OUT
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.product?.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      SKU (Stock Keeping Unit): <code>{log.product?.sku}</code> • {log.product?.location}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '15px' }}>
                    <span style={{ color: log.movementType === 'IN' ? '#047857' : '#b91c1c' }}>
                      {log.movementType === 'IN' ? `+${log.quantityChanged}` : `-${log.quantityChanged}`}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#334155', maxWidth: '300px' }}>
                      {log.reason}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <UserIcon size={14} color="#64748b" />
                      <span>{log.createdByUser?.name || 'System Worker'}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Role: {log.createdByUser?.role || 'SYSTEM'}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                  No stock movements recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
