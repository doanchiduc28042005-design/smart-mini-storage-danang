import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const apiClient = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Auth token management
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('auth_token');
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Initialize token from localStorage
const savedToken = localStorage.getItem('auth_token');
if (savedToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

// Auth endpoints
export const registerCustomer = (data) => apiClient.post('/auth/register', data);
export const loginCustomer = (data) => apiClient.post('/auth/login', data);
export const getMe = () => apiClient.get('/auth/me');
export const logoutCustomer = () => apiClient.post('/auth/logout');
export const getMyOrders = () => apiClient.get('/auth/my-orders');
export const createMyOrder = (data) => apiClient.post('/auth/create-order', data);

// Customers
export const getCustomers = () => apiClient.get('/customers');
export const createCustomer = (data) => apiClient.post('/customers', data);
export const getCustomer = (id) => apiClient.get(`/customers/${id}`);

// Employees
export const getEmployees = () => apiClient.get('/employees');
export const createEmployee = (data) => apiClient.post('/employees', data);
export const updateEmployee = (id, data) => apiClient.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => apiClient.delete(`/employees/${id}`);

// Shippers
export const getShippers = () => apiClient.get('/shippers');
export const getShipper = (id) => apiClient.get(`/shippers/${id}`);
export const registerShipper = (data) => apiClient.post('/shippers/register', data);
export const approveShipper = (id) => apiClient.put(`/shippers/${id}/approve`);
export const rejectShipper = (id, data) => apiClient.put(`/shippers/${id}/reject`, data);
export const setupShipperPassword = (data) => apiClient.post('/shippers/setup-password', data);
export const loginShipper = (data) => apiClient.post('/shippers/login', data);
export const getShipperOrders = (id) => apiClient.get(`/shippers/${id}/orders`);

// Orders
export const getOrders = (status) => apiClient.get('/orders', { params: { status } });
export const createOrder = (data) => apiClient.post('/orders', data);
export const getOrder = (orderId) => apiClient.get(`/orders/${orderId}`);
export const deleteOrder = (orderId, reason) => apiClient.delete(`/orders/${orderId}`, { data: { reason } });
export const updateOrderLocation = (orderId, data) => apiClient.patch(`/orders/${orderId}/location`, data);
export const processQRScan = (data) => apiClient.post('/qr/scan', data);

// Notifications
export const getNotifications = () => apiClient.get('/notifications');
export const markNotificationRead = (notifId) => apiClient.put(`/notifications/${notifId}/read`);


// QR Scan & Tracking
export const scanQR = (data) => apiClient.post('/v1/storage/scan', data);
export const getOrderHistory = (orderId) => apiClient.get(`/orders/${orderId}/history`);

// QR Generation
export const generateQR = (orderId) => apiClient.post('/qr/generate', null, { params: { order_id: orderId } });

// Dashboard
export const getDashboardStats = () => apiClient.get('/dashboard/stats');

export default apiClient;
