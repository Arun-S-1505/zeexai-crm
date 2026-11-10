import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Zap,
  TrendingUp,
  Activity,
  CalendarDays,
  ChevronDown,
  Plus,
  MoreHorizontal,
  ChevronRight,
  UserRound,
} from 'lucide-react';
import api from '../lib/api';
import { DashboardStats, ScheduleItem, ActivityItem } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, funnelRes, scheduleRes, activityRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/pipeline-funnel'),
          api.get('/dashboard/todays-schedule'),
          api.get('/dashboard/recent-activity'),
        ]);

        if (statsRes.data.success) setStats(statsRes.data.data);
        if (funnelRes.data.success) setFunnel(funnelRes.data.data);
        if (scheduleRes.data.success) setSchedule(scheduleRes.data.data);
        if (activityRes.data.success) setActivity(activityRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6d7081' }}>
        <p>Loading real-time CRM intelligence...</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h1>
            Workspace Overview <span>✦</span>
          </h1>
          <p className="subheading">Here&apos;s what&apos;s happening across your customer pipeline today.</p>
        </div>
        <div className="heading-actions">
          <button className="btn btn-secondary">
            <CalendarDays size={16} /> Last 30 days <ChevronDown size={14} />
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/leads')}>
            <Plus size={17} /> Add new lead
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon violet">
            <Users size={18} />
          </div>
          <div className="stat-label">
            Total leads <span className="info">i</span>
          </div>
          <div className="stat-value">{stats?.totalLeads?.value || 0}</div>
          <div className="stat-change">
            <span>↗ {stats?.totalLeads?.change || '+0%'}</span> <small>vs last period</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Zap size={18} />
          </div>
          <div className="stat-label">
            New leads <span className="info">i</span>
          </div>
          <div className="stat-value">{stats?.newLeads?.value || 0}</div>
          <div className="stat-change">
            <span>↗ {stats?.newLeads?.change || '+0%'}</span> <small>vs last period</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <TrendingUp size={18} />
          </div>
          <div className="stat-label">
            Qualified leads <span className="info">i</span>
          </div>
          <div className="stat-value">{stats?.qualifiedLeads?.value || 0}</div>
          <div className="stat-change">
            <span>↗ {stats?.qualifiedLeads?.change || '+0%'}</span> <small>vs last period</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <Activity size={18} />
          </div>
          <div className="stat-label">
            Pending follow-ups <span className="info">i</span>
          </div>
          <div className="stat-value">{stats?.pendingFollowUps?.value || 0}</div>
          <div className="stat-change">
            <span>{stats?.pendingFollowUps?.change || '0%'}</span> <small>vs last period</small>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="card chart-card">
          <div className="card-head">
            <div>
              <h2>Lead acquisition</h2>
              <p>New leads received over time</p>
            </div>
            <button className="select-btn">
              Weekly <ChevronDown size={14} />
            </button>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-dot violet-dot" />
              New leads
            </span>
            <span>
              <i className="legend-dot blue-dot" />
              Qualified
            </span>
          </div>
          <div className="fake-chart">
            <div className="chart-y">
              <span>40</span>
              <span>30</span>
              <span>20</span>
              <span>10</span>
              <span>0</span>
            </div>
            <div className="chart-area">
              <svg viewBox="0 0 620 190" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#6045f5" stopOpacity=".22" />
                    <stop offset="1" stopColor="#6045f5" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 145 C45 142 55 110 95 120 S145 155 185 100 S240 88 275 105 S320 120 350 82 S405 40 440 70 S495 76 530 32 S580 68 620 20 V190 H0Z"
                  fill="url(#area)"
                />
                <path
                  d="M0 145 C45 142 55 110 95 120 S145 155 185 100 S240 88 275 105 S320 120 350 82 S405 40 440 70 S495 76 530 32 S580 68 620 20"
                  fill="none"
                  stroke="#6045f5"
                  strokeWidth="3"
                />
                <path
                  d="M0 165 C50 145 75 145 110 150 S165 142 200 145 S255 122 290 145 S345 125 375 140 S430 105 465 130 S520 120 550 125 S590 100 620 105"
                  fill="none"
                  stroke="#4263eb"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                />
              </svg>
              <div className="chart-x">
                <span>May 20</span>
                <span>May 27</span>
                <span>Jun 03</span>
                <span>Jun 10</span>
                <span>Jun 17</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card funnel-card">
          <div className="card-head">
            <div>
              <h2>Pipeline health</h2>
              <p>Lead conversion funnel</p>
            </div>
            <MoreHorizontal size={18} />
          </div>
          <div className="funnel">
            {funnel?.stages?.map((s: any, idx: number) => (
              <div className="funnel-row" key={idx}>
                <span>{s.name}</span>
                <b>{s.count}</b>
                <div className="funnel-bar">
                  <i style={{ width: `${s.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="conversion">
            <strong>{funnel?.conversionRate || '8.5%'}</strong>
            <span>overall conversion rate</span>
          </div>
        </div>
      </div>

      <div className="bottom-grid">
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Today&apos;s schedule</h2>
              <p>Meetings and follow-ups for today</p>
            </div>
            <button className="text-btn" onClick={() => navigate('/schedule')}>
              View calendar <ChevronRight size={14} />
            </button>
          </div>
          <div className="meeting-list">
            {schedule.length === 0 ? (
              <p style={{ color: '#9295a7', fontSize: '11px', padding: '10px 0' }}>No meetings scheduled today.</p>
            ) : (
              schedule.map((m) => (
                <div className="meeting-row" key={m._id}>
                  <div className="meeting-time">{m.time || '10:00 AM'}</div>
                  <div className={`meeting-line ${m.color || 'blue'}`} />
                  <div className="meeting-info">
                    <strong>{m.title}</strong>
                    <span>
                      {m.company || 'Client'} · {m.type}
                    </span>
                  </div>
                  <button className="more-btn">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h2>Recent activity</h2>
              <p>Latest updates from your pipeline</p>
            </div>
            <button className="text-btn">
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="activity-list">
            {activity.length === 0 ? (
              <p style={{ color: '#9295a7', fontSize: '11px', padding: '10px 0' }}>No recent activity records.</p>
            ) : (
              activity.map((a, idx) => (
                <div className="activity-row" key={idx}>
                  <div className={`activity-icon ${a.icon}`}>
                    <UserRound size={14} />
                  </div>
                  <div>
                    <span>
                      {a.text} <b>{a.bold}</b>
                    </span>
                    <small>{a.time}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

