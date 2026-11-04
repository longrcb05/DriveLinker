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
  vehicleType?: string;
  year?: number;
  vin?: string;
  status: string;
  movementStatus: string;
  latitude: number | null;
  longitude: number | null;
  speed: number;
  heading?: number;
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
    customerIdCard?: string;
    customerLicense?: string;
    customerAddress?: string;
    startTime: string;
    endTime: string;
    price?: number;
    depositAmount?: number;
    notes?: string;
    status?: string;
  } | null;
}

export interface EvidenceItem {
  alertId: string;
  eventId: string;
  alertType: string;
  severityLevel: string;
  drowsinessScore: number | null;
  latitude: number | null;
  longitude: number | null;
  speed: number;
  occurredAt: string;
  evidenceUrl: string;
}

export interface ContractEvidenceResponse {
  contract: {
    id: number;
    contractCode: string;
    customerName: string;
    customerPhone: string;
    vehiclePlate: string;
    vehicleModel: string;
    startTime: string;
    endTime: string;
    totalDays: number;
  };
  summary: {
    totalEvidence: number;
    filteredCount: number;
    byDate: Record<string, number>;
    byType: Record<string, number>;
  };
  items: EvidenceItem[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
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

  getContractEvidence: async (
    contractId: number,
    params?: { date?: string; alertType?: string; page?: number; limit?: number }
  ) => {
    const res = await axiosClient.get(`/tracking/contracts/${contractId}/evidence`, { params });
    return res.data;
  },

  getExportDossierUrl: (contractId: number) => {
    return `http://localhost:3000/api/tracking/contracts/${contractId}/export-dossier`;
  },
};

export default trackingService;
