/**
 * Enum loại cảnh báo hành vi tài xế.
 * Tương ứng 1:1 với com.drivelinker.alert.enums.AlertType trong Java.
 */
export enum AlertType {
  DROWSINESS = 'DROWSINESS',
  YAWNING = 'YAWNING',
  HEAD_NOD = 'HEAD_NOD',
  CAMERA_TAMPERING = 'CAMERA_TAMPERING',
}

export default AlertType;

