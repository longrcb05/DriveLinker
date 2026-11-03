import { NextRequest } from 'next/server';
import CoreAdminController from '@/core/controller/CoreAdminController';

export async function POST(request: NextRequest) {
  return CoreAdminController.syncProduction(request);
}

