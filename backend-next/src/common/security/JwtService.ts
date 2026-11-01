import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export interface JwtUserPayload {
  userId: number;
  username: string;
  role: string;
  organizationId: number;
  companyCode: string;
}

/**
 * Service xử lý mã hóa và giải mã JWT Token.
 * Tương ứng 1:1 với com.drivelinker.common.security.JwtService trong Java.
 */
export class JwtService {
  /**
   * Sinh Token JWT với Subject là userId
   */
  static async generateToken(user: JwtUserPayload): Promise<string> {
    return await new SignJWT({
      userId: user.userId,
      username: user.username,
      role: user.role,
      organizationId: user.organizationId,
      companyCode: user.companyCode,
      sub: user.userId.toString(),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(encodedSecret);
  }

  /**
   * Trích xuất thông tin người dùng từ Token
   */
  static async extractUser(token: string): Promise<JwtUserPayload | null> {
    try {
      const { payload } = await jwtVerify(token, encodedSecret);
      return {
        userId: Number(payload.userId),
        username: String(payload.username),
        role: String(payload.role),
        organizationId: Number(payload.organizationId),
        companyCode: String(payload.companyCode),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Lấy token từ Header Request 'Authorization: Bearer <token>'
   */
  static getTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7).trim();
  }
}

export default JwtService;

