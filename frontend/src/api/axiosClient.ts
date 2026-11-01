// src/API/axiosClient.ts
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Người gác cổng trước khi gửi Request
axiosClient.interceptors.request.use((config) => {
  // Lấy mã định danh công ty từ LocalStorage
  const tenantId = localStorage.getItem('tenantId');

  // Nhét mã này vào Header (X-Tenant-ID là chuẩn thông lệ quốc tế)
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }

  // Tương tự với Token bảo mật JWT
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

export default axiosClient;
