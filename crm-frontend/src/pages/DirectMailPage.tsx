import React, { useEffect, useState } from 'react';
import {
  Mail,
  Search,
  Filter,
  Plus,
  Download,
  X,
  Truck,
  PackageCheck,
  Clock,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  MapPin,
} from 'lucide-react';
import api from '../lib/api';
import { DirectMailItem, Lead } from '../types';

const mailTypes = [
  'All',
  'Brochure',
  'Product Catalogue',
  'Introduction Letter',
  'Marketing Letter',
  'Quotation',
  'Thank-you Letter',
  'Other',
];

const statusOptions = [
  'All',
  'Draft',
  'Pending Approval',
  'Approved',
  'Ready for Dispatch',
  'Dispatched',
  'Delivered',
  'Returned',
  'Cancelled',
];

export const DirectMailPage: React.FC = () => {
  const [records, setRecords] = useState<DirectMailItem[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    dispatched: 0,
    delivered: 0,
    returned: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DirectMailItem | null>(null);

  // Create Form State
  const [form, setForm] = useState({
    recipientName: '',
    companyName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    mailType: 'Brochure',
    status: 'Ready for Dispatch',
    relatedLead: '',
    scheduledDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  // Status Form State
  const [statusForm, setStatusForm] = useState({
    status: 'Dispatched',
    trackingNumber: '',
    postalCarrier: 'India Post Speed Post',
    dispatchDate: new Date().toISOString().slice(0, 10),
    deliveryDate: '',
    note: '',
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/direct-mail', {
        params: {
          search,
          mailType: selectedType,
          status: selectedStatus,
          page,
          limit: 15,
        },
      });
      if (res.data?.success) {
        setRecords(res.data.data || []);
        if (res.data.metrics) setMetrics(res.data.metrics);
        if (res.data.pagination) setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch direct mail records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads?limit=50');
      if (res.data?.success) {
        setLeads(res.data.data || []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchRecords();
  }, [search, selectedType, selectedStatus, page]);

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleLeadSelect = (leadId: string) => {
    const l = leads.find((item) => item._id === leadId);
    if (l) {
      setForm((prev) => ({
        ...prev,
        relatedLead: l._id,
        recipientName: `${l.firstName} ${l.lastName}`.trim(),
        companyName: l.company || '',
        addressLine1: prev.addressLine1 || `${l.company} Corporate Office`,
        city: prev.city || 'Mumbai',
        state: prev.state || 'Maharashtra',
        postalCode: prev.postalCode || '400001',
      }));
    } else {
      setForm((prev) => ({ ...prev, relatedLead: '' }));
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/direct-mail', form);
      if (res.data?.success) {
        setShowCreateModal(false);
        setForm({
          recipientName: '',
          companyName: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India',
          mailType: 'Brochure',
          status: 'Ready for Dispatch',
          relatedLead: '',
          scheduledDate: new Date().toISOString().slice(0, 10),
          notes: '',
        });
        fetchRecords();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create record');
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      const res = await api.patch(`/direct-mail/${selectedItem._id}/status`, statusForm);
      if (res.data?.success) {
        setShowStatusModal(false);
        fetchRecords();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this direct mail dispatch record?')) return;
    try {
      await api.delete(`/direct-mail/${id}`);
      fetchRecords();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete record');
    }
  };

  const exportCSV = () => {
    if (records.length === 0) return;
    const headers = ['Mail ID', 'Recipient', 'Company', 'Address', 'City', 'State', 'Type', 'Status', 'Carrier', 'Tracking Number', 'Scheduled'];
    const rows = records.map((r) => [
      r.mailId,
      r.recipientName,
      r.companyName || '',
      r.addressLine1,
      r.city,
      r.state,
      r.mailType,
      r.status,
      r.postalCarrier || '',
      r.trackingNumber || '',
      r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Direct_Mail_Dispatch_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <span className="badge badge-success">Delivered</span>;
      case 'Dispatched':
        return <span className="badge badge-primary">Dispatched</span>;
      case 'Ready for Dispatch':
      case 'Approved':
        return <span className="badge badge-info">{status}</span>;
      case 'Returned':
      case 'Cancelled':
        return <span className="badge badge-danger">{status}</span>;
      default:
        return <span className="badge badge-warning">{status}</span>;
    }
  };

  return (
    <div className="crm-module">
      {/* Top Header */}
      <div className="crm-module-header">
        <div>
          <h1 className="crm-title">Direct Mail Dispatch</h1>
          <p className="crm-subtitle">Physical postal marketing, whitepaper packets, and printed proposal tracking.</p>
        </div>
        <div className="crm-actions">
          <button className="btn btn-secondary" onClick={exportCSV} title="Export CSV">
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> New Mail Record
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="crm-stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
            <Mail size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Mailings</div>
            <div className="stat-value">{metrics.total}</div>
            <div className="stat-meta"><span>Recorded in pipeline</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#eab308' }}>
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending Dispatch</div>
            <div className="stat-value">{metrics.pending}</div>
            <div className="stat-meta"><span>Awaiting packaging</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <Truck size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">In Transit / Dispatched</div>
            <div className="stat-value">{metrics.dispatched}</div>
            <div className="stat-meta"><span>Active courier tracking</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' }}>
            <PackageCheck size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Delivered Successfully</div>
            <div className="stat-value">{metrics.delivered}</div>
            <div className="stat-meta"><span>{metrics.returned} returned</span></div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="crm-filter-bar">
        <div className="crm-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by recipient, company, address, city or tracking #..."
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
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
          >
            {mailTypes.map((t) => (
              <option key={t} value={t}>
                {t === 'All' ? 'All Mail Types' : t}
              </option>
            ))}
          </select>

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

      {/* Table */}
      <div className="crm-table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Mail ID</th>
              <th>Recipient & Company</th>
              <th>Postal Destination</th>
              <th>Mail Type</th>
              <th>Carrier & Tracking</th>
              <th>Scheduled</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="crm-spinner" />
                  <p style={{ marginTop: '12px', color: '#64748b' }}>Loading direct mail records...</p>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                  <Mail size={36} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
                  <p style={{ color: '#64748b', fontSize: '15px' }}>No direct mail records found.</p>
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r._id}>
                  <td>
                    <span className="mono-badge">{r.mailId}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.recipientName}</div>
                    {r.companyName && <div style={{ fontSize: '12px', color: '#64748b' }}>{r.companyName}</div>}
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#334155' }}>
                      <MapPin size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                      {r.city}, {r.state} {r.postalCode}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{r.addressLine1}</div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{r.mailType}</span>
                  </td>
                  <td>
                    {r.trackingNumber ? (
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '12px', color: '#2563eb' }}>{r.trackingNumber}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{r.postalCarrier || 'Carrier assigned'}</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>— Unassigned</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#334155' }}>
                      {r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : '—'}
                    </div>
                  </td>
                  <td>{getStatusBadge(r.status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions">
                      <button
                        className="action-btn"
                        title="Update Tracking & Status"
                        onClick={() => {
                          setSelectedItem(r);
                          setStatusForm({
                            status: r.status,
                            trackingNumber: r.trackingNumber || '',
                            postalCarrier: r.postalCarrier || 'India Post Speed Post',
                            dispatchDate: r.dispatchDate ? r.dispatchDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
                            deliveryDate: r.deliveryDate ? r.deliveryDate.slice(0, 10) : '',
                            note: '',
                          });
                          setShowStatusModal(true);
                        }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="action-btn"
                        title="View Full Envelope Details"
                        onClick={() => {
                          setSelectedItem(r);
                          setShowDetailModal(true);
                        }}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        title="Delete Mail Record"
                        onClick={() => handleDelete(r._id)}
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

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="crm-modal-backdrop">
          <div className="crm-modal-card" style={{ maxWidth: '620px' }}>
            <div className="crm-modal-header">
              <h2>New Direct Mail Dispatch</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="crm-form">
              {/* Optional Lead Selector */}
              <div className="form-group">
                <label>Link to Existing Lead (Optional Auto-Fill)</label>
                <select
                  value={form.relatedLead}
                  onChange={(e) => handleLeadSelect(e.target.value)}
                >
                  <option value="">-- Manual Entry / No Linked Lead --</option>
                  {leads.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.leadId} — {l.firstName} {l.lastName} ({l.company})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Recipient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.recipientName}
                    onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                    placeholder="e.g. Aarav Mehta"
                  />
                </div>
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="e.g. Vertex Manufacturing"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address Line 1 *</label>
                <input
                  type="text"
                  required
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  placeholder="Street address, building number, suite"
                />
              </div>

              <div className="form-group">
                <label>Address Line 2 (Optional)</label>
                <input
                  type="text"
                  value={form.addressLine2}
                  onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                  placeholder="Apartment, suite, unit, industrial zone"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Noida"
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    required
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="e.g. Uttar Pradesh"
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code *</label>
                  <input
                    type="text"
                    required
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    placeholder="e.g. 201309"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mail Item Type</label>
                  <select
                    value={form.mailType}
                    onChange={(e) => setForm({ ...form, mailType: e.target.value })}
                  >
                    {mailTypes.filter((t) => t !== 'All').map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Scheduled Dispatch Date</label>
                  <input
                    type="date"
                    value={form.scheduledDate}
                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Internal Dispatch Instructions / Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Enclosed items, packaging requirements, priority sticker..."
                />
              </div>

              <div className="crm-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Create Dispatch Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {showStatusModal && selectedItem && (
        <div className="crm-modal-backdrop">
          <div className="crm-modal-card" style={{ maxWidth: '520px' }}>
            <div className="crm-modal-header">
              <h2>Update Dispatch & Tracking — {selectedItem.mailId}</h2>
              <button className="close-btn" onClick={() => setShowStatusModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleStatusSubmit} className="crm-form">
              <div className="form-group">
                <label>Dispatch Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                >
                  {statusOptions.filter((s) => s !== 'All').map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Postal Carrier / Courier</label>
                  <input
                    type="text"
                    value={statusForm.postalCarrier}
                    onChange={(e) => setStatusForm({ ...statusForm, postalCarrier: e.target.value })}
                    placeholder="e.g. Blue Dart, India Post Speed Post"
                  />
                </div>
                <div className="form-group">
                  <label>Tracking / AWB Number</label>
                  <input
                    type="text"
                    value={statusForm.trackingNumber}
                    onChange={(e) => setStatusForm({ ...statusForm, trackingNumber: e.target.value })}
                    placeholder="e.g. BLUEDART-88219"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dispatch Date</label>
                  <input
                    type="date"
                    value={statusForm.dispatchDate}
                    onChange={(e) => setStatusForm({ ...statusForm, dispatchDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Delivery Confirmation Date (If Delivered)</label>
                  <input
                    type="date"
                    value={statusForm.deliveryDate}
                    onChange={(e) => setStatusForm({ ...statusForm, deliveryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Audit Log Note</label>
                <input
                  type="text"
                  value={statusForm.note}
                  onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
                  placeholder="e.g. Handed over to courier hub, signed by recipient..."
                />
              </div>

              <div className="crm-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedItem && (
        <div className="crm-modal-backdrop">
          <div className="crm-modal-card" style={{ maxWidth: '580px' }}>
            <div className="crm-modal-header">
              <h2>Postal Envelope Label — {selectedItem.mailId}</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              {/* Envelope Design Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '10px',
                  padding: '24px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    SENDER: ZEE X AI SYSTEMS · CHENNAI TECH PARK
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#4338ca' }}>
                    {selectedItem.mailType}
                  </div>
                </div>

                <div style={{ marginLeft: '40px', marginTop: '20px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>DELIVER TO:</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {selectedItem.recipientName}
                  </div>
                  {selectedItem.companyName && (
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>
                      {selectedItem.companyName}
                    </div>
                  )}
                  <div style={{ fontSize: '13px', color: '#475569', marginTop: '6px', lineHeight: '1.5' }}>
                    {selectedItem.addressLine1}
                    {selectedItem.addressLine2 && <div>{selectedItem.addressLine2}</div>}
                    <div>
                      {selectedItem.city}, {selectedItem.state} — {selectedItem.postalCode}
                    </div>
                    <div style={{ fontWeight: 600 }}>{selectedItem.country}</div>
                  </div>
                </div>

                {selectedItem.trackingNumber && (
                  <div
                    style={{
                      marginTop: '24px',
                      paddingTop: '12px',
                      borderTop: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                    }}
                  >
                    <span>Carrier: <strong>{selectedItem.postalCarrier}</strong></span>
                    <span>Tracking: <strong>{selectedItem.trackingNumber}</strong></span>
                  </div>
                )}
              </div>

              {/* Status History */}
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                Dispatch & Tracking History
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedItem.statusHistory && selectedItem.statusHistory.length > 0 ? (
                  selectedItem.statusHistory.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 14px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <strong>{h.status}</strong>: {h.note || 'Status updated'}
                      </div>
                      <div style={{ color: '#94a3b8' }}>
                        {new Date(h.changedAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '13px', color: '#64748b' }}>No history records logged yet.</div>
                )}
              </div>
            </div>

            <div className="crm-modal-footer">
              <button className="btn btn-secondary" onClick={() => window.print()}>
                Print Address Label
              </button>
              <button className="btn btn-primary" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
