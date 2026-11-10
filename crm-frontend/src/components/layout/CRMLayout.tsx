import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Bell, Search, ChevronDown, Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/crm.css';

export const CRMLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="crm-shell">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>

            <div className="breadcrumb">
              <span>Workspace</span>
              <span>/</span>
              <strong>Portal</strong>
            </div>
          </div>

          <div className="top-actions">
            <div className="global-search">
              <Search size={17} />
              <input placeholder="Search records, leads, events..." />
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-btn notification" title="Notifications">
              <Bell size={18} />
              <i />
            </button>
            <button className="profile-btn">
              <div className="avatar avatar-purple">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ZC'}
              </div>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        <div className="page-wrap">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

