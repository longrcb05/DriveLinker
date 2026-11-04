/**
 * DTO trả về sau khi đăng nhập thành công.
 * Tương ứng com.drivelinker.auth.dto.AuthResponse trong Java.
 */
export class AuthResponse {
  token: string;
  username: string;
  role: string;
  organizationId: number;
  companyCode: string;
  organizationName: string;

  constructor(
    token: string,
    username: string,
    role: string,
    organizationId: number,
    companyCode: string = 'CTA2026',
    organizationName: string = 'Demo CTY A'
  ) {
    this.token = token;
    this.username = username;
    this.role = role;
    this.organizationId = organizationId;
    this.companyCode = companyCode;
    this.organizationName = organizationName;
  }
}

export default AuthResponse;
