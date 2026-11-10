import React, { useEffect, useState } from 'react';
import {
  Users,
  Shield,
  Key,
  History,
  Building,
  CheckCircle2,
  Plus,
  Lock,
  X,
  Search,
} from 'lucide-react';
import api from '../lib/api';
import { GeneralSettingsData, User as UserType, AuditLogItem } from '../types';

type SettingsTab = 'general' | 'users' | 'roles' | 'integrations' | 'audit';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [toast, setToast] = useState<string | null>(null);

  // General Settings State
  const [general, setGeneral] = useState<GeneralSettingsData>({
    organizationName: 'ZEE X AI Systems Pvt Ltd',
    contactEmail: 'contact@zeexai.com',
    contactPhone: '+91 (044) 4892-0100',
    address: 'Level 4, TIDEL Park, Tharamani, Chennai, TN 600113',
    website: 'https://zeexai.com',
    defaultCurrency: 'INR (₹)',
    timeZone: 'Asia/Kolkata (IST)',
    dateFormat: 'DD/MM/YYYY',
  });
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Users State
  const [userList, setUserList] = useState<UserType[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'INTERN',
  });
  const [resetUser, setResetUser] = useState<UserType | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Integrations State
  const [integrations, setIntegrations] = useState<any[]>([]);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModule, setAuditModule] = useState('All');

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchGeneral = async () => {
    try {
      const res = await api.get('/settings/general');
      if (res.data?.success && res.data.data) {
        setGeneral(res.data.data);
      }
    } catch (_) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/settings/users');
      if (res.data?.success) setUserList(res.data.data || []);
    } catch (_) {}
  };

  const fetchIntegrations = async () => {
    try {
      const res = await api.get('/settings/integrations');
      if (res.data?.success) setIntegrations(res.data.integrations || []);
    } catch (_) {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/settings/audit-logs', {
        params: { search: auditSearch, module: auditModule },
      });
      if (res.data?.success) setAuditLogs(res.data.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchGeneral();
    fetchUsers();
    fetchIntegrations();
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
  }, [auditSearch, auditModule]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      const res = await api.put('/settings/general', general);
      if (res.data?.success) {
        showToastMsg('General organization profile saved successfully');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/settings/users', newUserForm);
      if (res.data?.success) {
        setShowAddUserModal(false);
        setNewUserForm({ name: '', email: '', password: '', role: 'INTERN' });
        showToastMsg('User added successfully');
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const res = await api.patch(`/settings/users/${userId}/role`, { role });
      if (res.data?.success) {
        showToastMsg(`Role updated to ${role}`);
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleStatus = async (user: any) => {
    const nextStatus = !user.isActive;
    try {
      const res = await api.patch(`/settings/users/${user._id || user.id}/status`, { isActive: nextStatus });
      if (res.data?.success) {
        showToastMsg(`User ${nextStatus ? 'activated' : 'deactivated'}`);
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !newPassword) return;
    try {
      const res = await api.post(`/settings/users/${resetUser._id || resetUser.id}/reset-password`, {
        newPassword,
      });
      if (res.data?.success) {
        setResetUser(null);
        setNewPassword('');
        showToastMsg('Password reset successfully');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="crm-module">
      {/* Toast Feedback */}
      {toast && (
        <div className="z-login-toast" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Module Header */}
      <div className="crm-module-header">
        <div>
          <h1 className="crm-title">System Settings & Governance</h1>
          <p className="crm-subtitle">
            Organization identity, team role management, security boundaries, and audit logging.
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '24px',
          overflowX: 'auto',
        }}
      >
        <button
          className={`btn ${activeTab === 'general' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '6px 6px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('general')}
        >
          <Building size={15} /> General Profile
        </button>
        <button
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '6px 6px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('users')}
        >
          <Users size={15} /> User Management
        </button>
        <button
          className={`btn ${activeTab === 'roles' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '6px 6px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('roles')}
        >
          <Shield size={15} /> Roles & Permissions
        </button>
        <button
          className={`btn ${activeTab === 'integrations' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '6px 6px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('integrations')}
        >
          <Key size={15} /> Integrations & Gateway
        </button>
        <button
          className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '6px 6px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('audit')}
        >
          <History size={15} /> System Audit Trail
        </button>
      </div>

      {/* TAB 1: General Settings */}
      {activeTab === 'general' && (
        <div style={{ maxWidth: '720px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
            Enterprise Organization Profile
          </h2>
          <form onSubmit={handleSaveGeneral} className="crm-form">
            <div className="form-group">
              <label>Organization Name *</label>
              <input
                type="text"
                required
                value={general.organizationName}
                onChange={(e) => setGeneral({ ...general, organizationName: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Official Contact Email *</label>
                <input
                  type="email"
                  required
                  value={general.contactEmail}
                  onChange={(e) => setGeneral({ ...general, contactEmail: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="text"
                  value={general.contactPhone}
                  onChange={(e) => setGeneral({ ...general, contactPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Official Address</label>
              <input
                type="text"
                value={general.address}
                onChange={(e) => setGeneral({ ...general, address: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Public Website Domain</label>
                <input
                  type="text"
                  value={general.website}
                  onChange={(e) => setGeneral({ ...general, website: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Default Currency</label>
                <input
                  type="text"
                  value={general.defaultCurrency}
                  onChange={(e) => setGeneral({ ...general, defaultCurrency: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Time Zone</label>
                <input
                  type="text"
                  value={general.timeZone}
                  onChange={(e) => setGeneral({ ...general, timeZone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Date Format</label>
                <input
                  type="text"
                  value={general.dateFormat}
                  onChange={(e) => setGeneral({ ...general, dateFormat: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" disabled={savingGeneral}>
                {savingGeneral ? 'Saving...' : 'Save General Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: User Management */}
      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              Team Members & Accounts ({userList.length})
            </h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddUserModal(true)}>
              <Plus size={15} /> Add Team Member
            </button>
          </div>

          <div className="crm-table-container">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Last Login</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((u: any) => (
                  <tr key={u._id || u.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.name}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#475569' }}>{u.email}</span>
                    </td>
                    <td>
                      <select
                        style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id || u.id, e.target.value)}
                      >
                        <option value="SUPERADMIN">SUPERADMIN</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="INTERN">INTERN</option>
                        <option value="SALES_REP">SALES_REP</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                        {u.isActive !== false ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never logged in'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setResetUser(u)}
                        >
                          <Lock size={13} /> Reset Pass
                        </button>
                        <button
                          className={`btn btn-sm ${u.isActive !== false ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Roles & Permissions Matrix */}
      {activeTab === 'roles' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
            Role-Based Access Control Matrix
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            Security boundaries enforced at the API gateway layer across all CRM operations.
          </p>

          <table className="crm-table">
            <thead>
              <tr>
                <th>Module / Functionality</th>
                <th>SUPERADMIN</th>
                <th>ADMIN</th>
                <th>SALES_REP</th>
                <th>INTERN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Overview & Leads System</strong></td>
                <td><span className="badge badge-success">Full Access</span></td>
                <td><span className="badge badge-success">Full Access</span></td>
                <td><span className="badge badge-info">Assigned Only</span></td>
                <td><span className="badge badge-neutral">Read Only</span></td>
              </tr>
              <tr>
                <td><strong>Brochure Downloads</strong></td>
                <td><span className="badge badge-success">Full Access</span></td>
                <td><span className="badge badge-success">Full Access</span></td>
                <td><span className="badge badge-info">View & Export</span></td>
                <td><span className="badge badge-neutral">Read Only</span></td>
              </tr>
              <tr>
                <td><strong>Quotations & Invoicing</strong></td>
                <td><span className="badge badge-success">Create, Approve & Sign</span></td>
                <td><span className="badge badge-success">Create & Approve</span></td>
                <td><span className="badge badge-info">Create Draft</span></td>
                <td><span className="badge badge-neutral">Read Only</span></td>
              </tr>
              <tr>
                <td><strong>Lead Assignment & Rebalancing</strong></td>
                <td><span className="badge badge-success">Assign & Round-Robin</span></td>
                <td><span className="badge badge-success">Assign & Round-Robin</span></td>
                <td><span className="badge badge-neutral">View Only</span></td>
                <td><span className="badge badge-neutral">No Access</span></td>
              </tr>
              <tr>
                <td><strong>Direct Mail Dispatch</strong></td>
                <td><span className="badge badge-success">Full Access</span></td>
                <td><span className="badge badge-success">Full Access</span></td>
                <td><span className="badge badge-info">Create & Track</span></td>
                <td><span className="badge badge-neutral">Read Only</span></td>
              </tr>
              <tr>
                <td><strong>System Settings & User Admin</strong></td>
                <td><span className="badge badge-success">Full Access</span></td>
                <td><span className="badge badge-info">General & Audit</span></td>
                <td><span className="badge badge-danger">Restricted</span></td>
                <td><span className="badge badge-danger">Restricted</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: Integrations & Gateway */}
      {activeTab === 'integrations' && (
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '14px' }}>
            External Service Integrations & Secure Ingestion Gateways
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {integrations.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{item.name}</div>
                    <span
                      className={`badge ${
                        item.color === 'green' ? 'badge-success' : item.color === 'amber' ? 'badge-warning' : 'badge-danger'
                      }`}
                      style={{ fontSize: '11px' }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                    <strong>Endpoint:</strong> <code>{item.endpoint}</code>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    <strong>Security:</strong> {item.protection}
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#94a3b8' }}>
                  Managed via environment variables in <code>crm-backend/.env</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: System Audit Trail */}
      {activeTab === 'audit' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              Administrative Governance Audit Logs ({auditLogs.length})
            </h2>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="crm-search-box" style={{ width: '220px' }}>
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                />
              </div>

              <select
                style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                value={auditModule}
                onChange={(e) => setAuditModule(e.target.value)}
              >
                <option value="All">All Modules</option>
                <option value="Quotations">Quotations</option>
                <option value="Direct Mail">Direct Mail</option>
                <option value="Lead Assignment">Lead Assignment</option>
                <option value="Settings">Settings</option>
                <option value="System">System</option>
              </select>
            </div>
          </div>

          <div className="crm-table-container">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Staff Member</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Details & Summary</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      No audit records found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log._id}>
                      <td>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{log.userName}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{log.userEmail}</div>
                      </td>
                      <td>
                        <span className="mono-badge">{log.action}</span>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{log.module}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#334155' }}>{log.details || '—'}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div className="crm-modal-backdrop">
          <div className="crm-modal-card" style={{ maxWidth: '480px' }}>
            <div className="crm-modal-header">
              <h2>Add New CRM Staff Member</h2>
              <button className="close-btn" onClick={() => setShowAddUserModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="crm-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>

              <div className="form-group">
                <label>Work Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="ramesh@zeexai.com"
                />
              </div>

              <div className="form-group">
                <label>Temporary Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="form-group">
                <label>Assigned Role *</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                >
                  <option value="INTERN">INTERN</option>
                  <option value="SALES_REP">SALES_REP</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
              </div>

              <div className="crm-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetUser && (
        <div className="crm-modal-backdrop">
          <div className="crm-modal-card" style={{ maxWidth: '420px' }}>
            <div className="crm-modal-header">
              <h2>Reset Password for {resetUser.name}</h2>
              <button className="close-btn" onClick={() => setResetUser(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="crm-form">
              <div className="form-group">
                <label>New Password (Min 6 chars) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new secure password"
                />
              </div>

              <div className="crm-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setResetUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Set New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
