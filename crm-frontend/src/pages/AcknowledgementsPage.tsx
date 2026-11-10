import React, { useEffect, useState } from 'react';
import {
  FileCheck2,
  Search,
  Filter,
  Plus,
  Printer,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  Clock,
  Send,
  X,
  ShieldCheck,
} from 'lucide-react';
import api from '../lib/api';
import { AcknowledgementItem, Lead } from '../types';

const ackTypes = [
  'All',
  'Enquiry Received',
  'Lead Received',
  'Brochure Request',
  'Quotation Received',
  'Quotation Acceptance',
  'Document Received',
  'Meeting Confirmation',
  'General Acknowledgement',
];

const statusOptions = [
  'All',
  'Draft',
  'Pending Approval',
  'Approved',
  'Sent',
  'Acknowledged',
  'Rejected',
  'Expired',
];

export const AcknowledgementsPage: React.FC = () => {
  const [records, setRecords] = useState<AcknowledgementItem[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    sent: 0,
    confirmed: 0,
    overdue: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AcknowledgementItem | null>(null);

  // Form State
  const [form, setForm] = useState({
    referenceNumber: '',
    contactName: '',
    company: '',
    email: '',
    phone: '',
    relatedLead: '',
    relatedQuotation: '',
    type: 'Enquiry Received',
    subject: 'Official Acknowledgement of Solution Inquiry',
    content:
      'Dear Contact,\n\nWe formally acknowledge receipt of your enterprise inquiry. Our systems engineering and customer architecture team is reviewing your requirements.\n\nWarm regards,\nZEE X AI Operations',
    notes: '',
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/acknowledgements', {
        params: {
          search,
          type: selectedType,
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
      console.error('Failed to fetch acknowledgements:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const leadsRes = await api.get('/leads?limit=50');
      if (leadsRes.data?.success) setLeads(leadsRes.data.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchRecords();
  }, [search, selectedType, selectedStatus, page]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleTypeChange = (type: string) => {
    let subject = `Official Acknowledgement — ${type}`;
    let content = `Dear ${form.contactName || 'Valued Client'},\n\nThis constitutes formal acknowledgement regarding ${type}.\n\nSincerely,\nZEE X AI Team`;

    if (type === 'Quotation Acceptance') {
      subject = `Quotation Acceptance Confirmation`;
      content = `Dear ${form.contactName || 'Client'},\n\nWe formally confirm and acknowledge receipt of your signed acceptance for quotation terms. Milestone planning and hardware allocation will commence per agreed schedule.\n\nBest regards,\nZEE X AI Commercial Team`;
    } else if (type === 'Document Received') {
      subject = `Confidential Document & Specification Receipt Acknowledgement`;
      content = `Dear ${form.contactName || 'Client'},\n\nThis confirms safe receipt of your confidential architectural documents and facility layouts. All materials have been archived under strict NDA protocols.\n\nSincerely,\nZEE X AI Compliance`;
    }

    setForm({
      ...form,
      type,
      subject,
      content,
    });
  };

  const handleLeadSelect = (leadId: string) => {
    const l = leads.find((item) => item._id === leadId);
    if (l) {
      setForm((prev) => ({
        ...prev,
        relatedLead: l._id,
        contactName: `${l.firstName} ${l.lastName}`.trim(),
        company: l.company || '',
        email: l.email || '',
        phone: l.phone || '',
        referenceNumber: prev.referenceNumber || `REF-${l.leadId}`,
      }));
    } else {
      setForm((prev) => ({ ...prev, relatedLead: '' }));
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/acknowledgements', form);
      if (res.data?.success) {
        setShowCreateModal(false);
        fetchRecords();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create acknowledgement');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await api.patch(`/acknowledgements/${id}/status`, { status: newStatus });
      if (res.data?.success) {
        fetchRecords();
        if (selectedItem && selectedItem._id === id) {
          setSelectedItem(res.data.data);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this acknowledgement record?')) return;
    try {
      await api.delete(`/acknowledgements/${id}`);
      fetchRecords();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete record');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Acknowledged':
        return <span className="badge badge-success">Acknowledged</span>;
      case 'Sent':
        return <span className="badge badge-primary">Sent</span>;
      case 'Approved':
        return <span className="badge badge-info">Approved</span>;
      case 'Rejected':
      case 'Expired':
        return <span className="badge badge-danger">{status}</span>;
      default:
        return <span className="badge badge-warning">{status}</span>;
    }
  };

  return (
    <div className="crm-module">
      {/* Module Header */}
      <div className="crm-module-header">
        <div>
          <h1 className="crm-title">Formal Acknowledgements</h1>
          <p className="crm-subtitle">
            Customer confirmation receipts, document intake disclosures, and formal transaction audit records.
          </p>
        </div>
        <div className="crm-actions">
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> New Acknowledgement
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="crm-stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
            <FileCheck2 size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Acknowledgements</div>
            <div className="stat-value">{metrics.total}</div>
            <div className="stat-meta"><span>Recorded in system</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#eab308' }}>
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending Approval</div>
            <div className="stat-value">{metrics.pending}</div>
            <div className="stat-meta"><span>Awaiting sign-off</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <Send size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Transmitted / Sent</div>
            <div className="stat-value">{metrics.sent}</div>
            <div className="stat-meta"><span>Sent to client</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' }}>
            <CheckCircle size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Confirmed & Acknowledged</div>
            <div className="stat-value">{metrics.confirmed}</div>
            <div className="stat-meta"><span>{metrics.overdue} overdue</span></div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="crm-filter-bar">
        <div className="crm-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by ACK ID, ref #, contact name, company, email, subject..."
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
            {ackTypes.map((t) => (
              <option key={t} value={t}>
                {t === 'All' ? 'All Acknowledgement Types' : t}
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
              <th>ACK ID</th>
              <th>Reference #</th>
              <th>Contact & Company</th>
              <th>Acknowledgement Type</th>
              <th>Subject</th>
              <th>Sent Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="crm-spinner" />
                  <p style={{ marginTop: '12px', color: '#64748b' }}>Loading acknowledgements...</p>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                  <FileCheck2 size={36} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
                  <p style={{ color: '#64748b', fontSize: '15px' }}>No acknowledgement records found.</p>
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r._id}>
                  <td>
                    <span className="mono-badge">{r.acknowledgementId}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#4338ca' }}>
                      {r.referenceNumber || '—'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.contactName}</div>
                    {r.company && <div style={{ fontSize: '12px', color: '#64748b' }}>{r.company}</div>}
                  </td>
                  <td>
                    <span className="badge badge-neutral">{r.type}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#334155', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.subject}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      {r.sentDate ? new Date(r.sentDate).toLocaleDateString() : '— Draft'}
                    </div>
                  </td>
                  <td>{getStatusBadge(r.status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions">
                      <button
                        className="action-btn"
                        title="View & Print Official Receipt"
                        onClick={() => {
                          setSelectedItem(r);
                          setShowDocumentModal(true);
                        }}
                      >
                        <Eye size={15} />
                      </button>
                      <select
                        style={{
                          fontSize: '11px',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          background: '#fff',
                        }}
                        value={r.status}
                        onChange={(e) => handleStatusChange(r._id, e.target.value)}
                      >
                        {statusOptions.filter((s) => s !== 'All').map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        className="action-btn delete-btn"
                        title="Delete Record"
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

      {/* CREATE ACKNOWLEDGEMENT MODAL */}
      {showCreateModal && (
        <div className="crm-modal-backdrop">
          <div className="crm-modal-card" style={{ maxWidth: '640px' }}>
            <div className="crm-modal-header">
              <h2>Generate Formal Acknowledgement</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="crm-form">
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Link to Lead (Optional)</label>
                  <select value={form.relatedLead} onChange={(e) => handleLeadSelect(e.target.value)}>
                    <option value="">-- Manual Entry --</option>
                    {leads.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.leadId} — {l.firstName} {l.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Acknowledgement Type *</label>
                  <select value={form.type} onChange={(e) => handleTypeChange(e.target.value)}>
                    {ackTypes.filter((t) => t !== 'All').map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
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
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="aarav@vertexmfg.com"
                  />
                </div>
                <div className="form-group">
                  <label>Reference Number</label>
                  <input
                    type="text"
                    value={form.referenceNumber}
                    onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                    placeholder="e.g. REF-QT-2026-001"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Subject Line *</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Acknowledgement Statement & Body Text *</label>
                <textarea
                  rows={4}
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>

              <div className="crm-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Generate Acknowledgement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW & PRINT FORMAL RECEIPT MODAL */}
      {showDocumentModal && selectedItem && (
        <div className="crm-modal-backdrop">
          <div className="crm-modal-card" style={{ maxWidth: '680px' }}>
            <div className="crm-modal-header">
              <h2>Formal Certificate of Acknowledgement</h2>
              <button className="close-btn" onClick={() => setShowDocumentModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '30px', background: '#ffffff', color: '#0f172a' }}>
              {/* Header Badge */}
              <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px' }}>
                <ShieldCheck size={40} color="#4338ca" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                  ZEE X AI SYSTEMS
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Certificate of Formal Acknowledgement
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#4338ca', marginTop: '6px' }}>
                  ID: {selectedItem.acknowledgementId} · Reference: {selectedItem.referenceNumber || 'DIRECT'}
                </div>
              </div>

              {/* Recipient Details */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Recipient:</span>
                  <span style={{ fontWeight: 600 }}>{selectedItem.contactName}</span>
                </div>
                {selectedItem.company && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Organization:</span>
                    <span style={{ fontWeight: 600 }}>{selectedItem.company}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Acknowledgement Type:</span>
                  <span className="badge badge-neutral">{selectedItem.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Status:</span>
                  <span>{getStatusBadge(selectedItem.status)}</span>
                </div>
              </div>

              {/* Subject & Statement */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  {selectedItem.subject}
                </h3>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#334155',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-line',
                    padding: '16px',
                    background: '#f1f5f9',
                    borderRadius: '6px',
                  }}
                >
                  {selectedItem.content}
                </div>
              </div>

              {/* Verification Stamp / Seal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>VERIFIED DIGITAL RECORD</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>ZEE X AI Operations Command</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Issued: {new Date(selectedItem.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div
                  style={{
                    border: '2px solid #16a34a',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    color: '#16a34a',
                    fontWeight: 800,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  ✓ VERIFIED & LOGGED
                </div>
              </div>
            </div>

            <div className="crm-modal-footer">
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <Printer size={16} /> Print Official Receipt
              </button>
              <button className="btn btn-primary" onClick={() => setShowDocumentModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
