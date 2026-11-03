import axiosClient from './axiosClient';

export interface CustomerData {
  id?: number;
  fullName: string;
  phone: string;
  idCardNumber: string;
  drivingLicense?: string;
  address?: string;
  organizationId?: number;
}

export const customerService = {
  getAll: async () => {
    const res = await axiosClient.get('/customers');
    return res.data;
  },

  getById: async (id: number | string) => {
    const res = await axiosClient.get(`/customers/${id}`);
    return res.data;
  },

  create: async (data: CustomerData) => {
    const res = await axiosClient.post('/customers', data);
    return res.data;
  }
};

export default customerService;

