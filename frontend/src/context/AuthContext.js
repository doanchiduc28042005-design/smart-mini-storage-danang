import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, setAuthToken, logoutCustomer } from '@/services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = checking, false = not logged in, object = logged in
  const [loading, setLoading] = useState(true);

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
    try {
      const response = await getMe();
      setUser(response.data);
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
  };

  const logout = async () => {
    try {
      await logoutCustomer();
    } catch (e) {}
    setAuthToken(null);
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
