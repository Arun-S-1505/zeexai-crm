import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import api from '../lib/api';
import { Lead } from '../types';

const products = ['All products', 'Z-Factory', 'Z-Tracs', 'Z-Market', 'Z-Drone', 'Z-Consultancy'];

function toneFor(value: string) {
  return value === 'New'
    ? 'blue'
    : value === 'Qualified' || value === 'Won'
    ? 'green'
    : value === 'Urgent'
    ? 'red'
    : value === 'High'
    ? 'amber'
    : value === 'Proposal Sent' || value === 'Negotiation'
    ? 'violet'
    : 'gray';
}

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState('All products');
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Form states
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    interestedProduct: 'Z-Factory',
    priority: 'Medium',
    requirements: '',
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads', {
        params: {
          page,
          limit: 20,
          search: query,
          product: product === 'All products' ? '' : product,
        },
      });
      if (res.data.success) {
        setLeads(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, product]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/leads', form);
      if (res.data.success) {
        setShowLeadForm(false);
        setForm({
          firstName: '',
          lastName: '',
          company: '',
          email: '',
          phone: '',
          interestedProduct: 'Z-Factory',
          priority: 'Medium',
          requirements: '',
        });
        fetchLeads();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating lead');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await api.delete(`/leads/${id}`);
        fetchLeads();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Error deleting lead');
      }
    }
  };

  return (
    <>
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">Workspace / Leads</p>
          <h1>Leads &amp; Requests</h1>
          <p className="subheading">Manage your pipeline, follow-ups, and customer relationships with real database sync.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowLeadForm(true)}>
          <Plus size={17} /> Add new lead
        </button>
      </div>

      <div className="lead-kpis">
        <div>
          <span>All leads</span>
          <strong>{totalCount}</strong>
        </div>
        <div>
          <span>New</span>
          <strong className="blue-text">{leads.filter((l) => l.status === 'New').length}</strong>
        </div>
        <div>
          <span>Qualified</span>
          <strong className="green-text">{leads.filter((l) => l.status === 'Qualified').length}</strong>
        </div>
        <div>
          <span>Needs follow-up</span>
          <strong className="amber-text">{leads.filter((l) => l.priority === 'High' || l.priority === 'Urgent').length}</strong>
        </div>
      </div>

      <div className="card lead-card">
        <form onSubmit={handleSearchSubmit} className="table-toolbar">
          <div className="table-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, company, email..."
            />
          </div>
          <select value={product} onChange={(e) => { setProduct(e.target.value); setPage(1); }}>
            {products.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <button type="submit" className="filter-btn">
            <Filter size={15} /> Search
          </button>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>Lead</th>
                <th>Company</th>
                <th>Product</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>Loading leads from MongoDB...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No leads found.</td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l._id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <div className="lead-name">
                        <div className="avatar avatar-soft">
                          {l.firstName[0]}{l.lastName[0]}
                        </div>
                        <div>
                          <strong>{l.firstName} {l.lastName}</strong>
                          <small>{l.leadId || 'LD-PENDING'}</small>
                        </div>
                      </div>
                    </td>
                    <td>{l.company}</td>
                    <td>
                      <span className="product-cell">
                        <i />
                        {l.interestedProduct}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${toneFor(l.status)}`}>{l.status}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${toneFor(l.priority)}`}>{l.priority}</span>
                    </td>
                    <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="more-btn"
                        onClick={() => handleDelete(l._id)}
                        title="Delete lead"
                        style={{ color: '#ea6385' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total leads)
          </span>
          <div>
            <button
              className="pagination"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: '12px', padding: '0 8px' }}>Page {page}</span>
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

      {showLeadForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <div>
                <p className="eyebrow">New record</p>
                <h2>Add a new lead</h2>
              </div>
              <button className="icon-btn" onClick={() => setShowLeadForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="form-grid">
              <label>
                First name
                <input
                  required
                  placeholder="e.g. Aarav"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </label>
              <label>
                Last name
                <input
                  required
                  placeholder="e.g. Mehta"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </label>
              <label className="wide">
                Company name
                <input
                  required
                  placeholder="Company or organization"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </label>
              <label>
                Email address
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label>
                Phone number
                <input
                  placeholder="+91 00000 00000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
              <label>
                Interested product
                <select
                  value={form.interestedProduct}
                  onChange={(e) => setForm({ ...form, interestedProduct: e.target.value as any })}
                >
                  {products.slice(1).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </label>
              <label className="wide">
                Requirements
                <textarea
                  placeholder="Describe opportunity..."
                  rows={3}
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                />
              </label>
              <div className="modal-actions" style={{ gridColumn: 'span 2' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLeadForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Create lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

