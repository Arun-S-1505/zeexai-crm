import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  X,
  Printer,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  Clock,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import api from '../lib/api';
import { QuotationItem, QuotationLineItem, Lead } from '../types';

const statusOptions = [
  'All',
  'Draft',
  'Pending Approval',
  'Approved',
  'Sent',
  'Viewed',
  'Accepted',
  'Rejected',
  'Expired',
  'Cancelled',
];

const emptyLineItem: QuotationLineItem = {
  name: '',
  description: '',
  quantity: 1,
  unit: 'Units',
  unitPrice: 0,
  discount: 0,
  taxRate: 18,
  lineTotal: 0,
};

export const QuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    accepted: 0,
    pipelineValue: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuotationItem | null>(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    customerName: '',
    company: '',
    email: '',
    phone: '',
    billingAddress: '',
    shippingAddress: '',
    relatedLead: '',
    validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    paymentTerms: '50% advance against PO confirmation, 50% upon deployment sign-off.',
    deliveryTerms: 'Dispatch within 14 business days from hardware allocation.',
    notes: '',
    status: 'Draft',
    lineItems: [{ ...emptyLineItem, name: 'Z-Factory Industrial AI Appliance', unitPrice: 250000, quantity: 1 }],
  });

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations', {
        params: {
          search,
          status: selectedStatus,
          page,
          limit: 15,
        },
      });
      if (res.data?.success) {
        setQuotations(res.data.data || []);
        if (res.data.metrics) setMetrics(res.data.metrics);
        if (res.data.pagination) setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads?limit=50');
      if (res.data?.success) setLeads(res.data.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchQuotations();
  }, [search, selectedStatus, page]);

  useEffect(() => {
    fetchLeads();
  }, []);

  // Recalculate line totals live in form
  const computeLiveTotals = () => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    form.lineItems.forEach((item) => {
      const base = item.quantity * item.unitPrice;
      const disc = base * (item.discount / 100);
      const afterDisc = base - disc;
      const tax = afterDisc * (item.taxRate / 100);

      subtotal += base;
      discountTotal += disc;
      taxTotal += tax;
    });

    const grandTotal = subtotal - discountTotal + taxTotal;
    return { subtotal, discountTotal, taxTotal, grandTotal };
  };

  const handleLineItemChange = (index: number, field: keyof QuotationLineItem, value: any) => {
    const updated = [...form.lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Update line total
    const q = Number(updated[index].quantity) || 0;
    const p = Number(updated[index].unitPrice) || 0;
    const d = Number(updated[index].discount) || 0;
    const t = Number(updated[index].taxRate) || 0;
    const base = q * p;
    const afterDisc = base * (1 - d / 100);
    updated[index].lineTotal = Number((afterDisc * (1 + t / 100)).toFixed(2));

    setForm({ ...form, lineItems: updated });
  };

  const addLineItem = () => {
    setForm({
      ...form,
      lineItems: [...form.lineItems, { ...emptyLineItem }],
    });
  };

  const removeLineItem = (index: number) => {
    if (form.lineItems.length <= 1) return;
    setForm({
      ...form,
      lineItems: form.lineItems.filter((_, i) => i !== index),
    });
  };

  const handleLeadSelect = (leadId: string) => {
    const l = leads.find((item) => item._id === leadId);
    if (l) {
      setForm((prev) => ({
        ...prev,
        relatedLead: l._id,
        customerName: `${l.firstName} ${l.lastName}`.trim(),
        company: l.company || '',
        email: l.email || '',
        phone: l.phone || '',
        title: `Commercial Proposal — ${l.interestedProduct || 'ZEE X AI Systems'} (${l.company})`,
        billingAddress: `${l.company} Facility, Sector 5, India`,
        shippingAddress: `${l.company} Deployment Site, India`,
      }));
    } else {
      setForm((prev) => ({ ...prev, relatedLead: '' }));
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/quotations', form);
      if (res.data?.success) {
        setShowCreateModal(false);
        fetchQuotations();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create quotation');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await api.post(`/quotations/${id}/duplicate`);
      if (res.data?.success) {
        fetchQuotations();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to duplicate quotation');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await api.patch(`/quotations/${id}/status`, { status: newStatus });
      if (res.data?.success) {
        fetchQuotations();
        if (selectedQuote && selectedQuote._id === id) {
          setSelectedQuote(res.data.data);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update quotation status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    try {
      await api.delete(`/quotations/${id}`);
      fetchQuotations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete quotation');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Accepted':
        return <span className="badge badge-success">Accepted</span>;
      case 'Approved':
        return <span className="badge badge-primary">Approved</span>;
      case 'Sent':
      case 'Viewed':
        return <span className="badge badge-info">{status}</span>;
      case 'Rejected':
      case 'Cancelled':
      case 'Expired':
        return <span className="badge badge-danger">{status}</span>;
      default:
        return <span className="badge badge-warning">{status}</span>;
    }
  };

  const liveTotals = computeLiveTotals();

  return (
    <div className="crm-module">
      {/* Top Header */}
      <div className="crm-module-header">
        <div>
          <h1 className="crm-title">Quotations & Invoicing</h1>
          <p className="crm-subtitle">Formal pricing estimates, multi-line item proposals, and commercial contracts.</p>
        </div>
        <div className="crm-actions">
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> New Quotation
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="crm-stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
            <FileText size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Quotations</div>
            <div className="stat-value">{metrics.total}</div>
            <div className="stat-meta"><span>Active quotes in system</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#eab308' }}>
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending Approval</div>
            <div className="stat-value">{metrics.pending}</div>
            <div className="stat-meta"><span>Awaiting review</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <CheckCircle size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Approved & Sent</div>
            <div className="stat-value">{metrics.approved}</div>
            <div className="stat-meta"><span>Ready for client signature</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pipeline Value</div>
            <div className="stat-value">₹{(metrics.pipelineValue / 100000).toFixed(2)}L</div>
            <div className="stat-meta"><span>{metrics.accepted} accepted deals</span></div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="crm-filter-bar">
        <div className="crm-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by quote #, title, customer name, company, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {search && (
            <button className="clear-btn" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="crm-filter-group">
          <Filter size={16} />
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Statuses' : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quotation Table */}
      <div className="crm-table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Quote #</th>
              <th>Quotation Title & Client</th>
              <th>Valid Until</th>
              <th>Subtotal</th>
              <th>Discount / Tax</th>
              <th>Grand Total</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="crm-spinner" />
                  <p style={{ marginTop: '12px', color: '#64748b' }}>Loading quotations...</p>
                </td>
              </tr>
            ) : quotations.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                  <FileText size={36} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
                  <p style={{ color: '#64748b', fontSize: '15px' }}>No quotations found.</p>
                </td>
              </tr>
            ) : (
              quotations.map((q) => (
                <tr key={q._id}>
                  <td>
                    <span className="mono-badge">{q.quotationNumber}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{q.title}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {q.customerName} {q.company ? `· ${q.company}` : ''}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#334155' }}>
                      {new Date(q.validUntil).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#475569' }}>
                      ₹{q.subtotal.toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      -₹{q.discountTotal.toLocaleString('en-IN')} / +₹{q.taxTotal.toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                      ₹{q.grandTotal.toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td>{getStatusBadge(q.status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions">
                      <button
                        className="action-btn"
                        title="View / Print Branded Quotation"
                        onClick={() => {
                          setSelectedQuote(q);
                          setShowPrintModal(true);
                        }}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className="action-btn"
                        title="Duplicate Quotation"
                        onClick={() => handleDuplicate(q._id)}
                      >
                        <Copy size={15} />
                      </button>
                      <select
                        style={{
                          fontSize: '11px',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          background: '#fff',
                        }}
                        value={q.status}
                        onChange={(e) => handleStatusChange(q._id, e.target.value)}
                      >
                        {statusOptions.filter((s) => s !== 'All').map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        className="action-btn delete-btn"
                        title="Delete Quotation"
                        onClick={() => handleDelete(q._id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="crm-pagination">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={14} /> Previous
            </button>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Page {page} of {totalPages}
            </span>
            <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* CREATE QUOTATION MODAL */}
      {showCreateModal && (
        <div className="crm-modal-backdrop">
          <div className="crm-modal-card" style={{ maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="crm-modal-header">
              <h2>Create New Quotation</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="crm-form">
              {/* Lead Auto-Fill */}
              <div className="form-group">
                <label>Select Associated Lead (Optional Auto-Fill)</label>
                <select value={form.relatedLead} onChange={(e) => handleLeadSelect(e.target.value)}>
                  <option value="">-- Manual Customer Entry / None --</option>
                  {leads.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.leadId} — {l.firstName} {l.lastName} ({l.company})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quotation Title / Subject *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Z-Factory Anomaly Detection Pilot System"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="e.g. Aarav Mehta"
                  />
                </div>
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="e.g. Vertex Manufacturing"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Customer Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="aarav@vertexmfg.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="form-group">
                  <label>Valid Until Date *</label>
                  <input
                    type="date"
                    required
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                  />
                </div>
              </div>

              {/* Line Items Section */}
              <div style={{ marginTop: '20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                    Itemized Products & Services
                  </h3>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addLineItem}>
                    <Plus size={14} /> Add Line Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {form.lineItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    >
                      <div className="form-row" style={{ marginBottom: '8px' }}>
                        <div className="form-group" style={{ flex: 3 }}>
                          <label style={{ fontSize: '11px' }}>Product / Service Name *</label>
                          <input
                            type="text"
                            required
                            value={item.name}
                            onChange={(e) => handleLineItemChange(idx, 'name', e.target.value)}
                            placeholder="Hardware model, firmware license, installation..."
                          />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label style={{ fontSize: '11px' }}>Qty *</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(idx, 'quantity', Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label style={{ fontSize: '11px' }}>Unit</label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleLineItemChange(idx, 'unit', e.target.value)}
                            placeholder="Units"
                          />
                        </div>
                        <div className="form-group" style={{ flex: 2 }}>
                          <label style={{ fontSize: '11px' }}>Unit Price (₹) *</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={item.unitPrice}
                            onChange={(e) => handleLineItemChange(idx, 'unitPrice', Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="form-row" style={{ alignItems: 'center' }}>
                        <div className="form-group" style={{ flex: 3 }}>
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                            placeholder="Item specifications and scope description..."
                          />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={(e) => handleLineItemChange(idx, 'discount', Number(e.target.value))}
                            placeholder="Disc %"
                          />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.taxRate}
                            onChange={(e) => handleLineItemChange(idx, 'taxRate', Number(e.target.value))}
                            placeholder="GST %"
                          />
                        </div>
                        <div style={{ flex: 2, textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                          ₹{item.lineTotal.toLocaleString('en-IN')}
                        </div>
                        {form.lineItems.length > 1 && (
                          <button
                            type="button"
                            className="action-btn delete-btn"
                            style={{ marginLeft: '8px' }}
                            onClick={() => removeLineItem(idx)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculation Summary Box */}
                <div
                  style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: '#f1f5f9',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    alignItems: 'flex-end',
                  }}
                >
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    Subtotal: <strong>₹{liveTotals.subtotal.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#dc2626' }}>
                    Discount: <strong>-₹{liveTotals.discountTotal.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    Estimated Tax (GST): <strong>+₹{liveTotals.taxTotal.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: '6px' }}>
                    Grand Total: ₹{liveTotals.grandTotal.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Payment Terms</label>
                  <input
                    type="text"
                    value={form.paymentTerms}
                    onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Delivery Terms</label>
                  <input
                    type="text"
                    value={form.deliveryTerms}
                    onChange={(e) => setForm({ ...form, deliveryTerms: e.target.value })}
                  />
                </div>
              </div>

              <div className="crm-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Save & Generate Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT / VIEW BRANDED QUOTATION MODAL */}
      {showPrintModal && selectedQuote && (
        <div className="crm-modal-backdrop">
          <div className="crm-modal-card" style={{ maxWidth: '850px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="crm-modal-header">
              <h2>Official Quotation Document — {selectedQuote.quotationNumber}</h2>
              <button className="close-btn" onClick={() => setShowPrintModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Printable Document Container */}
            <div style={{ padding: '30px', background: '#ffffff', color: '#0f172a' }}>
              {/* Header with ZEE X AI Branding */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #4338ca', paddingBottom: '16px', marginBottom: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <ShieldCheck size={28} color="#4338ca" />
                    <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                      ZEE X AI
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Autonomous Perception & Edge Vision Systems
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    CIN: U72900TN2026PTC01 · gst@zeexai.com
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#4338ca' }}>
                    COMMERCIAL QUOTATION
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{selectedQuote.quotationNumber}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Date: {new Date(selectedQuote.issueDate).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#e11d48' }}>
                    Valid Until: {new Date(selectedQuote.validUntil).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Client & Billing Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>PREPARED FOR:</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {selectedQuote.customerName}
                  </div>
                  {selectedQuote.company && (
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      {selectedQuote.company}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                    {selectedQuote.email} {selectedQuote.phone ? `· ${selectedQuote.phone}` : ''}
                  </div>
                  {selectedQuote.billingAddress && (
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {selectedQuote.billingAddress}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>STATUS:</div>
                  <div style={{ marginTop: '4px' }}>{getStatusBadge(selectedQuote.status)}</div>
                </div>
              </div>

              {/* Line Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left', fontSize: '12px' }}>
                    <th style={{ padding: '10px 12px' }}>#</th>
                    <th style={{ padding: '10px 12px' }}>Item & Scope</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Disc</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>GST</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedQuote.lineItems.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{i + 1}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                        {item.description && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {item.quantity} {item.unit}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        ₹{item.unitPrice.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                        {item.discount}%
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                        {item.taxRate}%
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                        ₹{item.lineTotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
                    <span>Subtotal:</span>
                    <span>₹{selectedQuote.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#dc2626' }}>
                    <span>Discount:</span>
                    <span>-₹{selectedQuote.discountTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
                    <span>GST (Tax):</span>
                    <span>+₹{selectedQuote.taxTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '17px',
                      fontWeight: 800,
                      color: '#0f172a',
                      borderTop: '2px solid #0f172a',
                      paddingTop: '8px',
                      marginTop: '4px',
                    }}
                  >
                    <span>Grand Total:</span>
                    <span>₹{selectedQuote.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
                <div><strong>Payment Terms:</strong> {selectedQuote.paymentTerms}</div>
                <div><strong>Delivery Terms:</strong> {selectedQuote.deliveryTerms}</div>
                <div style={{ marginTop: '8px' }}>
                  <strong>Terms & Conditions:</strong> {selectedQuote.termsAndConditions}
                </div>
              </div>
            </div>

            <div className="crm-modal-footer">
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <Printer size={16} /> Print / Save as PDF
              </button>
              <button className="btn btn-primary" onClick={() => setShowPrintModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
