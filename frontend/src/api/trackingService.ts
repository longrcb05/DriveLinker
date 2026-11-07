import axiosClient from './axiosClient';

export interface TrackingKpi {
  totalVehicles: number;
  rollingCount: number;
  stoppedCount: number;
  parkedCount: number;
  offlineCount: number;
  activeAlertsCount: number;
}

export interface LiveVehiclePosition {
  id: number;
  plateNumber: string;
  model: string;
  make: string;
  year?: number;
  vin?: string;
  status: string;
  movementStatus: string;
  latitude: number | null;
  longitude: number | null;
  speed: number;
  heading: number;
  lastSeenAt: string | null;
  device?: {
    id: number;
    serialNumber: string;
    status: string;
    model?: string;
  } | null;
  currentContract?: {
    contractId: number;
    contractNumber: string;
    customerName: string;
    customerPhone: string;
    startTime: string;
    endTime: string;
  } | null;
}

export const trackingService = {
  getKpi: async () => {
    const res = await axiosClient.get('/tracking/kpi');
    return res.data;
  },

  getPositions: async () => {
    const res = await axiosClient.get('/tracking/positions');
    return res.data;
  },
};

export default trackingService;

