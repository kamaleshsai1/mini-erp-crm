import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Trash2,
  X,
  AlertCircle,
  Eye,
  Building,
} from 'lucide-react';
import { api } from '../services/api';
import { Customer, Product, SalesChallan } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

interface ChallanItemInput {
  productId: string;
  quantity: number;
}

export const ChallansPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [challanItems, setChallanItems] = useState<ChallanItemInput[]>([]);
  const [creationStatus, setCreationStatus] = useState<'DRAFT' | 'CONFIRMED'>('DRAFT');
  const [submitting, setSubmitting] = useState(false);

  // Detail & Print modal state
  const [selectedChallan, setSelectedChallan] = useState<SalesChallan | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const data = await api.getChallans({
        search,
        status: statusFilter,
      });
      setChallans(data);
    } catch (err: any) {
      error(err.message || 'Failed to fetch sales challans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [search, statusFilter]);

  const openCreateModal = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.getCustomers({ limit: 100 }),
        api.getProducts({ limit: 100 }),
      ]);
      setCustomers(custRes);
      setProducts(prodRes);

      setSelectedCustomerId(custRes.length > 0 ? custRes[0].id : '');
      if (prodRes.length > 0) {
        setChallanItems([{ productId: prodRes[0].id, quantity: 1 }]);
      } else {
        setChallanItems([]);
      }
      setCreationStatus('DRAFT');
      setIsCreateModalOpen(true);
    } catch (err: any) {
      error('Failed to load customers or products for challan');
    }
  };

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    setChallanItems([...challanItems, { productId: products[0].id, quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (challanItems.length <= 1) {
      warning('A sales challan must contain at least one line item');
      return;
    }
    setChallanItems(challanItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: any) => {
    const updated = [...challanItems];
    updated[index] = {
      ...updated[index],
      [field]: field === 'quantity' ? Math.max(1, parseInt(value, 10) || 1) : value,
    };
    setChallanItems(updated);
  };

  const calculateTotals = () => {
    let totalQty = 0;
    let totalAmt = 0;

    challanItems.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        totalQty += item.quantity;
        totalAmt += prod.unitPrice * item.quantity;
      }
    });

    return { totalQty, totalAmt };
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      error('Please select a customer');
      return;
    }

    if (challanItems.length === 0) {
      error('Please add at least one line item');
      return;
    }

    // Pre-validate stock locally for CONFIRMED status
    if (creationStatus === 'CONFIRMED') {
      for (const item of challanItems) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod && prod.currentStock < item.quantity) {
          error(
            `Insufficient stock for '${prod.name}'! Available: ${prod.currentStock}, Requested: ${item.quantity}. Reduce quantity or save as Draft.`
          );
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const created = await api.createChallan({
        customerId: selectedCustomerId,
        status: creationStatus,
        items: challanItems,
      });

      success(
        creationStatus === 'CONFIRMED'
          ? `Challan ${created.challanNumber} confirmed & stock deducted!`
          : `Draft challan ${created.challanNumber} saved successfully`
      );

      setIsCreateModalOpen(false);
      fetchChallans();
    } catch (err: any) {
      error(err.message || 'Failed to create sales challan');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetailModal = async (ch: SalesChallan) => {
    try {
      const detailed = await api.getChallanById(ch.id);
      setSelectedChallan(detailed);
      setIsDetailModalOpen(true);
    } catch (err: any) {
      error('Failed to load challan details');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'CONFIRMED' | 'CANCELLED') => {
    try {
      await api.updateChallanStatus(id, status);
      success(`Challan updated to ${status}`);
      // Refresh current
      if (selectedChallan && selectedChallan.id === id) {
        const refreshed = await api.getChallanById(id);
        setSelectedChallan(refreshed);
      }
      fetchChallans();
    } catch (err: any) {
      error(err.message || 'Failed to update challan status');
    }
  };

  const openPrintInvoice = (id: string) => {
    const token = localStorage.getItem('token');
    // Open printable HTML page generated by server
    window.open(`/api/challans/${id}/invoice-html?token=${token}`, '_blank');
  };

  const canCreateChallan = user?.role === 'ADMIN' || user?.role === 'SALES';
  const { totalQty, totalAmt } = calculateTotals();

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Challans & Invoices</h1>
          <p className="page-subtitle">Dispatch orders, auto-reduce inventory on confirmation, and generate tax invoices (ERP Sales & Billing)</p>
        </div>
        {canCreateChallan && (
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={18} /> New Sales Challan
          </button>
        )}
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
            placeholder="Search by challan #, customer, or business..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ width: '150px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed (Dispatched)</option>
            <option value="DRAFT">Draft</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Challans Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Challan #</th>
              <th>Customer & Destination</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Units</th>
              <th style={{ textAlign: 'right' }}>Total Amount</th>
              <th>Generated By</th>
              <th>Date</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Loading sales challans...
                </td>
              </tr>
            ) : challans.length > 0 ? (
              challans.map((ch) => (
                <tr key={ch.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: '#2563eb' }}>{ch.challanNumber}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {ch.items?.length || 0} line item(s)
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                      {ch.customer?.businessName || ch.customer?.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Attn: {ch.customer?.name}
                    </div>
                  </td>
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
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{ch.totalQuantity}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '15px' }}>
                    ₹{ch.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{ch.createdByUser?.name || 'Staff'}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Role: {ch.createdByUser?.role || 'SALES'}
                    </div>
                  </td>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>
                    {new Date(ch.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        onClick={() => openDetailModal(ch)}
                        className="btn btn-outline btn-sm"
                        title="View Challan Details"
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        onClick={() => openPrintInvoice(ch.id)}
                        className="btn btn-outline btn-sm"
                        title="Print / Save PDF Invoice"
                        style={{ color: '#2563eb', borderColor: '#bfdbfe' }}
                      >
                        <Printer size={13} /> PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                  No sales challans found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Sales Challan Modal */}
      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Create Sales Challan</h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Challan number will be generated automatically upon submission.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateChallan}>
              <div className="modal-body" style={{ maxHeight: '70vh' }}>
                {/* Customer Selector */}
                <div className="form-group">
                  <label className="form-label">Select Customer / Wholesale Buyer *</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="form-select"
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.businessName} ({c.name} - {c.mobile}) [{c.customerType}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Line Items Table */}
                <div style={{ marginTop: '20px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Products to Dispatch (Line Items) *
                    </label>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="btn btn-outline btn-sm"
                      style={{ color: '#2563eb', borderColor: '#bfdbfe' }}
                    >
                      <Plus size={14} /> Add Product Line
                    </button>
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Product</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', width: '110px' }}>Available Stock</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', width: '110px' }}>Unit Price</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', width: '110px' }}>Qty</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', width: '120px' }}>Subtotal</th>
                          <th style={{ width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {challanItems.map((item, idx) => {
                          const prod = products.find((p) => p.id === item.productId);
                          const subtotal = prod ? prod.unitPrice * item.quantity : 0;
                          const isShort = prod ? item.quantity > prod.currentStock : false;

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 12px' }}>
                                <select
                                  value={item.productId}
                                  onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                                  className="form-select"
                                  style={{ padding: '6px 8px', fontSize: '13px' }}
                                >
                                  {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} [{p.sku}]
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <span
                                  className={`badge ${
                                    (prod?.currentStock || 0) === 0
                                      ? 'badge-danger'
                                      : isShort
                                      ? 'badge-warning'
                                      : 'badge-neutral'
                                  }`}
                                >
                                  {prod?.currentStock ?? 0} units
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#475569' }}>
                                ₹{prod?.unitPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                  className="form-input"
                                  style={{
                                    width: '80px',
                                    padding: '4px 8px',
                                    textAlign: 'center',
                                    borderColor: isShort && creationStatus === 'CONFIRMED' ? '#ef4444' : undefined,
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                                ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemRow(idx)}
                                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                  title="Remove line"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Box */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>Line Items: {challanItems.length}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
                      Total Dispatch Quantity: {totalQty} units
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Estimated Subtotal</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb' }}>
                      ₹{totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Challan Status Option */}
                <div className="form-group">
                  <label className="form-label">Challan Creation Mode *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: `2px solid ${creationStatus === 'DRAFT' ? '#2563eb' : '#e2e8f0'}`,
                        backgroundColor: creationStatus === 'DRAFT' ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="challanStatus"
                        value="DRAFT"
                        checked={creationStatus === 'DRAFT'}
                        onChange={() => setCreationStatus('DRAFT')}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>Save as Draft</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Stock is not deducted yet. Reviewer or warehouse confirms later.
                        </div>
                      </div>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: `2px solid ${creationStatus === 'CONFIRMED' ? '#10b981' : '#e2e8f0'}`,
                        backgroundColor: creationStatus === 'CONFIRMED' ? '#ecfdf5' : '#ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="challanStatus"
                        value="CONFIRMED"
                        checked={creationStatus === 'CONFIRMED'}
                        onChange={() => setCreationStatus('CONFIRMED')}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#065f46' }}>
                          Confirm & Deduct Stock Now
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Atomically reduces inventory and logs outward stock movements.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Generating...' : creationStatus === 'CONFIRMED' ? 'Confirm & Deduct Stock' : 'Save Draft Challan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Challan Detail & Action Modal */}
      {isDetailModalOpen && selectedChallan && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{selectedChallan.challanNumber}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span
                    className={`badge ${
                      selectedChallan.status === 'CONFIRMED'
                        ? 'badge-success'
                        : selectedChallan.status === 'DRAFT'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    {selectedChallan.status}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Created: {new Date(selectedChallan.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh' }}>
              {/* Customer Box */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <div style={{ color: '#64748b' }}>Customer:</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                    {selectedChallan.customer.businessName}
                  </div>
                  <div>Attn: {selectedChallan.customer.name}</div>
                  <div>Phone: {selectedChallan.customer.mobile}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>Delivery Address:</div>
                  <div style={{ color: '#334155' }}>{selectedChallan.customer.address}</div>
                  {selectedChallan.customer.gstNumber && (
                    <div style={{ marginTop: '4px', fontWeight: 600 }}>
                      GSTIN (Goods & Services Tax ID): {selectedChallan.customer.gstNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Snapshot Line Items */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                  Snapshot Line Items
                </h3>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Product & Snapshot SKU (Stock Keeping Unit)</th>
                        <th style={{ textAlign: 'right' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Snapshot Unit Price</th>
                        <th style={{ textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedChallan.items.map((item, idx) => (
                        <tr key={item.id}>
                          <td style={{ color: '#94a3b8', width: '30px' }}>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{item.productNameSnapshot}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              SKU (Stock Keeping Unit): {item.skuSnapshot}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right' }}>
                            ₹{item.unitPriceSnapshot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            ₹{item.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Banner */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  padding: '12px 16px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Total Challan Amount</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#1d4ed8' }}>
                    ₹{selectedChallan.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => openPrintInvoice(selectedChallan.id)}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb' }}
              >
                <Printer size={15} /> Print / Save Invoice PDF
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                {selectedChallan.status === 'DRAFT' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedChallan.id, 'CONFIRMED')}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#10b981' }}
                  >
                    <CheckCircle2 size={16} /> Confirm & Deduct Stock
                  </button>
                )}

                {selectedChallan.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Cancel this sales challan? Any confirmed stock will be restored to inventory.')) {
                        handleUpdateStatus(selectedChallan.id, 'CANCELLED');
                      }
                    }}
                    className="btn btn-outline"
                    style={{ color: '#ef4444', borderColor: '#fecaca' }}
                  >
                    <XCircle size={16} /> Cancel Challan
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="btn btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
