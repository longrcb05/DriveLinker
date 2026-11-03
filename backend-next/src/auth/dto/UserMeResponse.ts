/**
 * DTO trả về hồ sơ người dùng hiện tại (/api/auth/me).
 * Tương ứng com.drivelinker.auth.dto.UserMeResponse trong Java.
 */
export class UserMeResponse {
  userId: number;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string;
  organizationId: number;
  companyCode: string;
  organizationName: string;
  status: string;

  constructor(
    userId: number,
    username: string,
    fullName: string,
    email: string | null,
    phone: string | null,
    role: string,
    organizationId: number,
    companyCode: string,
    organizationName: string,
    status: string
  ) {
    this.userId = userId;
    this.username = username;
    this.fullName = fullName;
    this.email = email;
    this.phone = phone;
    this.role = role;
    this.organizationId = organizationId;
    this.companyCode = companyCode;
    this.organizationName = organizationName;
    this.status = status;
  }
}

