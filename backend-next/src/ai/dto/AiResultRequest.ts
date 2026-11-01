/**
 * DTO nhận kết quả phân tích AI hành vi tài xế.
 * Tương ứng 1:1 với com.drivelinker.ai.dto.AiResultRequest trong Java.
 */
export interface AiResultRequest {
  eventId: string;
  drowsinessScore?: number;
  eyeStatus?: string;
  headPoseStatus?: string;
  occurredAt: string | Date;
}

