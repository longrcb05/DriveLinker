/**
 * DTO trả về số liệu phân tích và báo cáo quản trị.
 * Tương ứng 1:1 với com.drivelinker.report.dto.ReportAnalyticsResponse trong Java.
 */
export class ReportAnalyticsResponse {
  // 1. Hành trình vận chuyển (Tổng chuyến xe)
  totalTrips: number = 0;
  onTimeTrips: number = 0;
  lateTrips: number = 0;

  // 2. Tần suất vi phạm an toàn
  totalAlerts: number = 0;
  level1Alerts: number = 0;
  level2Alerts: number = 0;
  level3Alerts: number = 0;

  // 3. Hiệu suất trung tâm kiểm soát
  resolvedAlerts: number = 0;
  pendingAlerts: number = 0;

  // 4. Phân loại cảnh báo DMS
  alertTypeDistribution: Record<string, number> = {};
}

export default ReportAnalyticsResponse;

