import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Users,
  AlertTriangle,
  FileCheck2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '../types';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="page-body" style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Loading operations dashboard...</div>
      </div>
    );
  }

  const metrics = stats?.metrics;

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations Overview</h1>
          <p className="page-subtitle">Real-time Enterprise Resource Planning (ERP) metrics: wholesale orders, inventory, and Customer Relationship Management (CRM)</p>
        </div>
      </div>

      {/* KPI (Key Performance Indicators) Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Confirmed Revenue</div>
            <div className="stat-value" style={{ color: '#2563eb' }}>
              ₹{metrics?.totalRevenue?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              From {metrics?.confirmedChallansCount || 0} confirmed challans
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <DollarSign size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Customers (CRM - Customer Relationship Management)</div>
            <div className="stat-value">
              {metrics?.activeCustomers || 0}
              <span style={{ fontSize: '16px', fontWeight: 500, color: '#94a3b8' }}> / {metrics?.totalCustomers || 0}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
              {metrics?.leadCustomers || 0} prospective leads
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Stock Status</div>
            <div className="stat-value" style={{ color: (metrics?.lowStockCount || 0) > 0 ? '#ef4444' : '#10b981' }}>
              {metrics?.lowStockCount || 0}
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginLeft: '6px' }}>
                Low Stock
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Across {metrics?.totalProducts || 0} total catalog items
            </div>
          </div>
          <div
            className="stat-icon-wrapper"
            style={{
              backgroundColor: (metrics?.lowStockCount || 0) > 0 ? '#fef2f2' : '#ecfdf5',
              color: (metrics?.lowStockCount || 0) > 0 ? '#ef4444' : '#10b981',
            }}
          >
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Challans Dispatched</div>
            <div className="stat-value">
              {metrics?.totalChallans || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
              {metrics?.draftChallansCount || 0} pending in draft
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
            <FileCheck2 size={24} />
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <AlertTriangle color="#b45309" size={24} />
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '14px' }}>
                Inventory Alert: {stats.lowStockAlerts.length} product(s) below minimum stock threshold!
              </div>
              <div style={{ fontSize: '13px', color: '#b45309', marginTop: '2px' }}>
                Immediate inward restocking recommended to avoid order dispatch delays.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="btn btn-sm btn-outline"
            style={{ borderColor: '#fde68a', color: '#92400e', backgroundColor: '#ffffff' }}
          >
            Manage Inventory <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Two Column Grid: Recent Challans & Recent Stock Movements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        {/* Recent Challans Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Recent Sales Challans</h3>
            <button
              onClick={() => onNavigate('challans')}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Challan #</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentChallans && stats.recentChallans.length > 0 ? (
                  stats.recentChallans.map((ch) => (
                    <tr key={ch.id}>
                      <td style={{ fontWeight: 700, color: '#2563eb' }}>{ch.challanNumber}</td>
                      <td>{ch.customer?.businessName || ch.customer?.name}</td>
                      <td>
                        <span
                          className={`badge ${
                            ch.status === 'CONFIRMED'
                              ? 'badge-success'
                              : ch.status === 'DRAFT'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {ch.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ₹{ch.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                      No sales challans recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Stock Movements Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Stock Movement Log</h3>
            <button
              onClick={() => onNavigate('stock-logs')}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Audit Trail <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Product</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentMovements && stats.recentMovements.length > 0 ? (
                  stats.recentMovements.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span
                          className={`badge ${log.movementType === 'IN' ? 'badge-success' : 'badge-danger'}`}
                        >
                          {log.movementType === 'IN' ? (
                            <>
                              <ArrowDownRight size={12} /> IN
                            </>
                          ) : (
                            <>
                              <ArrowUpRight size={12} /> OUT
                            </>
                          )}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{log.product?.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>SKU (Stock Keeping Unit): {log.product?.sku}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {log.movementType === 'IN' ? `+${log.quantityChanged}` : `-${log.quantityChanged}`}
                      </td>
                      <td style={{ fontSize: '12px', color: '#475569', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.reason}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                      No inventory movements recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
