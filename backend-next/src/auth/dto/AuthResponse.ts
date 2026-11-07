/**
 * DTO trả về sau khi đăng nhập thành công.
 * Tương ứng com.drivelinker.auth.dto.AuthResponse trong Java.
 */
export class AuthResponse {
  token: string;
  username: string;
  role: string;
  organizationId: number;

  constructor(token: string, username: string, role: string, organizationId: number) {
    this.token = token;
    this.username = username;
    this.role = role;
    this.organizationId = organizationId;
  }
}

