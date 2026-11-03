import axiosClient from './axiosClient';

export interface LoginParams {
  companyCode: string;
  username: string;
  password: string;
}

export interface AuthData {
  token: string;
  username: string;
  role: string;
  organizationId: number;
}

export const authService = {
  login: async (params: LoginParams) => {
    const res = await axiosClient.post('/auth/login', params);
    return res.data;
  },

  getMe: async () => {
    const res = await axiosClient.get('/auth/me');
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('tenantCode');
    localStorage.removeItem('tenantName');
    localStorage.removeItem('organizationId');
    window.location.href = '/portal/login';
  }
};

export default authService;

