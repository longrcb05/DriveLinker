import axiosClient from './axiosClient';

export interface VehicleParams {
  page?: number;
  limit?: number;
  search?: string;
  cluster?: string;
}

export const vehicleService = {
  getFleetList: (params?: VehicleParams) => {
    return axiosClient.get('/vehicles', { params });
  },
  
  addVehicle: (data: any) => {
    return axiosClient.post('/vehicles', data);
  },

  deleteVehicle: (id: string) => {
    return axiosClient.delete(`/vehicles/${id}`);
  }
};