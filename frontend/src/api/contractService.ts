import axiosClient from './axiosClient';

export interface CreateContractPayload {
  customerId?: number;
  vehicleId?: number;
  customerName?: string;
  customerPhone?: string;
  idCardNumber?: string;
  carPlate?: string;
  startTime: string;
  endTime: string;
  price: number;
  depositAmount?: number;
  notes?: string;
  [key: string]: any;
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
  },

  recall: async (id: number | string, data: any) => {
    const res = await axiosClient.post(`/contracts/${id}/recall`, data);
    return res.data;
  },

  settleRecall: async (id: number | string, data: any) => {
    const res = await axiosClient.put(`/contracts/${id}/recall/settle`, data);
    return res.data;
  }
};

export default contractService;

