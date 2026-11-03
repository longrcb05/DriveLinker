/**
 * DTO nhận dữ liệu đăng nhập.
 * Tương ứng com.drivelinker.auth.dto.LoginRequest trong Java.
 */
export interface LoginRequest {
  companyCode: string;
  username: string;
  password: string;
}

