import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Download,
  Filter,
  DollarSign,
  FileText,
  Calendar,
} from 'lucide-react';
import api from '../lib/api';
import { User as UserType } from '../types';

export const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserType[]>([]);
  const [data, setData] = useState<any>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/analytics', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          employee: selectedEmployee,
          source: selectedSource,
          status: selectedStatus,
        },
      });

      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data?.success) setUsers(res.data.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate, selectedEmployee, selectedSource, selectedStatus]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const exportReportCSV = () => {
    if (!data) return;
    const rows = [
      ['ZEE X AI CRM — Executive Performance & Financial Analytics Report'],
      ['Generated On', new Date().toLocaleString()],
      [''],
      ['METRIC', 'VALUE'],
      ['Total Leads', data.summary?.totalLeads],
      ['Conversion Rate (%)', `${data.summary?.conversionRate}%`],
      ['Total Won Deals', data.summary?.wonLeads],
      ['Unassigned Leads', data.summary?.unassignedLeads],
      ['Total Campaign Spend (INR)', data.summary?.totalCampaignSpend],
      ['Total Campaign Revenue (INR)', data.summary?.campaignRevenue],
      ['Overall Marketing ROI (%)', `${data.summary?.overallCampaignROI}%`],
      ['Average Cost Per Lead (INR)', data.summary?.averageCPL],
      ['Total Pipeline Quotation Value (INR)', data.summary?.totalQuotationValue],
      ['Accepted Quotation Value (INR)', data.summary?.acceptedQuotationValue],
      ['Quotation Acceptance Rate (%)', `${data.summary?.quotationAcceptanceRate}%`],
      ['Total Whitepaper Downloads', data.summary?.totalBrochures],
      ['Repeat Downloads', data.summary?.repeatDownloads],
      ['Total Appointments / Demos', data.summary?.totalMeetings],
      ['Completed Demos', data.summary?.completedMeetings],
      [''],
      ['CAMPAIGN PERFORMANCE BREAKDOWN'],
      ['Campaign Name', 'Type', 'Spend', 'Leads', 'Conversions', 'Revenue', 'ROI %'],
      ...(data.campaignsSummary || []).map((c: any) => [
        c.name,
        c.type,
        c.spend,
        c.leads,
        c.conversions,
        c.revenue,
        `${c.roi}%`,
      ]),
      [''],
      ['EMPLOYEE WORKLOAD & SALES CONVERSION'],
      ['Staff Name', 'Role', 'Assigned Leads', 'Won Deals', 'Conversion Rate %'],
      ...(data.employeePerformance || []).map((e: any) => [
        e.name,
        e.role,
        e.assignedLeads,
        e.wonLeads,
        `${e.conversionRate}%`,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((row) => row.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ZEEXAI_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = data?.summary || {};
  const distributions = data?.distributions || {};

  return (
    <div className="crm-module">
      {/* Header */}
      <div className="crm-module-header">
        <div>
          <h1 className="crm-title">Reports & Executive Analytics</h1>
          <p className="crm-subtitle">Real-time cross-module business intelligence, pipeline velocity, and marketing ROI.</p>
        </div>
        <div className="crm-actions">
          <button className="btn btn-secondary" onClick={exportReportCSV} disabled={!data}>
            <Download size={16} /> Export Executive CSV
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            Print Report
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="crm-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
          <Filter size={16} />
          <span>Date:</span>
          <input
            type="date"
            style={{ fontSize: '12px', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span>to</span>
          <input
            type="date"
            style={{ fontSize: '12px', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <select
          style={{ fontSize: '12px', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
        >
          <option value="All">All Staff Members</option>
          {users.map((u) => (
            <option key={u.id || u._id} value={u.id || u._id}>
              {u.name}
            </option>
          ))}
        </select>

        <select
          style={{ fontSize: '12px', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
        >
          <option value="All">All Lead Sources</option>
          <option value="Website enquiry">Website enquiry</option>
          <option value="Brochure download">Brochure download</option>
          <option value="Marketing campaign">Marketing campaign</option>
          <option value="Referral">Referral</option>
          <option value="Direct outreach">Direct outreach</option>
        </select>

        <select
          style={{ fontSize: '12px', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="All">All Pipeline Statuses</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Demo Scheduled">Demo Scheduled</option>
          <option value="Proposal Sent">Proposal Sent</option>
          <option value="Negotiation">Negotiation</option>
          <option value="Won">Won</option>
          <option value="Lost">Lost</option>
        </select>

        {(startDate || endDate || selectedEmployee !== 'All' || selectedSource !== 'All' || selectedStatus !== 'All') && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setSelectedEmployee('All');
              setSelectedSource('All');
              setSelectedStatus('All');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <div className="crm-spinner" />
          <p style={{ marginTop: '12px' }}>Computing real-time analytics across MongoDB database...</p>
        </div>
      ) : (
        <>
          {/* Main 4 Executive Metric Cards */}
          <div className="crm-stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
                <TrendingUp size={22} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Conversion Rate</div>
                <div className="stat-value">{summary.conversionRate}%</div>
                <div className="stat-meta">
                  <span>{summary.wonLeads} won</span> / {summary.totalLeads} total leads
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' }}>
                <DollarSign size={22} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Marketing ROI</div>
                <div className="stat-value">+{summary.overallCampaignROI}%</div>
                <div className="stat-meta">
                  <span>Revenue: ₹{(summary.campaignRevenue / 100000).toFixed(1)}L</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#eab308' }}>
                <FileText size={22} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Quotation Acceptance</div>
                <div className="stat-value">{summary.quotationAcceptanceRate}%</div>
                <div className="stat-meta">
                  <span>Pipeline: ₹{(summary.totalQuotationValue / 100000).toFixed(2)}L</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                <Calendar size={22} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Completed Demos</div>
                <div className="stat-value">{summary.completedMeetings}</div>
                <div className="stat-meta">
                  <span>{summary.upcomingMeetings} upcoming</span> / {summary.totalMeetings} bookings
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Distributions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {/* By Status */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '14px' }}>
                Pipeline Stage Distribution
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(distributions.byStatus || {}).map(([st, cnt]: [string, any]) => {
                  const pct = summary.totalLeads > 0 ? Math.round((cnt / summary.totalLeads) * 100) : 0;
                  return (
                    <div key={st}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: '#334155', fontWeight: 500 }}>{st}</span>
                        <span style={{ color: '#64748b' }}>{cnt} ({pct}%)</span>
                      </div>
                      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: st === 'Won' ? '#22c55e' : '#6366f1', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Lead Source */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '14px' }}>
                Lead Acquisition Channel
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(distributions.bySource || {}).map(([src, cnt]: [string, any]) => {
                  const pct = summary.totalLeads > 0 ? Math.round((cnt / summary.totalLeads) * 100) : 0;
                  return (
                    <div key={src}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: '#334155', fontWeight: 500 }}>{src}</span>
                        <span style={{ color: '#64748b' }}>{cnt} ({pct}%)</span>
                      </div>
                      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#3b82f6', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Product Interest */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '14px' }}>
                Product Solutions Demand
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(distributions.byProduct || {}).map(([prod, cnt]: [string, any]) => {
                  const pct = summary.totalLeads > 0 ? Math.round((cnt / summary.totalLeads) * 100) : 0;
                  return (
                    <div key={prod}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: '#334155', fontWeight: 500 }}>{prod}</span>
                        <span style={{ color: '#64748b' }}>{cnt} ({pct}%)</span>
                      </div>
                      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#10b981', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Campaign Financial Performance Table */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '14px' }}>
              Multi-Channel Campaign Performance & Attributed Revenue
            </h3>
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Type</th>
                  <th>Spend (₹)</th>
                  <th>Leads</th>
                  <th>Conversions</th>
                  <th>Attributed Revenue (₹)</th>
                  <th>ROI (%)</th>
                </tr>
              </thead>
              <tbody>
                {(data?.campaignsSummary || []).map((c: any) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td><span className="badge badge-neutral">{c.type}</span></td>
                    <td>₹{c.spend.toLocaleString('en-IN')}</td>
                    <td>{c.leads}</td>
                    <td>{c.conversions}</td>
                    <td>₹{c.revenue.toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: c.roi >= 0 ? '#16a34a' : '#dc2626' }}>
                      {c.roi}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Employee Sales Conversion & Workload Table */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '14px' }}>
              Sales Representative Performance & Conversion Efficiency
            </h3>
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Assigned Leads</th>
                  <th>Deals Won</th>
                  <th>Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {(data?.employeePerformance || []).map((e: any) => (
                  <tr key={e.userId}>
                    <td style={{ fontWeight: 600 }}>{e.name}</td>
                    <td><span className="badge badge-neutral">{e.role}</span></td>
                    <td>{e.assignedLeads}</td>
                    <td>{e.wonLeads}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{e.conversionRate}%</span>
                        <div style={{ width: '80px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, e.conversionRate)}%`, height: '100%', background: '#6366f1' }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
