import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/crm.css';

type RoleOption = 'SUPERADMIN' | 'ADMIN' | 'INTERN';

const demoCredentials: Record<RoleOption, { email: string; pass: string }> = {
  SUPERADMIN: { email: 'superadmin@zeexai.com', pass: 'Admin@123' },
  ADMIN: { email: 'admin@zeexai.com', pass: 'Admin@123' },
  INTERN: { email: 'intern@zeexai.com', pass: 'Intern@123' },
};

export const LoginPage: React.FC = () => {
  const [role, setRole] = useState<RoleOption>('SUPERADMIN');
  const [email, setEmail] = useState('superadmin@zeexai.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Check if routed after logout
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('logged_out')) {
      setToastMessage('Logged out successfully');
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  // When user switches role tab, update default email/pass for quick testing
  const handleRoleChange = (newRole: RoleOption) => {
    setRole(newRole);
    setError('');
    const creds = demoCredentials[newRole];
    setEmail(creds.email);
    setPassword(creds.pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const res = await login(email.trim(), password, role);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message || 'Invalid credentials. Please verify your email, password, and selected role.');
    }
  };

  return (
    <div className="z-login-viewport">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="z-login-toast">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Login Card */}
      <div className="z-login-card">
        {/* Emblem & Branding Header */}
        <div className="z-login-header">
          <div className="z-brand-emblem-wrap">
            <div className="z-brand-emblem">
              <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Shield background */}
                <path
                  d="M20 4L7 9.5V19C7 27.5 12.5 35 20 37C27.5 35 33 27.5 33 19V9.5L20 4Z"
                  fill="url(#emblemGrad)"
                  stroke="#3b3780"
                  strokeWidth="1.5"
                />
                {/* Stylized 'Z' with slash */}
                <path
                  d="M14 14H25.5L16 26H26.5"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 28L28 12"
                  stroke="#6045f5"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="emblemGrad" x1="20" y1="4" x2="20" y2="37" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1a144a" />
                    <stop offset="1" stopColor="#0a0628" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <h1 className="z-login-title">Z-CRM</h1>
          <p className="z-login-subtitle">Please login to access the dashboard</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="z-login-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="z-login-form">
          {/* LOGIN AS Role Selector */}
          <div className="z-role-selector-section">
            <label className="z-field-label">LOGIN AS</label>
            <div className="z-role-pills">
              {(['SUPERADMIN', 'ADMIN', 'INTERN'] as RoleOption[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r)}
                  className={`z-role-pill ${role === r ? 'active' : ''}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Email Address */}
          <div className="z-field-group">
            <label className="z-field-label">EMAIL ADDRESS</label>
            <div className="z-input-wrapper">
              <Mail className="z-input-icon" size={17} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="z-field-group">
            <label className="z-field-label">PASSWORD</label>
            <div className="z-input-wrapper">
              <Lock className="z-input-icon" size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="z-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="z-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="z-btn-loading">
                <span className="z-spinner" />
                Authenticating...
              </span>
            ) : (
              <>
                <span>Access Dashboard</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Hint */}
        <div className="z-quick-hint">
          <span>Demo Role: <strong>{role}</strong></span>
          <span className="z-dot" />
          <span>{demoCredentials[role].email}</span>
        </div>

        {/* Card Footer */}
        <div className="z-login-footer">
          <Shield size={13} />
          <span>SECURED BY ZEEX AI INTELLIGENCE</span>
        </div>
      </div>
    </div>
  );
};
