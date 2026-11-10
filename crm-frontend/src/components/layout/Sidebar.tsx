import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarDays,
  Mail,
  Target,
  Send,
  FileText,
  ClipboardCheck,
  ShieldCheck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen = false,
  setMobileOpen,
}) => {
  const { user, logout } = useAuth();

  const handleNavClick = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const navWorkspace = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Leads & Requests', path: '/leads', icon: Users, count: 24 },
    { label: 'Brochure Downloads', path: '/brochures', icon: BookOpen },
    { label: 'Schedule', path: '/schedule', icon: CalendarDays, count: 3 },
    { label: 'Messages', path: '/messages', icon: Mail, count: 8 },
    { label: 'Marketing Campaigns', path: '/campaigns', icon: Target },
  ];

  const navOperations = [
    { label: 'Direct Mail', path: '/mail', icon: Send },
    { label: 'Quotations', path: '/quotations', icon: FileText },
    { label: 'Lead Assignment', path: '/assignments', icon: ClipboardCheck },
    { label: 'Acknowledgements', path: '/acknowledgements', icon: ShieldCheck },
  ];

  const navInsights = [
    { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const renderItem = (item: any) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={handleNavClick}
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        style={{ textDecoration: 'none' }}
      >
        <Icon size={17} />
        <span style={{ textDecoration: 'none' }}>{item.label}</span>
        {item.count && <em>{item.count}</em>}
      </NavLink>
    );
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">Z</div>
        <div className="brand-copy">
          <strong>Z-CRM</strong>
          <span>Enterprise Portal</span>
        </div>
        {setMobileOpen && (
          <button
            className="mobile-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close Navigation"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <button className="workspace-switch">
        <span className="workspace-dot" />
        <span className="workspace-text">Z-CRM Workspace</span>
        <ChevronDown size={14} />
      </button>

      <div className="nav-section">
        <span className="nav-label">Workspace</span>
        {navWorkspace.map(renderItem)}
      </div>

      <div className="nav-section">
        <span className="nav-label">Operations</span>
        {navOperations.map(renderItem)}
      </div>

      <div className="nav-section">
        <span className="nav-label">Insights</span>
        {navInsights.map(renderItem)}
      </div>

      <div className="sidebar-bottom">
        <div className="help-row" style={{ cursor: 'pointer' }} onClick={() => logout()}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </div>
        <div className="user-row">
          <div className="avatar avatar-purple">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ZC'}
          </div>
          <div className="user-copy">
            <strong>{user?.name || 'Authorized Staff'}</strong>
            <span>{user?.role || 'SUPERADMIN'}</span>
          </div>
        </div>
      </div>

      <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
};

