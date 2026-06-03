import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const apiClient = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Customers
export const getCustomers = () => apiClient.get('/customers');
export const createCustomer = (data) => apiClient.post('/customers', data);
export const getCustomer = (id) => apiClient.get(`/customers/${id}`);

// Shippers
export const getShippers = () => apiClient.get('/shippers');
export const createShipper = (data) => apiClient.post('/shippers', data);
export const getShipper = (id) => apiClient.get(`/shippers/${id}`);

// Boxes
export const getBoxes = (status) => apiClient.get('/boxes', { params: { status } });
export const createBox = (data) => apiClient.post('/boxes', data);
export const getBox = (boxId) => apiClient.get(`/boxes/${boxId}`);
export const deleteBox = (boxId) => apiClient.delete(`/boxes/${boxId}`);

// QR Scan & Tracking
export const scanQR = (data) => apiClient.post('/v1/storage/scan', data);
export const getBoxHistory = (boxId) => apiClient.get(`/boxes/${boxId}/history`);

// QR Generation
export const generateQR = (boxId) => apiClient.post('/qr/generate', null, { params: { box_id: boxId } });

// Dashboard
export const getDashboardStats = () => apiClient.get('/dashboard/stats');

export default apiClient;
