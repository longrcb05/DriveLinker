package com.drivelinker.report.dto;

import java.util.Map;

public class ReportAnalyticsResponse {
    // 1. Hành trình vận chuyển (Tổng chuyến xe)
    private long totalTrips;
    private long onTimeTrips;
    private long lateTrips;

    // 2. Tần suất vi phạm an toàn
    private long totalAlerts;
    private long level1Alerts;
    private long level2Alerts;
    private long level3Alerts;

    // 3. Hiệu suất trung tâm kiểm soát
    private long resolvedAlerts;
    private long pendingAlerts;

    // 4. Phân loại cảnh báo DMS
    private Map<String, Long> alertTypeDistribution;

    // Getters and Setters

    public long getTotalTrips() {
        return totalTrips;
    }

    public void setTotalTrips(long totalTrips) {
        this.totalTrips = totalTrips;
    }

    public long getOnTimeTrips() {
        return onTimeTrips;
    }

    public void setOnTimeTrips(long onTimeTrips) {
        this.onTimeTrips = onTimeTrips;
    }

    public long getLateTrips() {
        return lateTrips;
    }

    public void setLateTrips(long lateTrips) {
        this.lateTrips = lateTrips;
    }

    public long getTotalAlerts() {
        return totalAlerts;
    }

    public void setTotalAlerts(long totalAlerts) {
        this.totalAlerts = totalAlerts;
    }

    public long getLevel1Alerts() {
        return level1Alerts;
    }

    public void setLevel1Alerts(long level1Alerts) {
        this.level1Alerts = level1Alerts;
    }

    public long getLevel2Alerts() {
        return level2Alerts;
    }

    public void setLevel2Alerts(long level2Alerts) {
        this.level2Alerts = level2Alerts;
    }

    public long getLevel3Alerts() {
        return level3Alerts;
    }

    public void setLevel3Alerts(long level3Alerts) {
        this.level3Alerts = level3Alerts;
    }

    public long getResolvedAlerts() {
        return resolvedAlerts;
    }

    public void setResolvedAlerts(long resolvedAlerts) {
        this.resolvedAlerts = resolvedAlerts;
    }

    public long getPendingAlerts() {
        return pendingAlerts;
    }

    public void setPendingAlerts(long pendingAlerts) {
        this.pendingAlerts = pendingAlerts;
    }

    public Map<String, Long> getAlertTypeDistribution() {
        return alertTypeDistribution;
    }

    public void setAlertTypeDistribution(Map<String, Long> alertTypeDistribution) {
        this.alertTypeDistribution = alertTypeDistribution;
    }
}
