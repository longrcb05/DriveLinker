import { NextRequest } from 'next/server';
import CoreAdminController from '@/core/controller/CoreAdminController';

export async function GET(request: NextRequest) {
  return CoreAdminController.getPatches(request);
}

