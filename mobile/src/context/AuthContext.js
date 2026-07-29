import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getMe } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        // No token, skip API call
        setLoading(false);
        return;
      }
      
      const response = await getMe();
      if (response.data) {
        setUser(response.data);
        setRole(response.data.role || 'customer');
      }
    } catch (error) {
      console.error('Lỗi tải thông tin user:', error?.message || error);
      // Clear invalid/expired token
      await AsyncStorage.removeItem('token');
      setUser(null);
      setRole(null);
    } finally {
      // Always set loading to false to prevent infinite loading
      setLoading(false);
    }
  };

  const login = async (token, userData) => {
    await AsyncStorage.setItem('token', token);
    setUser(userData);
    setRole(userData.role || 'customer');
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};
