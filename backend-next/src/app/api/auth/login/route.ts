import { NextRequest } from 'next/server';
import AuthController from '@/auth/controller/AuthController';

export async function POST(request: NextRequest) {
  return AuthController.login(request);
}
