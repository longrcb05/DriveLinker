import axiosClient from './axiosClient';

export interface PriceRequestPayload {
  proposedPrice: number;
  reason: string;
}

export const priceService = {
  createRequest: async (contractId: number | string, data: PriceRequestPayload) => {
    const res = await axiosClient.post(`/contracts/${contractId}/price-requests`, data);
    return res.data;
  },

  getRequests: async (status?: string) => {
    const url = status ? `/price-requests?status=${status}` : '/price-requests';
    const res = await axiosClient.get(url);
    return res.data;
  },

  approve: async (id: number | string, managerNote?: string) => {
    const res = await axiosClient.post(`/price-requests/${id}/approve`, { managerNote });
    return res.data;
  },

  reject: async (id: number | string, managerNote: string) => {
    const res = await axiosClient.post(`/price-requests/${id}/reject`, { managerNote });
    return res.data;
  }
};

export default priceService;

