import axiosClient from './axiosClient';

export interface AccessDevice {
  id: number;
  deviceName: string;
  deviceType: string;
  os?: string;
  browser?: string;
  ipAddress: string;
  status: string;
  lastLoginAt: string;
  user?: {
    id: number;
    fullName: string;
    username: string;
    roleName: string;
  };
}

export interface AuditLogItem {
  id: number;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
  createdAt: string;
}

export const tenantService = {
  updateCompanyCode: async (newCode: string) => {
    const res = await axiosClient.put('/tenant/security/code', { newCode });
    return res.data;
  },

  getAccessDevices: async () => {
    const res = await axiosClient.get('/tenant/devices');
    return res.data;
  },

  updateDeviceStatus: async (deviceId: number, status: 'APPROVED' | 'LOCKED' | 'PENDING') => {
    const res = await axiosClient.put(`/tenant/devices/${deviceId}/status`, { status });
    return res.data;
  },

  getAuditLogs: async () => {
    const res = await axiosClient.get('/tenant/logs');
    return res.data;
  },
};

export default tenantService;

