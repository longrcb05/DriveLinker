/**
 * Enum tư thế đầu của tài xế.
 * Tương ứng 1:1 với com.drivelinker.ai.enums.HeadPoseStatus trong Java.
 */
export enum HeadPoseStatus {
  NORMAL = 'NORMAL',
  LOOKING_DOWN = 'LOOKING_DOWN',
  LOOKING_LEFT = 'LOOKING_LEFT',
  LOOKING_RIGHT = 'LOOKING_RIGHT',
  TILTED = 'TILTED',
}

export default HeadPoseStatus;

