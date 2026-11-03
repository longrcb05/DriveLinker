import axiosClient from './axiosClient';

export const dashboardService = {
  getSummary: async () => {
    const res = await axiosClient.get('/dashboard/summary');
    return res.data;
  },

  getVehicleJourney: async (vehicleId: number | string, from: string, to: string) => {
    const res = await axiosClient.get(`/dashboard/vehicles/${vehicleId}/journey?from=${from}&to=${to}`);
    return res.data;
  }
};

export const alertService = {
  getAlerts: async (status?: string) => {
    const url = status ? `/alerts?status=${status}` : '/alerts';
    const res = await axiosClient.get(url);
    return res.data;
  },

  resolveAlert: async (id: number | string, action: string, note?: string) => {
    const res = await axiosClient.post(`/alerts/${id}/resolve`, { action, note });
    return res.data;
  }
};

export default { dashboardService, alertService };

