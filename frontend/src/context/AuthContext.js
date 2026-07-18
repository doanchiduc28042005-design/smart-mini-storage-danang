import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, setAuthToken, logoutCustomer } from '@/services/api';

const AuthContext = createContext(null);
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = checking, false = not logged in, object = logged in
  const [loading, setLoading] = useState(true);

  const updateActivity = useCallback(() => {
    if (user) {
      localStorage.setItem('last_activity', Date.now().toString());
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    localStorage.setItem('last_activity', Date.now().toString());

    let timeout;
    const handleActivity = () => {
      if (!timeout) {
        timeout = setTimeout(() => {
          updateActivity();
          timeout = null;
        }, 5000);
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, handleActivity));

    const interval = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('last_activity') || '0', 10);
      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        logout(true); // force logout timeout
      }
    }, 60000);

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [user, updateActivity]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setUser(false);
      setLoading(false);
      return;
    }

    const lastActivity = parseInt(localStorage.getItem('last_activity') || '0', 10);
    if (lastActivity && Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
      setAuthToken(null);
      localStorage.removeItem('last_activity');
      setUser(false);
      setLoading(false);
      return;
    }

    try {
      const response = await getMe();
      setUser(response.data);
      localStorage.setItem('last_activity', Date.now().toString());
    } catch (e) {
      setAuthToken(null);
      setUser(false);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    setAuthToken(token);
    setUser(userData);
    localStorage.setItem('last_activity', Date.now().toString());
  };

  const logout = async (forced = false) => {
    try {
      await logoutCustomer();
    } catch (e) {}
    setAuthToken(null);
    localStorage.removeItem('last_activity');
    setUser(false);
    if (forced === true) {
      alert('Phiên đăng nhập đã hết hạn do không có thao tác nào trong 15 phút. Vui lòng đăng nhập lại.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
