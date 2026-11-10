import React, { useEffect, useState } from 'react';
import {
  Target,
  Plus,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  Copy,
  Pause,
  Play,
  Trash2,
  Edit2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../lib/api';
import { CampaignItem, Lead } from '../types';

const campaignTypes = [
  'All',
  'Email Marketing',
  'Social Media',
  'Paid Advertising',
  'Direct Marketing',
  'Website Campaign',
  'Event Campaign',
  'Other',
];

const statusOptions = ['All', 'Draft', 'Scheduled', 'Active', 'Paused', 'Completed', 'Cancelled'];

const channelOptions = ['Email', 'LinkedIn', 'Google Search Ads', 'Meta', 'Webinar', 'Direct Mail', 'Website Banner'];

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [summary, setSummary] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalBudget: 0,
    totalSpend: 0,
    totalLeads: 0,
    totalConversions: 0,
    totalRevenue: 0,
    overallConversionRate: 0,
    overallRoi: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CampaignItem | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<CampaignItem | null>(null);
  const [associatedLeads, setAssociatedLeads] = useState<Lead[]>([]);

  // Form states
  const [form, setForm] = useState({
    name: '',
    type: 'Email Marketing',
    channel: 'LinkedIn',
    targetAudience: 'Manufacturing & Port Logistics Leaders',
    objective: 'Lead Generation',
    status: 'Active',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    budget: 50000,
    actualSpend: 15000,
    revenueGenerated: 120000,
    trackingCode: '',
    description: '',
    notes: '',
  });

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/campaigns', {
        params: {
          page,
          limit: 20,
          search: query,
          type: selectedType,
          status: selectedStatus,
        },
      });
      if (res.data?.success) {
        setCampaigns(res.data.data);
        if (res.data.summary) setSummary(res.data.summary);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, selectedType, selectedStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCampaigns();
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      name: '',
      type: 'Paid Advertising',
      channel: 'Google Search Ads',
      targetAudience: 'Security Directors & Operations VP',
      objective: 'Demo Request Inflow',
      status: 'Active',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      budget: 50000,
      actualSpend: 10000,
      revenueGenerated: 0,
      trackingCode: 'utm_campaign=ai_security_2026',
      description: 'Search campaign targeting AI surveillance keywords.',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c: CampaignItem) => {
    setEditingItem(c);
    setForm({
      name: c.name,
      type: c.type,
      channel: c.channel,
      targetAudience: c.targetAudience || '',
      objective: c.objective || '',
      status: c.status,
      startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : '',
      endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : '',
      budget: c.budget,
      actualSpend: c.actualSpend,
      revenueGenerated: c.revenueGenerated,
      trackingCode: c.trackingCode,
      description: c.description || '',
      notes: c.notes || '',
    });
    setShowModal(true);
  };

  const handleOpenDetail = async (c: CampaignItem) => {
    setSelectedDetail(c);
    try {
      const res = await api.get(`/campaigns/${c._id}`);
      if (res.data?.success) {
        setSelectedDetail(res.data.data);
        setAssociatedLeads(res.data.associatedLeads || []);
      }
    } catch {
      setAssociatedLeads([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const res = await api.patch(`/campaigns/${editingItem._id}`, form);
        if (res.data?.success) {
          setShowModal(false);
          fetchCampaigns();
        }
      } else {
        const res = await api.post('/campaigns', form);
        if (res.data?.success) {
          setShowModal(false);
          fetchCampaigns();
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving campaign');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await api.post(`/campaigns/${id}/duplicate`);
      if (res.data?.success) {
        fetchCampaigns();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to duplicate campaign');
    }
  };

  const handleToggleStatus = async (c: CampaignItem) => {
    const nextStatus = c.status === 'Active' ? 'Paused' : 'Active';
    try {
      await api.patch(`/campaigns/${c._id}`, { status: nextStatus });
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update campaign status');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this marketing campaign?')) {
      try {
        await api.delete(`/campaigns/${id}`);
        fetchCampaigns();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Error deleting campaign');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="badge badge-green">Active</span>;
      case 'Scheduled':
        return <span className="badge badge-blue">Scheduled</span>;
      case 'Paused':
        return <span className="badge badge-amber">Paused</span>;
      case 'Completed':
        return <span className="badge badge-violet">Completed</span>;
      case 'Cancelled':
        return <span className="badge badge-red">Cancelled</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  return (
    <>
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">Workspace / Marketing Campaigns</p>
          <h1>Marketing Campaigns &amp; Attribution</h1>
          <p className="subheading">
            Measure multi-channel outreach, monitor pipeline conversion, and track cost per lead.
          </p>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Create Campaign
          </button>
        </div>
      </div>

      {/* KPI Performance Cards */}
      <div className="stats-grid" style={{ marginBottom: '22px' }}>
        <div className="stat-card">
          <div className="stat-icon violet">
            <Target size={18} />
          </div>
          <div className="stat-label">Active Campaigns</div>
          <div className="stat-value">{summary.activeCampaigns}</div>
          <div className="stat-change">
            <span>{summary.totalCampaigns}</span> <small>total recorded</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <DollarSign size={18} />
          </div>
          <div className="stat-label">Total Spend / Budget</div>
          <div className="stat-value">₹{(summary.totalSpend / 1000).toFixed(0)}k</div>
          <div className="stat-change">
            <span>Budget: ₹{(summary.totalBudget / 1000).toFixed(0)}k</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Users size={18} />
          </div>
          <div className="stat-label">Leads Generated</div>
          <div className="stat-value">{summary.totalLeads}</div>
          <div className="stat-change">
            <span>{summary.totalConversions} converted</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <TrendingUp size={18} />
          </div>
          <div className="stat-label">Average ROI</div>
          <div className="stat-value">{summary.overallRoi}%</div>
          <div className="stat-change">
            <span>{summary.overallConversionRate}% conversion rate</span>
          </div>
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
              placeholder="Search campaigns by name, code, objective..."
            />
          </div>
          <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}>
            {campaignTypes.map((t) => (
              <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
            ))}
          </select>
          <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>
          <button type="submit" className="filter-btn">
            <Filter size={14} /> Filter
          </button>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Channel &amp; Type</th>
                <th>Dates</th>
                <th>Spend / Budget</th>
                <th>Leads</th>
                <th>Cost / Lead</th>
                <th>ROI</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#777a8f' }}>
                    Loading marketing campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#9295a7' }}>
                    No campaigns found. Click &quot;Create Campaign&quot; to launch your first marketing campaign.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div>
                        <strong style={{ color: '#20223b', fontSize: '12px' }}>{c.name}</strong>
                        <div style={{ fontSize: '10px', color: '#6045f5', fontWeight: 600 }}>{c.campaignId}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#33354a' }}>{c.channel}</span>
                      <small style={{ display: 'block', color: '#888b9f', fontSize: '10px' }}>{c.type}</small>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', color: '#333' }}>
                        {c.startDate ? new Date(c.startDate).toLocaleDateString() : '—'}
                      </span>
                      {c.endDate && (
                        <small style={{ display: 'block', color: '#888b9f', fontSize: '9px' }}>
                          to {new Date(c.endDate).toLocaleDateString()}
                        </small>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#20223b' }}>
                        ₹{c.actualSpend.toLocaleString()}
                      </div>
                      <small style={{ color: '#9598ab', fontSize: '10px' }}>
                        Budget: ₹{c.budget.toLocaleString()}
                      </small>
                    </td>
                    <td>
                      <strong style={{ color: '#6045f5', fontSize: '13px' }}>{c.leadsGenerated}</strong>
                      <small style={{ display: 'block', color: '#16a36a', fontSize: '10px' }}>
                        {c.conversions} won
                      </small>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>
                        {c.metrics?.costPerLead ? `₹${c.metrics.costPerLead}` : '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: (c.metrics?.roi || 0) >= 0 ? '#16a36a' : '#e03131',
                        }}
                      >
                        {c.metrics?.roi !== undefined ? `${c.metrics.roi}%` : '—'}
                      </span>
                    </td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="icon-btn"
                          style={{ height: '28px', width: '28px' }}
                          onClick={() => handleOpenDetail(c)}
                          title="View Analytics & Associated Leads"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="icon-btn"
                          style={{ height: '28px', width: '28px' }}
                          onClick={() => handleToggleStatus(c)}
                          title={c.status === 'Active' ? 'Pause Campaign' : 'Resume Campaign'}
                        >
                          {c.status === 'Active' ? <Pause size={13} /> : <Play size={13} />}
                        </button>
                        <button
                          className="icon-btn"
                          style={{ height: '28px', width: '28px' }}
                          onClick={() => handleDuplicate(c._id)}
                          title="Duplicate Campaign"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          className="icon-btn"
                          style={{ height: '28px', width: '28px' }}
                          onClick={() => handleOpenEdit(c)}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="icon-btn"
                          style={{ height: '28px', width: '28px', color: '#e03131' }}
                          onClick={() => handleDelete(c._id)}
                          title="Delete"
                        >
                          <Trash2 size={13} />
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
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} campaigns)
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

      {/* Campaign Detail & Analytics Modal */}
      {selectedDetail && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '680px' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">{selectedDetail.campaignId} · Performance Overview</p>
                <h2>{selectedDetail.name}</h2>
              </div>
              <button className="icon-btn" onClick={() => setSelectedDetail(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Analytics metrics grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '10px',
                  background: '#f8f9fc',
                  padding: '14px',
                  borderRadius: '10px',
                  textAlign: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '10px', color: '#888b9f', textTransform: 'uppercase' }}>
                    Leads Generated
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#6045f5', marginTop: '4px' }}>
                    {selectedDetail.leadsGenerated}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#888b9f', textTransform: 'uppercase' }}>
                    Conversion Rate
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a36a', marginTop: '4px' }}>
                    {selectedDetail.metrics?.conversionRate || 0}%
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#888b9f', textTransform: 'uppercase' }}>
                    Cost Per Lead
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#20223b', marginTop: '4px' }}>
                    ₹{selectedDetail.metrics?.costPerLead || 0}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#888b9f', textTransform: 'uppercase' }}>
                    Return on Investment
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#4263eb', marginTop: '4px' }}>
                    {selectedDetail.metrics?.roi || 0}%
                  </div>
                </div>
              </div>

              {/* Attribution & Tracking Info */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  border: '1px solid #e8eaf2',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                }}
              >
                <div>
                  <span style={{ color: '#888b9f' }}>Channel &amp; Type:</span>
                  <strong style={{ display: 'block', color: '#20223b' }}>
                    {selectedDetail.channel} · {selectedDetail.type}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#888b9f' }}>Tracking Identifier:</span>
                  <code style={{ display: 'block', color: '#6045f5', background: '#eeebff', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>
                    {selectedDetail.trackingCode || '—'}
                  </code>
                </div>
                <div>
                  <span style={{ color: '#888b9f' }}>Target Audience:</span>
                  <span style={{ display: 'block', color: '#333' }}>{selectedDetail.targetAudience || '—'}</span>
                </div>
                <div>
                  <span style={{ color: '#888b9f' }}>Revenue Produced:</span>
                  <strong style={{ display: 'block', color: '#16a36a' }}>
                    ₹{selectedDetail.revenueGenerated?.toLocaleString() || 0}
                  </strong>
                </div>
              </div>

              {/* Associated Leads Table */}
              <div>
                <label className="eyebrow">Attributed Leads In Pipeline ({associatedLeads.length})</label>
                <div style={{ border: '1px solid #e8eaf2', borderRadius: '8px', overflow: 'hidden', maxHeight: '160px', overflowY: 'auto' }}>
                  {associatedLeads.length === 0 ? (
                    <p style={{ padding: '16px', fontSize: '11px', color: '#9295a7', textAlign: 'center', margin: 0 }}>
                      No incoming leads directly attributed to this campaign tag yet.
                    </p>
                  ) : (
                    <table style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Lead</th>
                          <th>Company</th>
                          <th>Product</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {associatedLeads.map((l) => (
                          <tr key={l._id}>
                            <td>
                              <strong>{l.firstName} {l.lastName}</strong>
                              <small style={{ display: 'block', color: '#888' }}>{l.leadId}</small>
                            </td>
                            <td>{l.company}</td>
                            <td>{l.interestedProduct}</td>
                            <td><span className="badge badge-blue">{l.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedDetail(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Create / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '640px' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">{editingItem ? 'Edit Campaign' : 'New Marketing Campaign'}</p>
                <h2>{editingItem ? 'Update Campaign Record' : 'Launch New Campaign'}</h2>
              </div>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="form-grid">
              <label className="wide">
                Campaign Name *
                <input
                  required
                  placeholder="e.g. Q3 Autonomous CCTV AI Demonstration"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>

              <label>
                Campaign Type *
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {campaignTypes.slice(1).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>

              <label>
                Marketing Channel
                <select
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                >
                  {channelOptions.map((ch) => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {statusOptions.slice(1).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label>
                Tracking / Source Code
                <input
                  placeholder="e.g. utm_campaign=q3_cctv_ai"
                  value={form.trackingCode}
                  onChange={(e) => setForm({ ...form, trackingCode: e.target.value })}
                />
              </label>

              <label>
                Start Date
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </label>

              <label>
                End Date
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </label>

              <label>
                Allocated Budget (₹)
                <input
                  type="number"
                  placeholder="50000"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                />
              </label>

              <label>
                Actual Spend (₹)
                <input
                  type="number"
                  placeholder="15000"
                  value={form.actualSpend}
                  onChange={(e) => setForm({ ...form, actualSpend: Number(e.target.value) })}
                />
              </label>

              <label className="wide">
                Target Audience
                <input
                  placeholder="e.g. Factory Safety Directors, Logistics &amp; Port Authorities"
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                />
              </label>

              <label className="wide">
                Campaign Description / Strategy
                <textarea
                  rows={2}
                  placeholder="Briefly state campaign objectives, promotional copy, or messaging..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>

              <div className="modal-actions" style={{ gridColumn: 'span 2' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Save Changes' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
