package com.drivelinker.alert.dto;

import java.time.LocalDateTime;

public class AlertRequest {
    private String eventId;
    private String alertType;
    private String severityLevel;
    private Integer drowsinessScore;
    private Double latitude;
    private Double longitude;
    private LocalDateTime occurredAt;

    public AlertRequest() {
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public String getSeverityLevel() {
        return severityLevel;
    }

    public void setSeverityLevel(String severityLevel) {
        this.severityLevel = severityLevel;
    }

    public Integer getDrowsinessScore() {
        return drowsinessScore;
    }

    public void setDrowsinessScore(Integer drowsinessScore) {
        this.drowsinessScore = drowsinessScore;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }
}