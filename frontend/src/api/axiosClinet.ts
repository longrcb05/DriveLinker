import axios from 'axios';

const axiosClient = axios.create({
  // Đọc domain backend từ biến môi trường của Vite, fallback về cổng mặc định
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động đính kèm Token vào mọi request gửi đi
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('drivelinker_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Xử lý phản hồi tập trung (Đá văng ra trang Login nếu Token hết hạn)
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('drivelinker_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;