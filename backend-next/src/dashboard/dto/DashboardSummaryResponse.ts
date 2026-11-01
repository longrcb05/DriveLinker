/**
 * DTO trả về số liệu tổng quan trên Dashboard.
 * Tương ứng 1:1 với com.drivelinker.dashboard.dto.DashboardSummaryResponse trong Java.
 */
export class DashboardSummaryResponse {
  totalVehicles: number = 0;
  availableVehicles: number = 0;
  rentedVehicles: number = 0;
  maintenanceVehicles: number = 0;
  activeContracts: number = 0;
  activeAlerts: number = 0;
}

export default DashboardSummaryResponse;

