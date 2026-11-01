/**
 * DTO gửi yêu cầu thay đổi giá hợp đồng từ Nhân viên.
 */
export interface PriceChangeRequestDto {
  proposedPrice: number;
  reason: string;
}

