import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { CRMLayout } from './components/layout/CRMLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { BrochureDownloadsPage } from './pages/BrochureDownloadsPage';
import { SchedulePage } from './pages/SchedulePage';
import { CampaignsPage } from './pages/CampaignsPage';
import { DirectMailPage } from './pages/DirectMailPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { LeadAssignmentPage } from './pages/LeadAssignmentPage';
import { AcknowledgementsPage } from './pages/AcknowledgementsPage';
import { MessagesPage } from './pages/MessagesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  // Support both /crm subpath and root domain deployment seamlessly
  const routerBase =
    import.meta.env.VITE_ROUTER_BASE !== undefined
      ? import.meta.env.VITE_ROUTER_BASE
      : typeof window !== 'undefined' && window.location.pathname.startsWith('/crm')
      ? '/crm'
      : '';

  return (
    <AuthProvider>
      <BrowserRouter basename={routerBase}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <CRMLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/brochures" element={<BrochureDownloadsPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/mail" element={<DirectMailPage />} />
            <Route path="/quotations" element={<QuotationsPage />} />
            <Route path="/assignments" element={<LeadAssignmentPage />} />
            <Route path="/acknowledgements" element={<AcknowledgementsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

