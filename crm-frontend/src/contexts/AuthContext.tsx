import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../lib/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial token refresh check
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const res = await api.post('/auth/refresh');
        if (res.data?.success && res.data?.accessToken) {
          setAccessToken(res.data.accessToken);
          const meRes = await api.get('/auth/me');
          if (isMounted && meRes.data?.success) {
            setUser(meRes.data.user);
            localStorage.setItem('zeexai_crm_user', JSON.stringify(meRes.data.user));
          }
        }
      } catch {
        // Not authenticated
        if (isMounted) {
          setUser(null);
          localStorage.removeItem('zeexai_crm_user');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string, role?: string) => {
    try {
      const res = await api.post('/auth/login', { email, password, role });
      if (res.data?.success) {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
        localStorage.setItem('zeexai_crm_user', JSON.stringify(res.data.user));
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Login failed' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Network error during login',
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore error
    } finally {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem('zeexai_crm_user');
      const base = window.location.pathname.startsWith('/crm') ? '/crm' : '';
      window.location.href = `${base}/login?logged_out=true`;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

