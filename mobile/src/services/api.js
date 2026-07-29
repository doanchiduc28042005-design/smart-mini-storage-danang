import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend URL - dùng Render deployed backend
export const API_URL = 'https://smart-mini-storage-danang.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 second timeout to prevent infinite loading
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear it
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// ============== AUTH ==============
export const login = (data) => api.post('/auth/login', data);
export const shipperLogin = (data) => api.post('/shippers/login', data);
export const registerCustomer = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const logoutApi = () => api.post('/auth/logout');

// ============== CUSTOMER ORDERS ==============
export const getMyOrders = () => api.get('/auth/my-orders');
export const createMyOrder = (data) => api.post('/auth/create-order', data);

// ============== NOTIFICATIONS ==============
export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (notifId) => api.put(`/notifications/${notifId}/read`);

// ============== ORDERS (Admin) ==============
export const getOrders = () => api.get('/orders');
export const getOrder = (orderId) => api.get(`/orders/${orderId}`);
export const createOrder = (data) => api.post('/orders', data);
export const updateOrderLocation = (orderId, data) => api.patch(`/orders/${orderId}/location`, data);
export const getOrderTrackingHistory = (orderId) => api.get(`/orders/${orderId}/history`);
export const getDashboardStats = () => api.get('/dashboard/stats');

// ============== QR SCAN ==============
export const scanQR = (data) => api.post('/v1/storage/scan', data);

// ============== SHIPPERS ==============
export const getShippers = () => api.get('/shippers');
export const getShipper = (shipperId) => api.get(`/shippers/${shipperId}`);
export const shipperRegister = (data) => api.post('/shippers/register', data);
export const approveShipper = (shipperId) => api.put(`/shippers/${shipperId}/approve`);
export const rejectShipper = (shipperId, data) => api.put(`/shippers/${shipperId}/reject`, data);
export const setupShipperPassword = (data) => api.post('/shippers/setup-password', data);
export const getShipperOrders = (shipperId) => api.get(`/shippers/${shipperId}/orders`);

// ============== CUSTOMERS ==============
export const getCustomers = () => api.get('/customers');
export const getCustomer = (customerId) => api.get(`/customers/${customerId}`);

// ============== EMPLOYEES ==============
export const getEmployees = () => api.get('/employees');
export const createEmployee = (data) => api.post('/employees', data);
export const updateEmployee = (employeeId, data) => api.put(`/employees/${employeeId}`, data);
export const deleteEmployee = (employeeId) => api.delete(`/employees/${employeeId}`);

// ============== INVENTORY ==============
export const getInventory = () => api.get('/inventory');

// ============== ORDER RENEWAL ==============
export const renewOrder = (orderId, months) => api.post(`/orders/${orderId}/renew`, { months });

export default api;
