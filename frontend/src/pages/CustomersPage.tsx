import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Building,
  Calendar,
  Eye,
  X,
  MessageSquarePlus,
  Clock,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { Customer, CustomerStatus, CustomerType } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'RETAIL' as CustomerType,
    address: '',
    status: 'ACTIVE' as CustomerStatus,
    followUpDate: '',
    notes: '',
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers({
        search,
        status: statusFilter,
        customerType: typeFilter,
      });
      setCustomers(res);
    } catch (err: any) {
      error(err.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, typeFilter]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'RETAIL',
      address: '',
      status: 'ACTIVE',
      followUpDate: '',
      notes: '',
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      mobile: c.mobile,
      email: c.email,
      businessName: c.businessName,
      gstNumber: c.gstNumber || '',
      customerType: c.customerType,
      address: c.address,
      status: c.status,
      followUpDate: c.followUpDate ? c.followUpDate.split('T')[0] : '',
      notes: c.notes || '',
    });
    setIsFormModalOpen(true);
  };

  const openDetailModal = async (c: Customer) => {
    try {
      const detailed = await api.getCustomerById(c.id);
      setSelectedCustomer(detailed);
      setIsDetailModalOpen(true);
    } catch (err: any) {
      error('Failed to load customer details');
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, formData);
        success('Customer details updated successfully');
      } else {
        await api.createCustomer(formData);
        success('New customer registered successfully');
      }
      setIsFormModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      error(err.message || 'Failed to save customer');
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete customer '${name}'?`)) return;
    try {
      await api.deleteCustomer(id);
      success('Customer deleted successfully');
      fetchCustomers();
    } catch (err: any) {
      error(err.message || 'Failed to delete customer');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newNote.trim()) return;

    setSavingNote(true);
    try {
      await api.addCustomerNote(selectedCustomer.id, newNote.trim());
      success('Follow-up note appended to customer timeline');
      setNewNote('');
      // Reload customer details
      const refreshed = await api.getCustomerById(selectedCustomer.id);
      setSelectedCustomer(refreshed);
    } catch (err: any) {
      error(err.message || 'Failed to add follow-up note');
    } finally {
      setSavingNote(false);
    }
  };

  const canManageCustomers = user?.role === 'ADMIN' || user?.role === 'SALES';

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Relationship Management (CRM)</h1>
          <p className="page-subtitle">Track wholesale buyers, manage leads, addresses, and Customer Relationship Management (CRM) sales interactions</p>
        </div>
        {canManageCustomers && (
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={18} /> Add Customer
          </button>
        )}
      </div>

      {/* Filters & Search Toolbar */}
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
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
          <Search
            size={18}
            color="#94a3b8"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search customer, business, mobile, or GSTIN (Goods & Services Tax ID)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ width: '130px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="LEAD">Lead</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-select"
              style={{ width: '140px' }}
            >
              <option value="ALL">All Types</option>
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="DISTRIBUTOR">Distributor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer & Business</th>
              <th>Contact Details</th>
              <th>Customer Type</th>
              <th>Status</th>
              <th>Follow-up Date</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  Loading customer directory...
                </td>
              </tr>
            ) : customers.length > 0 ? (
              customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.businessName}</div>
                    <div style={{ fontSize: '13px', color: '#475569' }}>Attn: {c.name}</div>
                    {c.gstNumber && (
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        GSTIN (Goods & Services Tax ID): {c.gstNumber}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <Phone size={13} color="#64748b" /> {c.mobile}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                      <Mail size={13} /> {c.email}
                    </div>
                  </td>
                  <td>
                    <span
                      className="badge badge-neutral"
                      style={{
                        backgroundColor:
                          c.customerType === 'DISTRIBUTOR'
                            ? '#e0e7ff'
                            : c.customerType === 'WHOLESALE'
                            ? '#ede9fe'
                            : '#f1f5f9',
                        color:
                          c.customerType === 'DISTRIBUTOR'
                            ? '#3730a3'
                            : c.customerType === 'WHOLESALE'
                            ? '#5b21b6'
                            : '#334155',
                      }}
                    >
                      {c.customerType}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        c.status === 'ACTIVE'
                          ? 'badge-success'
                          : c.status === 'LEAD'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td>
                    {c.followUpDate ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <Calendar size={13} color="#64748b" />
                        <span>{new Date(c.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>None scheduled</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        onClick={() => openDetailModal(c)}
                        className="btn btn-outline btn-sm"
                        title="View Customer 360 Detail & Timeline"
                      >
                        <Eye size={14} /> Detail
                      </button>
                      {canManageCustomers && (
                        <button
                          onClick={() => openEditModal(c)}
                          className="btn btn-outline btn-sm"
                          title="Edit Customer"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {user?.role === 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteCustomer(c.id, c.businessName)}
                          className="btn btn-outline btn-sm"
                          style={{ color: '#ef4444', borderColor: '#fecaca' }}
                          title="Delete Customer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                  No matching customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Customer Modal */}
      {isFormModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingCustomer ? 'Edit Customer Information' : 'Register New Customer'}
              </h2>
              <button
                onClick={() => setIsFormModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCustomer}>
              <div className="modal-body" style={{ maxHeight: '70vh' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Contact Person Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="form-input"
                      placeholder="e.g. Rajesh Gupta"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business / Company Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="form-input"
                      placeholder="e.g. Apex Retail Stores Pvt Ltd"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Mobile Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="form-input"
                      placeholder="+91 98201 00000"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-input"
                      placeholder="orders@apexretail.in"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Customer Type</label>
                    <select
                      value={formData.customerType}
                      onChange={(e) => setFormData({ ...formData, customerType: e.target.value as CustomerType })}
                      className="form-select"
                    >
                      <option value="RETAIL">Retail</option>
                      <option value="WHOLESALE">Wholesale</option>
                      <option value="DISTRIBUTOR">Distributor</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">GSTIN - Goods & Services Tax ID (Optional)</label>
                    <input
                      type="text"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                      className="form-input"
                      placeholder="27AABCA1234F1Z1"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Billing & Shipping Address *</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="form-textarea"
                    placeholder="Full street address, district, state & pin code"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Customer Relationship Management (CRM) Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                      className="form-select"
                    >
                      <option value="LEAD">Lead (Prospective)</option>
                      <option value="ACTIVE">Active (Buying)</option>
                      <option value="INACTIVE">Inactive (Suspended)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Next Follow-up Date</label>
                    <input
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Internal Business Notes</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="form-textarea"
                    placeholder="Preferred payment terms, credit limits, delivery notes..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer 360 Detail View & Follow-Up Notes Modal */}
      {isDetailModalOpen && selectedCustomer && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{selectedCustomer.businessName}</h2>
                <span className="badge badge-neutral" style={{ marginTop: '4px' }}>
                  {selectedCustomer.customerType} • {selectedCustomer.status}
                </span>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh' }}>
              {/* Profile Card */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>Contact Person:</span>{' '}
                  <strong>{selectedCustomer.name}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Mobile:</span>{' '}
                  <strong>{selectedCustomer.mobile}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Email:</span>{' '}
                  <strong>{selectedCustomer.email}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>GSTIN (Goods & Services Tax ID):</span>{' '}
                  <strong>{selectedCustomer.gstNumber || 'Not provided'}</strong>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#64748b' }}>Address:</span> {selectedCustomer.address}
                </div>
              </div>

              {/* Follow-up Notes Timeline */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} color="#2563eb" /> Customer Relationship Management (CRM) Follow-up Timeline & Notes
                </h3>

                {canManageCustomers && (
                  <form onSubmit={handleAddNote} style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Add follow-up notes, phone call logs, or meeting remarks..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="form-input"
                      style={{ flex: 1 }}
                      required
                    />
                    <button type="submit" disabled={savingNote} className="btn btn-primary">
                      <MessageSquarePlus size={16} /> {savingNote ? 'Adding...' : 'Log Note'}
                    </button>
                  </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedCustomer.followUpNotes && selectedCustomer.followUpNotes.length > 0 ? (
                    selectedCustomer.followUpNotes.map((note) => (
                      <div
                        key={note.id}
                        style={{
                          borderLeft: '3px solid #2563eb',
                          backgroundColor: '#f8fafc',
                          padding: '12px 14px',
                          borderRadius: '0 6px 6px 0',
                        }}
                      >
                        <div style={{ fontSize: '14px', color: '#1e293b' }}>{note.note}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                          By <strong>{note.createdByUser?.name || 'Staff'}</strong> ({note.createdByUser?.role || 'SALES'}) •{' '}
                          {new Date(note.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                      No follow-up interactions logged yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Order History */}
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>
                  Associated Sales Challans
                </h3>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Challan #</th>
                        <th>Status</th>
                        <th>Total Items</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.challans && selectedCustomer.challans.length > 0 ? (
                        selectedCustomer.challans.map((ch) => (
                          <tr key={ch.id}>
                            <td style={{ fontWeight: 700, color: '#2563eb' }}>{ch.challanNumber}</td>
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
                            <td>{ch.totalQuantity} units</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                              ₹{ch.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </td>
                            <td style={{ fontSize: '12px', color: '#64748b' }}>
                              {new Date(ch.createdAt).toLocaleDateString('en-IN')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>
                            No orders placed yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-footer">
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
      )}
    </div>
  );
};
