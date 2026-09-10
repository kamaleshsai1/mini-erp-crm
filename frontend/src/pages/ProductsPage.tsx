import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  SlidersHorizontal,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  X,
  Package,
} from 'lucide-react';
import { api } from '../services/api';
import { Product } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Product Form
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 10,
    location: '',
  });

  // Stock Adjust Form
  const [adjustData, setAdjustData] = useState<{
    quantityChanged: number;
    movementType: 'IN' | 'OUT';
    reason: string;
  }>({
    quantityChanged: 1,
    movementType: 'IN',
    reason: '',
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({
        search,
        category: categoryFilter,
        lowStock: lowStockOnly,
      });
      setProducts(data);
    } catch (err: any) {
      error(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, lowStockOnly]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      category: 'Electronics',
      unitPrice: 100,
      currentStock: 0,
      minStockAlert: 10,
      location: 'Warehouse A - Bay 01',
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      location: p.location,
    });
    setIsFormModalOpen(true);
  };

  const openAdjustModal = (p: Product) => {
    setSelectedProduct(p);
    setAdjustData({
      quantityChanged: 5,
      movementType: 'IN',
      reason: 'Standard stock replenishment',
    });
    setIsAdjustModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
        success('Product details updated successfully');
      } else {
        await api.createProduct(formData);
        success('New product added to inventory');
      }
      setIsFormModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      error(err.message || 'Failed to save product');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (adjustData.movementType === 'OUT' && selectedProduct.currentStock < adjustData.quantityChanged) {
      error(`Cannot deduct ${adjustData.quantityChanged} units. Current stock is only ${selectedProduct.currentStock}.`);
      return;
    }

    try {
      await api.adjustStock(selectedProduct.id, adjustData);
      success(`Stock ${adjustData.movementType === 'IN' ? 'inwarded' : 'deducted'} successfully`);
      setIsAdjustModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      error(err.message || 'Stock adjustment failed');
    }
  };

  const canManageProducts = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  // Get distinct categories for filter
  const categories = ['ALL', 'Electronics', 'Packaging', 'Hardware', 'Chemicals', 'Safety'];

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Product & Inventory Catalog</h1>
          <p className="page-subtitle">Manage SKUs (Stock Keeping Units), stock levels, warehouse locations, and re-order thresholds</p>
        </div>
        {canManageProducts && (
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={18} /> Add Product
          </button>
        )}
      </div>

      {/* Filter bar */}
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
            placeholder="Search by product name, SKU (Stock Keeping Unit), or rack..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select"
              style={{ width: '150px' }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              color: lowStockOnly ? '#b91c1c' : '#475569',
              backgroundColor: lowStockOnly ? '#fef2f2' : '#f1f5f9',
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${lowStockOnly ? '#fecaca' : '#e2e8f0'}`,
            }}
          >
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <AlertTriangle size={15} color={lowStockOnly ? '#ef4444' : '#64748b'} />
            Low Stock Alerts Only
          </label>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product Details</th>
              <th>SKU (Stock Keeping Unit) / Code</th>
              <th>Category</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'center' }}>Stock Level</th>
              <th>Warehouse Location</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Loading product catalog...
                </td>
              </tr>
            ) : products.length > 0 ? (
              products.map((p) => {
                const isLow = p.currentStock <= p.minStockAlert;
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#1e293b' }}>
                        {p.sku}
                      </code>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{p.category}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ₹{p.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span
                          className={`badge ${
                            p.currentStock === 0
                              ? 'badge-danger'
                              : isLow
                              ? 'badge-warning'
                              : 'badge-success'
                          }`}
                        >
                          {p.currentStock} units
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                          Min: {p.minStockAlert}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#475569' }}>{p.location}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {canManageProducts && (
                          <>
                            <button
                              onClick={() => openAdjustModal(p)}
                              className="btn btn-outline btn-sm"
                              title="Manual Stock Inward / Outward"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <SlidersHorizontal size={13} /> Adjust Stock
                            </button>
                            <button
                              onClick={() => openEditModal(p)}
                              className="btn btn-outline btn-sm"
                              title="Edit Product Details"
                            >
                              <Edit2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                  No products matched your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      {isFormModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Product to Inventory'}
              </h2>
              <button
                onClick={() => setIsFormModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                    placeholder="e.g. Wireless Barcode Scanner 2D"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">SKU (Stock Keeping Unit) / Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                      className="form-input"
                      placeholder="e.g. PROD-ELEC-001"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="form-input"
                      placeholder="e.g. Electronics, Packaging"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Unit Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Minimum Stock Alert *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.minStockAlert}
                      onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value, 10) || 0 })}
                      className="form-input"
                    />
                  </div>
                </div>

                {!editingProduct && (
                  <div className="form-group">
                    <label className="form-label">Initial Opening Stock (Units)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value, 10) || 0 })}
                      className="form-input"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Warehouse Location / Rack *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="form-input"
                    placeholder="e.g. Warehouse A - Bay 02, Rack 4"
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
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Adjust Stock Level</h2>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdjustStock}>
              <div className="modal-body">
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{selectedProduct.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    SKU (Stock Keeping Unit): {selectedProduct.sku} • Location: {selectedProduct.location}
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '14px' }}>
                    Current Available Stock: <strong>{selectedProduct.currentStock} units</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Movement Type *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setAdjustData({ ...adjustData, movementType: 'IN' })}
                      className="btn"
                      style={{
                        backgroundColor: adjustData.movementType === 'IN' ? '#ecfdf5' : '#ffffff',
                        border: `2px solid ${adjustData.movementType === 'IN' ? '#10b981' : '#e2e8f0'}`,
                        color: adjustData.movementType === 'IN' ? '#065f46' : '#64748b',
                      }}
                    >
                      <ArrowDownRight size={16} /> Stock IN (Inward)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustData({ ...adjustData, movementType: 'OUT' })}
                      className="btn"
                      style={{
                        backgroundColor: adjustData.movementType === 'OUT' ? '#fef2f2' : '#ffffff',
                        border: `2px solid ${adjustData.movementType === 'OUT' ? '#ef4444' : '#e2e8f0'}`,
                        color: adjustData.movementType === 'OUT' ? '#991b1b' : '#64748b',
                      }}
                    >
                      <ArrowUpRight size={16} /> Stock OUT (Outward)
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity to Adjust *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjustData.quantityChanged}
                    onChange={(e) => setAdjustData({ ...adjustData, quantityChanged: parseInt(e.target.value, 10) || 1 })}
                    className="form-input"
                  />
                  {adjustData.movementType === 'OUT' && adjustData.quantityChanged > selectedProduct.currentStock && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                      Warning: Deduction exceeds current stock ({selectedProduct.currentStock}). Negative stock is blocked.
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Mandatory Reason *</label>
                  <textarea
                    rows={2}
                    required
                    value={adjustData.reason}
                    onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                    className="form-textarea"
                    placeholder="e.g. Inward from supplier PO #409, or Physical stock count correction..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustData.movementType === 'OUT' && adjustData.quantityChanged > selectedProduct.currentStock}
                  className="btn btn-primary"
                >
                  Commit Stock Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
