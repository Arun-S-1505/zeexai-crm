import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Search,
  Clock,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  History,
  Layers,
} from 'lucide-react';
import api from '../lib/api';
import { Lead, TeamWorkloadItem, User as UserType, LeadAssignmentHistoryItem } from '../types';

export const LeadAssignmentPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [team, setTeam] = useState<TeamWorkloadItem[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    assignedLeads: 0,
    unassignedLeads: 0,
    assignedToday: 0,
    overdueFollowUps: 0,
  });

  // Filters & selection
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [assignmentHistory, setAssignmentHistory] = useState<LeadAssignmentHistoryItem[]>([]);

  // Assign Form
  const [assignForm, setAssignForm] = useState({
    assignedTo: '',
    reason: 'Initial sales workload allocation',
    priority: 'Medium',
    notes: '',
  });

  // Bulk Assign target
  const [bulkAssignee, setBulkAssignee] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assignments/leads', {
        params: {
          search,
          assignedTo: filterAssignee,
          priority: filterPriority,
          unassigned: unassignedOnly ? 'true' : undefined,
          page,
          limit: 15,
        },
      });
      if (res.data?.success) {
        setLeads(res.data.data || []);
        if (res.data.pagination) setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch leads for assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, workloadRes, usersRes] = await Promise.all([
        api.get('/assignments/metrics'),
        api.get('/assignments/workload'),
        api.get('/users'),
      ]);

      if (metricsRes.data?.success) setMetrics(metricsRes.data.metrics);
      if (workloadRes.data?.success) setTeam(workloadRes.data.data || []);
      if (usersRes.data?.success) setUsers(usersRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, filterAssignee, filterPriority, unassignedOnly, page]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeadIds(leads.map((l) => l._id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSingleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !assignForm.assignedTo) return;
    try {
      const res = await api.post('/assignments/assign', {
        leadId: activeLead._id,
        assignedTo: assignForm.assignedTo,
        reason: assignForm.reason,
        priority: assignForm.priority,
        notes: assignForm.notes,
      });

      if (res.data?.success) {
        setShowAssignModal(false);
        fetchLeads();
        fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign lead');
    }
  };

  const handleBulkAssign = async () => {
    if (selectedLeadIds.length === 0 || !bulkAssignee) return;
    try {
      const res = await api.post('/assignments/bulk-assign', {
        leadIds: selectedLeadIds,
        assignedTo: bulkAssignee,
        reason: 'Bulk team allocation',
      });

      if (res.data?.success) {
        setSelectedLeadIds([]);
        setBulkAssignee('');
        fetchLeads();
        fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Bulk assignment failed');
    }
  };

  const handleRoundRobin = async () => {
    if (!confirm('Evenly distribute unassigned leads across active staff using round-robin distribution?')) return;
    try {
      const res = await api.post('/assignments/round-robin', {
        leadIds: selectedLeadIds.length > 0 ? selectedLeadIds : undefined,
      });

      if (res.data?.success) {
        alert(res.data.message);
        setSelectedLeadIds([]);
        fetchLeads();
        fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Round robin failed');
    }
  };

  const openHistory = async (lead: Lead) => {
    setActiveLead(lead);
    setShowHistoryModal(true);
    try {
      const res = await api.get(`/assignments/history/${lead._id}`);
      if (res.data?.success) {
        setAssignmentHistory(res.data.data || []);
      }
    } catch (_) {}
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return <span className="badge badge-danger">Urgent</span>;
      case 'High':
        return <span className="badge badge-warning">High</span>;
      case 'Medium':
        return <span className="badge badge-info">Medium</span>;
      default:
        return <span className="badge badge-neutral">Low</span>;
    }
  };

  return (
    <div className="crm-module">
      {/* Module Header */}
      <div className="crm-module-header">
        <div>
          <h1 className="crm-title">Lead Assignment & Workload</h1>
          <p className="crm-subtitle">
            Sales representative lead distribution, territory load balancing, and round-robin automation.
          </p>
        </div>
        <div className="crm-actions">
          <button className="btn btn-secondary" onClick={handleRoundRobin}>
            <Shuffle size={16} /> Auto Round-Robin
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="crm-stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
            <Layers size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Pipeline Leads</div>
            <div className="stat-value">{metrics.totalLeads}</div>
            <div className="stat-meta"><span>Across all channels</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' }}>
            <UserCheck size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Assigned Leads</div>
            <div className="stat-value">{metrics.assignedLeads}</div>
            <div className="stat-meta"><span>{metrics.assignedToday} assigned today</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#eab308' }}>
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Unassigned Leads</div>
            <div className="stat-value">{metrics.unassignedLeads}</div>
            <div className="stat-meta"><span>Requires sales allocation</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
            <AlertCircle size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Overdue Follow-ups</div>
            <div className="stat-value">{metrics.overdueFollowUps}</div>
            <div className="stat-meta"><span>Action required</span></div>
          </div>
        </div>
      </div>

      {/* Team Workload Breakdown Cards */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
          Team Workload Overview
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {team.map((member) => (
            <div
              key={member.userId}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{member.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{member.role}</div>
                </div>
                <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                  {member.totalAssigned} Leads
                </span>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                <span>Open: <strong>{member.openLeads}</strong></span>
                <span>Won: <strong style={{ color: '#16a34a' }}>{member.convertedLeads}</strong></span>
                <span>Overdue: <strong style={{ color: member.overdueFollowUps > 0 ? '#dc2626' : '#64748b' }}>{member.overdueFollowUps}</strong></span>
              </div>

              {/* Progress Bar */}
              <div style={{ marginTop: '10px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, member.totalAssigned * 15)}%`,
                    background: member.totalAssigned > 5 ? '#f59e0b' : '#6366f1',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar (Visible when leads are selected) */}
      {selectedLeadIds.length > 0 && (
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '12px 18px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: 600 }}>
            {selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? 's' : ''} selected
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={bulkAssignee}
              onChange={(e) => setBulkAssignee(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '13px' }}
            >
              <option value="">-- Assign selected to... --</option>
              {users.map((u) => (
                <option key={u.id || u._id} value={u.id || u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" disabled={!bulkAssignee} onClick={handleBulkAssign}>
              Assign Selected
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedLeadIds([])}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="crm-filter-bar">
        <div className="crm-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search leads by ID, name, company, email, phone..."
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
          <button
            className={`btn btn-sm ${unassignedOnly ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setUnassignedOnly(!unassignedOnly);
              setPage(1);
            }}
          >
            Unassigned Only
          </button>

          <select
            value={filterAssignee}
            onChange={(e) => {
              setFilterAssignee(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Staff Members</option>
            {users.map((u) => (
              <option key={u.id || u._id} value={u.id || u._id}>
                {u.name}
              </option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => {
              setFilterPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="crm-table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectedLeadIds.length === leads.length && leads.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Lead ID</th>
              <th>Contact Name & Company</th>
              <th>Product & Source</th>
              <th>Priority</th>
              <th>Current Assignee</th>
              <th>Lead Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="crm-spinner" />
                  <p style={{ marginTop: '12px', color: '#64748b' }}>Loading leads...</p>
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                  <UserCheck size={36} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
                  <p style={{ color: '#64748b', fontSize: '15px' }}>No matching leads found.</p>
                </td>
              </tr>
            ) : (
              leads.map((l) => (
                <tr key={l._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.includes(l._id)}
                      onChange={() => handleToggleSelect(l._id)}
                    />
                  </td>
                  <td>
                    <span className="mono-badge">{l.leadId}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {l.firstName} {l.lastName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{l.company}</div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{l.interestedProduct}</span>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{l.source}</div>
                  </td>
                  <td>{getPriorityBadge(l.priority)}</td>
                  <td>
                    {l.assignedTo ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#e0e7ff',
                            color: '#4338ca',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          {(l.assignedTo.name || 'U')[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>
                            {l.assignedTo.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{l.assignedTo.role}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="badge badge-warning">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-neutral">{l.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setActiveLead(l);
                          setAssignForm({
                            assignedTo: l.assignedTo?._id || '',
                            reason: l.assignedTo ? 'Reassignment' : 'Direct manual assignment',
                            priority: l.priority || 'Medium',
                            notes: '',
                          });
                          setShowAssignModal(true);
                        }}
                      >
                        {l.assignedTo ? 'Reassign' : 'Assign'}
                      </button>
                      <button
                        className="action-btn"
                        title="View Assignment History"
                        onClick={() => openHistory(l)}
                      >
                        <History size={15} />
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

      {/* ASSIGN / REASSIGN MODAL */}
      {showAssignModal && activeLead && (
        <div className="crm-modal-backdrop">
          <div className="crm-modal-card" style={{ maxWidth: '480px' }}>
            <div className="crm-modal-header">
              <h2>Assign Lead {activeLead.leadId}</h2>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSingleAssign} className="crm-form">
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', marginBottom: '14px' }}>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  {activeLead.firstName} {activeLead.lastName}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {activeLead.company} · {activeLead.interestedProduct}
                </div>
              </div>

              <div className="form-group">
                <label>Assign To Staff Member *</label>
                <select
                  required
                  value={assignForm.assignedTo}
                  onChange={(e) => setAssignForm({ ...assignForm, assignedTo: e.target.value })}
                >
                  <option value="">-- Select Team Member --</option>
                  {users.map((u) => (
                    <option key={u.id || u._id} value={u.id || u._id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Assignment Reason</label>
                <input
                  type="text"
                  value={assignForm.reason}
                  onChange={(e) => setAssignForm({ ...assignForm, reason: e.target.value })}
                  placeholder="e.g. Territory specialty, technical demo requirements"
                />
              </div>

              <div className="form-group">
                <label>Lead Priority</label>
                <select
                  value={assignForm.priority}
                  onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
                >
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="form-group">
                <label>Internal Assignment Note</label>
                <textarea
                  rows={2}
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  placeholder="Handoff instructions for the new assignee..."
                />
              </div>

              <div className="crm-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && activeLead && (
        <div className="crm-modal-backdrop">
          <div className="crm-modal-card" style={{ maxWidth: '540px' }}>
            <div className="crm-modal-header">
              <h2>Assignment History — {activeLead.leadId}</h2>
              <button className="close-btn" onClick={() => setShowHistoryModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 600 }}>{activeLead.firstName} {activeLead.lastName}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{activeLead.company}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {assignmentHistory.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No assignment audit history recorded yet.
                  </div>
                ) : (
                  assignmentHistory.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>
                          {h.method} Assignment
                        </span>
                        <span style={{ color: '#94a3b8' }}>
                          {new Date(h.assignedAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ color: '#334155' }}>
                        Assigned to: <strong>{h.newAssignee?.name || 'Staff Member'}</strong>
                        {h.previousAssignee && (
                          <span> (Previously: {h.previousAssignee.name})</span>
                        )}
                      </div>
                      {h.reason && <div style={{ color: '#64748b', marginTop: '2px' }}>Reason: {h.reason}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="crm-modal-footer">
              <button className="btn btn-primary" onClick={() => setShowHistoryModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
