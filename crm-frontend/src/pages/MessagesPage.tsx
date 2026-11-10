import React, { useEffect, useState } from 'react';
import {
  Search,
  Send,
  Lock,
  Plus,
  Building,
  Mail,
  Phone,
  X,
} from 'lucide-react';
import api from '../lib/api';
import { ConversationItem, User as UserType } from '../types';

export const MessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Composer
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);

  // New Conversation Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    company: '',
    channel: 'Website enquiry',
    initialMessage: '',
  });

  const fetchConversations = async (keepActiveId?: string) => {
    try {
      const res = await api.get('/messages/conversations', {
        params: {
          search,
          channel: channelFilter,
          status: statusFilter,
        },
      });

      if (res.data?.success) {
        const list = res.data.data || [];
        setConversations(list);

        if (keepActiveId) {
          const found = list.find((c: ConversationItem) => c._id === keepActiveId);
          if (found) setActiveConv(found);
        } else if (!activeConv && list.length > 0) {
          loadConversationDetails(list[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationDetails = async (id: string) => {
    try {
      const res = await api.get(`/messages/conversations/${id}`);
      if (res.data?.success) {
        setActiveConv(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch conversation details:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data?.success) setUsers(res.data.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchConversations();
  }, [search, channelFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !replyText.trim()) return;
    setSending(true);

    try {
      if (isInternalNote) {
        await api.post(`/messages/conversations/${activeConv._id}/note`, { note: replyText });
      } else {
        await api.post(`/messages/conversations/${activeConv._id}/reply`, { content: replyText });
      }
      setReplyText('');
      loadConversationDetails(activeConv._id);
      fetchConversations(activeConv._id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!activeConv) return;
    try {
      await api.patch(`/messages/conversations/${activeConv._id}/status`, { status: newStatus });
      loadConversationDetails(activeConv._id);
      fetchConversations(activeConv._id);
    } catch (_) {}
  };

  const handleAssigneeChange = async (userId: string) => {
    if (!activeConv) return;
    try {
      await api.patch(`/messages/conversations/${activeConv._id}/assign`, { assignedTo: userId });
      loadConversationDetails(activeConv._id);
      fetchConversations(activeConv._id);
    } catch (_) {}
  };

  const handleConvertToLead = async () => {
    if (!activeConv) return;
    try {
      const res = await api.post(`/messages/conversations/${activeConv._id}/convert-lead`, {
        interestedProduct: 'Z-Factory',
      });
      if (res.data?.success) {
        alert(res.data.message);
        loadConversationDetails(activeConv._id);
        fetchConversations(activeConv._id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Conversion failed');
    }
  };

  const handleCreateNewConv = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/messages/conversations', newForm);
      if (res.data?.success) {
        setShowNewModal(false);
        setNewForm({
          contactName: '',
          contactEmail: '',
          contactPhone: '',
          company: '',
          channel: 'Website enquiry',
          initialMessage: '',
        });
        fetchConversations(res.data.data._id);
        setActiveConv(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create conversation');
    }
  };

  return (
    <div className="crm-module" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="crm-module-header" style={{ marginBottom: '14px' }}>
        <div>
          <h1 className="crm-title">Internal Dispatch & Client Messages</h1>
          <p className="crm-subtitle">Centralized communication queue, inbound enquiries, and staff assignment.</p>
        </div>
        <div className="crm-actions">
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
            <Plus size={16} /> New Conversation
          </button>
        </div>
      </div>

      {/* 3-Pane Messaging Box */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '320px 1fr 300px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* PANE 1: Conversation List */}
        <div style={{ borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
          {/* Search & Channel Filters */}
          <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div className="crm-search-box" style={{ width: '100%', marginBottom: '8px' }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', flex: 1 }}
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
              >
                <option value="All">All Channels</option>
                <option value="Website enquiry">Website</option>
                <option value="Email">Email</option>
                <option value="Direct">Direct</option>
              </select>
              <select
                style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', flex: 1 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Open">Open</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Loading queue...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No conversations found.</div>
            ) : (
              conversations.map((c) => {
                const isSelected = activeConv?._id === c._id;
                return (
                  <div
                    key={c._id}
                    onClick={() => loadConversationDetails(c._id)}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      background: isSelected ? '#ede9fe' : '#ffffff',
                      borderLeft: isSelected ? '4px solid #6366f1' : '4px solid transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{c.contactName}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {c.company && (
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{c.company}</div>
                    )}
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#475569',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.lastMessage}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {c.channel}
                      </span>
                      {c.unreadCount > 0 && (
                        <span
                          style={{
                            background: '#ef4444',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '10px',
                          }}
                        >
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANE 2: Message Thread & Composer */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
          {activeConv ? (
            <>
              {/* Thread Header */}
              <div
                style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#fafafa',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                    {activeConv.contactName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {activeConv.contactEmail} {activeConv.contactPhone ? `· ${activeConv.contactPhone}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    value={activeConv.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    <option value="Open">Open</option>
                    <option value="Pending">Pending</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Messages Bubble Scroll Area */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {activeConv.messages.map((m, idx) => {
                  if (m.isInternalNote) {
                    return (
                      <div
                        key={idx}
                        style={{
                          background: '#fef3c7',
                          border: '1px solid #fde68a',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          alignSelf: 'center',
                          maxWidth: '85%',
                          fontSize: '12px',
                          color: '#92400e',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '2px' }}>
                          <Lock size={12} /> {m.senderName}
                        </div>
                        <div>{m.content}</div>
                      </div>
                    );
                  }

                  const isMe = m.sender === 'agent';
                  return (
                    <div
                      key={idx}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
                        {m.senderName} · {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div
                        style={{
                          background: isMe ? '#4f46e5' : '#f1f5f9',
                          color: isMe ? '#ffffff' : '#0f172a',
                          padding: '10px 14px',
                          borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          fontSize: '13px',
                          lineHeight: '1.5',
                        }}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Composer Form */}
              <form
                onSubmit={handleSend}
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid #e2e8f0',
                  background: isInternalNote ? '#fffbeb' : '#ffffff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: isInternalNote ? '#b45309' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                    }}
                    onClick={() => setIsInternalNote(!isInternalNote)}
                  >
                    <Lock size={13} /> {isInternalNote ? 'Internal Note Mode (Staff Only)' : 'Switch to Internal Note'}
                  </button>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Press Send or Enter</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <textarea
                    rows={2}
                    required
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: isInternalNote ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                      fontSize: '13px',
                      resize: 'none',
                    }}
                    placeholder={
                      isInternalNote
                        ? 'Add internal staff note (never visible to client)...'
                        : `Reply to ${activeConv.contactName}...`
                    }
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sending}
                    style={{ alignSelf: 'flex-end', height: '42px', padding: '0 16px' }}
                  >
                    {isInternalNote ? <Lock size={15} /> : <Send size={15} />}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Select a conversation to begin messaging
            </div>
          )}
        </div>

        {/* PANE 3: Contact & Linked Lead Details */}
        <div style={{ borderLeft: '1px solid #e2e8f0', padding: '16px', background: '#fafafa', overflowY: 'auto' }}>
          {activeConv ? (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: '#e0e7ff',
                    color: '#4338ca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 700,
                    margin: '0 auto 8px',
                  }}
                >
                  {(activeConv.contactName || 'C')[0]}
                </div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{activeConv.contactName}</div>
                {activeConv.company && (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{activeConv.company}</div>
                )}
              </div>

              {/* Contact Meta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                  <Mail size={14} color="#6366f1" /> {activeConv.contactEmail}
                </div>
                {activeConv.contactPhone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                    <Phone size={14} color="#6366f1" /> {activeConv.contactPhone}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                  <Building size={14} color="#6366f1" /> Channel: {activeConv.channel}
                </div>
              </div>

              {/* Staff Assignment */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Assigned Staff
                </label>
                <select
                  style={{ width: '100%', marginTop: '4px', fontSize: '12px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  value={activeConv.assignedTo?._id || ''}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                >
                  <option value="">-- Unassigned --</option>
                  {users.map((u) => (
                    <option key={u.id || u._id} value={u.id || u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Linked Lead Section */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Pipeline Association
                </label>
                {activeConv.relatedLead ? (
                  <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '6px', marginTop: '6px', fontSize: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {(activeConv.relatedLead as any).leadId || 'Linked Lead'}
                    </div>
                    <div style={{ color: '#64748b' }}>Status: {(activeConv.relatedLead as any).status}</div>
                  </div>
                ) : (
                  <div style={{ marginTop: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                      This contact is not yet registered in the active sales pipeline.
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%' }}
                      onClick={handleConvertToLead}
                    >
                      <Plus size={14} /> Convert to Lead
                    </button>
                  </div>
                )}
              </div>

              {/* Gateway Notice */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', fontSize: '11px', color: '#64748b' }}>
                <div style={{ fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                  Gateway Status
                </div>
                Messages are stored locally. Connect SMTP / WhatsApp provider under Settings to enable live delivery.
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* NEW CONVERSATION MODAL */}
      {showNewModal && (
        <div className="crm-modal-backdrop">
          <div className="crm-modal-card" style={{ maxWidth: '520px' }}>
            <div className="crm-modal-header">
              <h2>Initiate Client Conversation</h2>
              <button className="close-btn" onClick={() => setShowNewModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateNewConv} className="crm-form">
              <div className="form-group">
                <label>Contact Full Name *</label>
                <input
                  type="text"
                  required
                  value={newForm.contactName}
                  onChange={(e) => setNewForm({ ...newForm, contactName: e.target.value })}
                  placeholder="e.g. Elena Rostova"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={newForm.contactEmail}
                    onChange={(e) => setNewForm({ ...newForm, contactEmail: e.target.value })}
                    placeholder="elena@enterprise.com"
                  />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    value={newForm.company}
                    onChange={(e) => setNewForm({ ...newForm, company: e.target.value })}
                    placeholder="Enterprise Corp"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Communication Channel</label>
                <select
                  value={newForm.channel}
                  onChange={(e) => setNewForm({ ...newForm, channel: e.target.value })}
                >
                  <option value="Website enquiry">Website enquiry</option>
                  <option value="Email">Email</option>
                  <option value="Direct">Direct</option>
                </select>
              </div>

              <div className="form-group">
                <label>Initial Message / Inquiry Text *</label>
                <textarea
                  rows={3}
                  required
                  value={newForm.initialMessage}
                  onChange={(e) => setNewForm({ ...newForm, initialMessage: e.target.value })}
                  placeholder="Initial inquiry details..."
                />
              </div>

              <div className="crm-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Thread
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
