import axiosClient from './axiosClient';

export interface AnalyticsEvent {
  id: number;
  eventId: string;
  vehicleId: number;
  plateNumber: string;
  vehicleModel: string;
  alertType: string;
  severity: string;
  status: string;
  drowsinessScore?: number;
  latitude?: number;
  longitude?: number;
  timestamp: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export interface AnalyticsKpi {
  safetyScore: number;
  totalViolations: number;
  resolvedCount: number;
  pendingCount: number;
  resolutionRate: number;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  typeBreakdown: Record<string, number>;
}

export const analyticsService = {
  getEvents: async (params?: { date?: string; status?: string; severity?: string; limit?: number }) => {
    const res = await axiosClient.get('/analytics/events', { params });
    return res.data;
  },

  getKpis: async (date?: string) => {
    const res = await axiosClient.get('/analytics/kpis', { params: { date } });
    return res.data;
  },

  getExportCsvUrl: (date?: string) => {
    const token = localStorage.getItem('token') || '';
    const dateQuery = date ? `?date=${date}` : '';
    return `http://localhost:3000/api/analytics/export${dateQuery}`;
  },
};

export default analyticsService;

