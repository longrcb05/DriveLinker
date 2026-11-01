import { NextRequest } from 'next/server';
import AuthController from '@/auth/controller/AuthController';

export async function GET(request: NextRequest) {
  return AuthController.getMe(request);
}
