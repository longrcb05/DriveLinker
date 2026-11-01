/**
 * Enum định nghĩa trạng thái hợp đồng thuê xe (DRAFT, CONFIRMED, ACTIVE...).
 * Tương ứng 1:1 với com.drivelinker.rental.enums.ContractStatus trong Java.
 */
export enum ContractStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export default ContractStatus;

