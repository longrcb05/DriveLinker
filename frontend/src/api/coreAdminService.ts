import axios from 'axios';

const CORE_API_BASE = 'http://localhost:3000/api/core';

export const coreAdminService = {
  login: async (username: string, password: string) => {
    const res = await axios.post(`${CORE_API_BASE}/auth/login`, { username, password });
    return res.data;
  },

  getTenants: async () => {
    const token = sessionStorage.getItem('sys_core_token') || localStorage.getItem('token');
    const res = await axios.get(`${CORE_API_BASE}/tenants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  createTenant: async (data: any) => {
    const token = sessionStorage.getItem('sys_core_token') || localStorage.getItem('token');
    const res = await axios.post(`${CORE_API_BASE}/tenants`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  impersonate: async (tenantId: number) => {
    const token = sessionStorage.getItem('sys_core_token') || localStorage.getItem('token');
    const res = await axios.post(`${CORE_API_BASE}/tenants/${tenantId}/impersonate`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  getPatches: async () => {
    const token = sessionStorage.getItem('sys_core_token') || localStorage.getItem('token');
    const res = await axios.get(`${CORE_API_BASE}/patches`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  syncProduction: async (data: any) => {
    const token = sessionStorage.getItem('sys_core_token') || localStorage.getItem('token');
    const res = await axios.post(`${CORE_API_BASE}/sync-production`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};

export default coreAdminService;

