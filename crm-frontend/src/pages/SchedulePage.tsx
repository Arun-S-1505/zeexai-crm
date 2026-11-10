import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Plus,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Trash2,
  Edit2,
  CalendarDays,
  ExternalLink,
} from 'lucide-react';
import api from '../lib/api';
import { ScheduleAppointmentItem, User as UserType } from '../types';

const meetingTypes = [
  'All',
  'Product Demo',
  'Discovery Call',
  'Follow-up',
  'Sales Meeting',
  'Technical Discussion',
  'Internal Meeting',
  'Other',
];

const statusOptions = ['All', 'Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled', 'No Show'];

export const SchedulePage: React.FC = () => {
  const [appointments, setAppointments] = useState<ScheduleAppointmentItem[]>([]);
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, today: 0, upcoming: 0, completed: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Filters
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleAppointmentItem | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Form states
  const [form, setForm] = useState({
    title: '',
    contactName: '',
    company: '',
    type: 'Discovery Call',
    date: new Date().toISOString().slice(0, 10),
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    status: 'Scheduled',
    assignedTo: '',
    locationOrLink: 'https://meet.google.com/zeex-demo',
    description: '',
    reminder: '15 min before',
    notes: '',
  });

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await api.get('/schedule', {
        params: {
          search: query,
          type: selectedType,
          status: selectedStatus,
        },
      });
      if (res.data?.success) {
        setAppointments(res.data.data);
        if (res.data.metrics) setMetrics(res.data.metrics);
      }
    } catch (err) {
      console.error('Failed to load schedule appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/users');
      if (res.data?.success) {
        setEmployees(res.data.data);
      }
    } catch {
      // Ignore if non-superadmin
    }
  };

  useEffect(() => {
    fetchSchedule();
    fetchEmployees();
  }, [selectedType, selectedStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSchedule();
  };

  const handleOpenCreate = (initialDate?: string) => {
    setEditingItem(null);
    setConflictWarning(null);
    setForm({
      title: '',
      contactName: '',
      company: '',
      type: 'Product Demo',
      date: initialDate || new Date().toISOString().slice(0, 10),
      startTime: '11:00 AM',
      endTime: '12:00 PM',
      status: 'Scheduled',
      assignedTo: employees[0]?._id || '',
      locationOrLink: 'https://meet.google.com/zeex-demo',
      description: '',
      reminder: '15 min before',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: ScheduleAppointmentItem) => {
    setEditingItem(item);
    setConflictWarning(null);
    setForm({
      title: item.title,
      contactName: item.contactName || '',
      company: item.company || '',
      type: item.type,
      date: new Date(item.date).toISOString().slice(0, 10),
      startTime: item.startTime,
      endTime: item.endTime || '',
      status: item.status,
      assignedTo: item.assignedTo?._id || '',
      locationOrLink: item.locationOrLink || '',
      description: item.description || '',
      reminder: item.reminder || '15 min before',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictWarning(null);
    try {
      if (editingItem) {
        const res = await api.patch(`/schedule/${editingItem._id}`, form);
        if (res.data?.success) {
          setShowModal(false);
          fetchSchedule();
        }
      } else {
        const res = await api.post('/schedule', form);
        if (res.data?.success) {
          setShowModal(false);
          fetchSchedule();
        }
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setConflictWarning(err.response.data.message);
      } else {
        alert(err.response?.data?.message || 'Failed to save appointment');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this scheduled appointment?')) {
      try {
        await api.delete(`/schedule/${id}`);
        fetchSchedule();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Error deleting appointment');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return <span className="badge badge-blue">Scheduled</span>;
      case 'Confirmed':
        return <span className="badge badge-violet">Confirmed</span>;
      case 'Completed':
        return <span className="badge badge-green">Completed</span>;
      case 'Cancelled':
        return <span className="badge badge-red">Cancelled</span>;
      case 'Rescheduled':
        return <span className="badge badge-amber">Rescheduled</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  // Calendar calculations
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));
  const todayMonth = () => setCurrentMonthDate(new Date());

  const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">Workspace / Schedule</p>
          <h1>Meeting &amp; Appointment Schedule</h1>
          <p className="subheading">
            Manage product demos, technical architecture sessions, and discovery calls with prospects.
          </p>
        </div>
        <div className="heading-actions">
          <div style={{ display: 'inline-flex', border: '1px solid #e8eaf2', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              className="btn"
              style={{
                borderRadius: 0,
                height: '35px',
                background: viewMode === 'calendar' ? '#6045f5' : '#fff',
                color: viewMode === 'calendar' ? '#fff' : '#5c5f74',
              }}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon size={14} /> Calendar
            </button>
            <button
              className="btn"
              style={{
                borderRadius: 0,
                height: '35px',
                background: viewMode === 'list' ? '#6045f5' : '#fff',
                color: viewMode === 'list' ? '#fff' : '#5c5f74',
              }}
              onClick={() => setViewMode('list')}
            >
              <CalendarDays size={14} /> List View
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenCreate()}>
            <Plus size={16} /> New Appointment
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="lead-kpis" style={{ marginBottom: '22px' }}>
        <div>
          <span>Total Bookings</span>
          <strong>{metrics.total}</strong>
        </div>
        <div>
          <span>Today&apos;s Calls</span>
          <strong className="blue-text">{metrics.today}</strong>
        </div>
        <div>
          <span>Upcoming Demos</span>
          <strong className="green-text">{metrics.upcoming}</strong>
        </div>
        <div>
          <span>Overdue Follow-ups</span>
          <strong className="amber-text">{metrics.overdue}</strong>
        </div>
      </div>

      {/* Search and Filters toolbar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '16px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className="table-search" style={{ flex: 1, minWidth: '220px' }}>
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search meetings by client, contact, title..."
            />
          </div>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            {meetingTypes.map((t) => (
              <option key={t} value={t}>{t === 'All' ? 'All Meeting Types' : t}</option>
            ))}
          </select>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>
          <button type="submit" className="filter-btn">
            <Filter size={14} /> Filter
          </button>
        </form>
      </div>

      {/* Calendar View Mode */}
      {viewMode === 'calendar' ? (
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#20223b' }}>{monthName}</h2>
              <button className="btn btn-secondary" style={{ height: '30px', fontSize: '11px' }} onClick={todayMonth}>
                Today
              </button>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="icon-btn" onClick={prevMonth} title="Previous Month">
                <ChevronLeft size={16} />
              </button>
              <button className="icon-btn" onClick={nextMonth} title="Next Month">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Month Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '6px',
              textAlign: 'center',
            }}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                style={{
                  padding: '8px',
                  fontWeight: 700,
                  fontSize: '11px',
                  color: '#9598ab',
                  textTransform: 'uppercase',
                }}
              >
                {d}
              </div>
            ))}

            {/* Blank leading days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  minHeight: '105px',
                  background: '#fafafd',
                  borderRadius: '8px',
                  border: '1px dashed #edeef5',
                }}
              />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = appointments.filter((a) => {
                const aDate = new Date(a.date).toISOString().slice(0, 10);
                return aDate === cellDateStr;
              });

              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => handleOpenCreate(cellDateStr)}
                  style={{
                    minHeight: '105px',
                    background: isToday ? '#f6f5ff' : '#ffffff',
                    border: isToday ? '1.5px solid #6045f5' : '1px solid #e8eaf2',
                    borderRadius: '8px',
                    padding: '6px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                  title="Click to schedule on this date"
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: isToday ? 800 : 600,
                      color: isToday ? '#6045f5' : '#33364f',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{dayNum}</span>
                    {dayEvents.length > 0 && (
                      <span
                        style={{
                          fontSize: '9px',
                          background: '#eeebff',
                          color: '#6045f5',
                          borderRadius: '10px',
                          padding: '0 5px',
                        }}
                      >
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Day Events */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto' }}>
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(ev);
                        }}
                        style={{
                          fontSize: '10px',
                          padding: '3px 5px',
                          borderRadius: '4px',
                          background:
                            ev.type === 'Product Demo'
                              ? '#eaf0ff'
                              : ev.type === 'Sales Meeting'
                              ? '#e4f7ed'
                              : '#eeebff',
                          color:
                            ev.type === 'Product Demo'
                              ? '#2b52ba'
                              : ev.type === 'Sales Meeting'
                              ? '#138957'
                              : '#5137e8',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {ev.startTime} · {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span style={{ fontSize: '9px', color: '#9598ab', paddingLeft: '2px' }}>
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View Mode */
        <div className="card lead-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Meeting Title</th>
                  <th>Contact &amp; Firm</th>
                  <th>Meeting Type</th>
                  <th>Date &amp; Time</th>
                  <th>Assigned Specialist</th>
                  <th>Location / Video Link</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#777a8f' }}>
                      Loading appointment calendar...
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#9295a7' }}>
                      No appointments scheduled matching your criteria.
                    </td>
                  </tr>
                ) : (
                  appointments.map((a) => (
                    <tr key={a._id}>
                      <td>
                        <strong style={{ color: '#20223b', fontSize: '12px' }}>{a.title}</strong>
                        {a.description && (
                          <small style={{ display: 'block', color: '#8b8e9f', fontSize: '10px' }}>
                            {a.description}
                          </small>
                        )}
                      </td>
                      <td>
                        <div>
                          <span style={{ fontWeight: 600, color: '#33354a' }}>{a.contactName || 'Client'}</span>
                          {a.company && <div style={{ fontSize: '10px', color: '#85889d' }}>{a.company}</div>}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-violet">{a.type}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '11px', color: '#292b43', fontWeight: 600 }}>
                          {new Date(a.date).toLocaleDateString()}
                        </div>
                        <small style={{ color: '#6045f5', fontSize: '10px' }}>
                          <Clock size={10} style={{ display: 'inline', marginRight: '3px' }} />
                          {a.startTime} {a.endTime ? `– ${a.endTime}` : ''}
                        </small>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div className="avatar avatar-soft" style={{ width: '22px', height: '22px', fontSize: '9px' }}>
                            {a.assignedTo?.name ? a.assignedTo.name.slice(0, 2).toUpperCase() : 'AS'}
                          </div>
                          <span style={{ fontSize: '11px' }}>{a.assignedTo?.name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td>
                        {a.locationOrLink ? (
                          a.locationOrLink.startsWith('http') ? (
                            <a
                              href={a.locationOrLink}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#4263eb', fontSize: '11px', fontWeight: 600 }}
                            >
                              <Video size={13} /> Join Meeting <ExternalLink size={10} />
                            </a>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#555' }}>{a.locationOrLink}</span>
                          )
                        ) : (
                          <span style={{ color: '#aaa', fontSize: '11px' }}>—</span>
                        )}
                      </td>
                      <td>{getStatusBadge(a.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="icon-btn"
                            style={{ height: '28px', width: '28px' }}
                            onClick={() => handleOpenEdit(a)}
                            title="Edit / Reschedule"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="icon-btn"
                            style={{ height: '28px', width: '28px', color: '#e03131' }}
                            onClick={() => handleDelete(a._id)}
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
        </div>
      )}

      {/* Appointment Create / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '620px' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">{editingItem ? 'Update Appointment' : 'New Schedule Entry'}</p>
                <h2>{editingItem ? 'Edit / Reschedule Meeting' : 'Schedule Appointment'}</h2>
              </div>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {conflictWarning && (
              <div
                style={{
                  background: '#fff4dc',
                  border: '1px solid #ffd175',
                  color: '#945b00',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span>{conflictWarning}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form-grid">
              <label className="wide">
                Appointment Title *
                <input
                  required
                  placeholder="e.g. Z-Factory Demo &amp; Architecture Discovery"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>

              <label>
                Contact Person
                <input
                  placeholder="e.g. Sofia Rodriguez"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                />
              </label>

              <label>
                Company Name
                <input
                  placeholder="e.g. Northstar Logistics"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </label>

              <label>
                Meeting Type *
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {meetingTypes.slice(1).map((t) => (
                    <option key={t} value={t}>{t}</option>
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
                Meeting Date *
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>

              <label>
                Start Time *
                <input
                  required
                  placeholder="e.g. 10:30 AM"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </label>

              <label>
                End Time
                <input
                  placeholder="e.g. 11:30 AM"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </label>

              <label>
                Assigned Specialist
                <select
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                >
                  <option value="">Select Staff</option>
                  {employees.map((emp) => (
                    <option key={emp._id || emp.id} value={emp._id || emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </label>

              <label className="wide">
                Video Meeting Link or Room Location
                <input
                  placeholder="e.g. https://meet.google.com/xyz-abcd-efg"
                  value={form.locationOrLink}
                  onChange={(e) => setForm({ ...form, locationOrLink: e.target.value })}
                />
              </label>

              <label className="wide">
                Agenda / Discussion Notes
                <textarea
                  rows={2}
                  placeholder="Outline key customer requirements or questions to address..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </label>

              <div className="modal-actions" style={{ gridColumn: 'span 2' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Save Appointment' : 'Confirm & Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
