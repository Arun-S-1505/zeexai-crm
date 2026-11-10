import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  X,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
} from 'lucide-react';
import api from '../lib/api';
import { BrochureDownloadItem } from '../types';

const brochureTypes = [
  'All',
  'Z-Factory Overview',
  'Z-Factory Technical Whitepaper',
  'Z-Tracs Fleet Monitoring Brief',
  'Z-Drone Autonomous Security Specs',
  'Z-Market Retail Analytics Guide',
  'Z-Consultancy Architecture Deck',
];

const statusOptions = ['All', 'New', 'Contacted', 'Qualified', 'Converted', 'Archived'];

export const BrochureDownloadsPage: React.FC = () => {
  const [downloads, setDownloads] = useState<BrochureDownloadItem[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, new: 0, converted: 0, repeat: 0 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BrochureDownloadItem | null>(null);
  const [historyItems, setHistoryItems] = useState<BrochureDownloadItem[]>([]);
  const [editNote, setEditNote] = useState('');
  const [newStatus, setNewStatus] = useState('New');

  // Form states
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    brochureType: 'Z-Factory Overview',
    source: 'Website Download',
    notes: '',
    createLead: true,
  });

  const fetchDownloads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/brochure-downloads', {
        params: {
          page,
          limit: 20,
          search: query,
          brochureType: selectedType,
          status: selectedStatus,
        },
      });
      if (res.data?.success) {
        setDownloads(res.data.data);
        if (res.data.metrics) setMetrics(res.data.metrics);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load brochure downloads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, [page, selectedType, selectedStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDownloads();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/brochure-downloads', form);
      if (res.data?.success) {
        setShowAddModal(false);
        setForm({
          name: '',
          email: '',
          company: '',
          phone: '',
          brochureType: 'Z-Factory Overview',
          source: 'Website Download',
          notes: '',
          createLead: true,
        });
        fetchDownloads();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error recording download');
    }
  };

  const handleOpenDetail = async (item: BrochureDownloadItem) => {
    setSelectedItem(item);
    setEditNote(item.notes || '');
    setNewStatus(item.status);
    try {
      const res = await api.get(`/brochure-downloads/${item._id}`);
      if (res.data?.success) {
        setHistoryItems(res.data.history || []);
      }
    } catch {
      setHistoryItems([]);
    }
  };

  const handleSaveDetail = async () => {
    if (!selectedItem) return;
    try {
      const res = await api.patch(`/brochure-downloads/${selectedItem._id}`, {
        status: newStatus,
        notes: editNote,
      });
      if (res.data?.success) {
        setSelectedItem(null);
        fetchDownloads();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update record');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this brochure download record?')) {
      try {
        await api.delete(`/brochure-downloads/${id}`);
        fetchDownloads();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Error deleting record');
      }
    }
  };

  const exportCSV = () => {
    const headers = ['Download ID', 'Name', 'Email', 'Company', 'Phone', 'Brochure', 'Status', 'Date', 'Repeat'];
    const rows = downloads.map((d) => [
      d.downloadId,
      `"${d.name}"`,
      d.email,
      `"${d.company || ''}"`,
      d.phone || '',
      `"${d.brochureType}"`,
      d.status,
      new Date(d.createdAt).toLocaleString(),
      d.isRepeat ? 'Yes' : 'No',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zeexai_brochure_downloads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return <span className="badge badge-blue">New</span>;
      case 'Contacted':
        return <span className="badge badge-violet">Contacted</span>;
      case 'Qualified':
        return <span className="badge badge-amber">Qualified</span>;
      case 'Converted':
        return <span className="badge badge-green">Converted</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  return (
    <>
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">Workspace / Brochure Downloads</p>
          <h1>Brochure Downloads</h1>
          <p className="subheading">
            Track whitepaper and technical documentation downloads captured through the ZEE X AI website.
          </p>
        </div>
        <div className="heading-actions">
          <button className="btn btn-secondary" onClick={exportCSV}>
            <Download size={15} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Record Download
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="lead-kpis" style={{ marginBottom: '22px' }}>
        <div>
          <span>Total Downloads</span>
          <strong>{metrics.total}</strong>
        </div>
        <div>
          <span>New Requests</span>
          <strong className="blue-text">{metrics.new}</strong>
        </div>
        <div>
          <span>Converted to Lead</span>
          <strong className="green-text">{metrics.converted}</strong>
        </div>
        <div>
          <span>Repeat Downloaders</span>
          <strong className="amber-text">{metrics.repeat}</strong>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card lead-card">
        <form onSubmit={handleSearch} className="table-toolbar">
          <div className="table-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, company, phone..."
            />
          </div>
          <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}>
            {brochureTypes.map((t) => (
              <option key={t} value={t}>{t === 'All' ? 'All Brochures' : t}</option>
            ))}
          </select>
          <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>
          <button type="submit" className="filter-btn">
            <Filter size={15} /> Filter
          </button>
        </form>

        <div className="table-wrap no-horiz-scroll">
          <table className="brochure-downloads-table">
            <thead>
              <tr>
                <th style={{ width: '9%' }}>ID</th>
                <th style={{ width: '23%' }}>Requester</th>
                <th style={{ width: '18%' }}>Company</th>
                <th style={{ width: '23%' }}>Brochure Document</th>
                <th style={{ width: '10%' }}>Source</th>
                <th style={{ width: '10%' }}>Date</th>
                <th style={{ width: '7%' }}>Status</th>
                <th style={{ width: '5%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#777a8f' }}>
                    Loading brochure downloads...
                  </td>
                </tr>
              ) : downloads.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#9295a7' }}>
                    No brochure download inquiries found matching your filters.
                  </td>
                </tr>
              ) : (
                downloads.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <span className="mono-badge">{d.downloadId}</span>
                    </td>
                    <td>
                      <div className="lead-name">
                        <div className="avatar avatar-soft" style={{ flexShrink: 0 }}>
                          {d.name ? d.name.slice(0, 2).toUpperCase() : 'BD'}
                        </div>
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                          <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</strong>
                          <small style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.email}</small>
                        </div>
                        {d.isRepeat && (
                          <span
                            className="badge badge-amber"
                            style={{ flexShrink: 0, marginLeft: '4px', fontSize: '9px', padding: '2px 5px' }}
                            title={`${d.downloadCount} downloads from this email`}
                          >
                            <RefreshCw size={10} style={{ marginRight: '3px' }} /> ({d.downloadCount})
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <span style={{ fontWeight: 600, color: '#33354a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.company || '—'}</span>
                        {d.phone && <div style={{ fontSize: '11px', color: '#717488', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.phone}</div>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <FileText size={16} color="#6045f5" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#1e293b', lineHeight: '1.3' }}>
                          {d.brochureType}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontSize: '10px' }}>{d.source}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', color: '#334155', fontWeight: 500, display: 'block' }}>
                        {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                      <small style={{ display: 'block', color: '#94a3b8', fontSize: '10px' }}>
                        {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </td>
                    <td>{getStatusBadge(d.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          className="icon-btn"
                          style={{ height: '28px', width: '28px' }}
                          onClick={() => handleOpenDetail(d)}
                          title="View Details & Notes"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="icon-btn"
                          style={{ height: '28px', width: '28px', color: '#ef4444' }}
                          onClick={() => handleDelete(d._id)}
                          title="Delete Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total records)
          </span>
          <div>
            <button
              className="pagination"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: '11px', padding: '0 8px' }}>Page {page}</span>
            <button
              className="pagination"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: View Details & Notes */}
      {selectedItem && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '580px' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">{selectedItem.downloadId} · Inquiry Detail</p>
                <h2>{selectedItem.name}</h2>
              </div>
              <button className="icon-btn" onClick={() => setSelectedItem(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  background: '#f8f9fc',
                  padding: '14px',
                  borderRadius: '10px',
                  fontSize: '11.5px',
                }}
              >
                <div>
                  <span style={{ color: '#888b9e' }}>Email:</span>
                  <strong style={{ display: 'block', color: '#20223b' }}>{selectedItem.email}</strong>
                </div>
                <div>
                  <span style={{ color: '#888b9e' }}>Phone:</span>
                  <strong style={{ display: 'block', color: '#20223b' }}>{selectedItem.phone || 'Not provided'}</strong>
                </div>
                <div>
                  <span style={{ color: '#888b9e' }}>Company:</span>
                  <strong style={{ display: 'block', color: '#20223b' }}>{selectedItem.company || 'Not provided'}</strong>
                </div>
                <div>
                  <span style={{ color: '#888b9e' }}>Brochure:</span>
                  <strong style={{ display: 'block', color: '#6045f5' }}>{selectedItem.brochureType}</strong>
                </div>
                <div>
                  <span style={{ color: '#888b9e' }}>Source:</span>
                  <span style={{ display: 'block' }}>{selectedItem.source}</span>
                </div>
                <div>
                  <span style={{ color: '#888b9e' }}>Associated Lead:</span>
                  {selectedItem.relatedLead ? (
                    <strong style={{ color: '#16a36a' }}>
                      Linked ({selectedItem.relatedLead.leadId})
                    </strong>
                  ) : (
                    <span style={{ color: '#a0a2b5' }}>No lead linked</span>
                  )}
                </div>
              </div>

              {/* Repeat download activity log */}
              {historyItems.length > 0 && (
                <div>
                  <label className="eyebrow" style={{ color: '#e79400' }}>
                    Repeat Activity History ({historyItems.length} other downloads)
                  </label>
                  <div
                    style={{
                      maxHeight: '110px',
                      overflowY: 'auto',
                      border: '1px solid #e8eaf2',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                  >
                    {historyItems.map((h) => (
                      <div
                        key={h._id}
                        style={{
                          fontSize: '11px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '4px 0',
                          borderBottom: '1px solid #f0f0f6',
                        }}
                      >
                        <span>{h.brochureType}</span>
                        <span style={{ color: '#888' }}>{new Date(h.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div>
                <label className="eyebrow">Change Pipeline Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #e8eaf2', padding: '0 10px' }}
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Converted">Converted</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="eyebrow">Internal Team Notes</label>
                <textarea
                  rows={3}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Add notes about customer follow-up or discussions..."
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid #e8eaf2', padding: '10px', fontSize: '11.5px' }}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '6px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedItem(null)}>
                  Close
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveDetail}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record Manual Brochure Download */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <div>
                <p className="eyebrow">New Inquiry</p>
                <h2>Record Brochure Download</h2>
              </div>
              <button className="icon-btn" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="form-grid">
              <label>
                Contact Name *
                <input
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Email Address *
                <input
                  type="email"
                  required
                  placeholder="rahul@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label>
                Company Name
                <input
                  placeholder="Organization or firm"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </label>
              <label>
                Phone Number
                <input
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
              <label className="wide">
                Brochure Document *
                <select
                  value={form.brochureType}
                  onChange={(e) => setForm({ ...form, brochureType: e.target.value })}
                >
                  {brochureTypes.slice(1).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="wide">
                Notes
                <textarea
                  rows={2}
                  placeholder="Optional context about inquiry..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </label>
              <label className="wide" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={form.createLead}
                  onChange={(e) => setForm({ ...form, createLead: e.target.checked })}
                  style={{ accentColor: '#6045f5', width: '16px', height: '16px' }}
                />
                <span>Also automatically add as a prospective lead in Leads &amp; Requests</span>
              </label>
              <div className="modal-actions" style={{ gridColumn: 'span 2' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
