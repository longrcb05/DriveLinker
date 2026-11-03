import axios from 'axios';

const baseURL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api';

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Người gác cổng trước khi gửi Request
axiosClient.interceptors.request.use((config) => {
  // Lấy mã định danh công ty từ LocalStorage
  const tenantId = localStorage.getItem('tenantId');
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }

  // Token bảo mật JWT (hỗ trợ cả token chuẩn lẫn token phiên admin)
  const token = localStorage.getItem('token') || sessionStorage.getItem('sys_core_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

export default axiosClient;
