/**
 * DTO gửi yêu cầu xử lý/đóng Cảnh báo từ Nhân viên trực điều hành.
 */
export interface AlertResolutionRequest {
  note?: string;
  action?: string;
}

