package com.drivelinker.ai.dto;

import java.time.LocalDateTime;

public class AiResultRequest {
    private String eventId;
    private Integer drowsinessScore;
    private String eyeStatus;
    private String headPoseStatus;
    private LocalDateTime occurredAt;

    public AiResultRequest() {
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public Integer getDrowsinessScore() {
        return drowsinessScore;
    }

    public void setDrowsinessScore(Integer drowsinessScore) {
        this.drowsinessScore = drowsinessScore;
    }

    public String getEyeStatus() {
        return eyeStatus;
    }

    public void setEyeStatus(String eyeStatus) {
        this.eyeStatus = eyeStatus;
    }

    public String getHeadPoseStatus() {
        return headPoseStatus;
    }

    public void setHeadPoseStatus(String headPoseStatus) {
        this.headPoseStatus = headPoseStatus;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }
}
