import axiosClient from './axiosClient';

export interface CreateContractPayload {
  customerId: number;
  vehicleId: number;
  startTime: string;
  endTime: string;
  price: number;
  depositAmount?: number;
  notes?: string;
}

export const contractService = {
  getAll: async (status?: string) => {
    const url = status ? `/contracts?status=${status}` : '/contracts';
    const res = await axiosClient.get(url);
    return res.data;
  },

  getById: async (id: number | string) => {
    const res = await axiosClient.get(`/contracts/${id}`);
    return res.data;
  },

  create: async (payload: CreateContractPayload) => {
    const res = await axiosClient.post('/contracts', payload);
    return res.data;
  },

  confirm: async (id: number | string) => {
    const res = await axiosClient.post(`/contracts/${id}/confirm`);
    return res.data;
  },

  handover: async (id: number | string) => {
    const res = await axiosClient.post(`/contracts/${id}/handover`);
    return res.data;
  },

  returnVehicle: async (id: number | string) => {
    const res = await axiosClient.post(`/contracts/${id}/return`);
    return res.data;
  }
};

export default contractService;

