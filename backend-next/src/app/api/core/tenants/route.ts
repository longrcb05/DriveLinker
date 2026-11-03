import { NextRequest } from 'next/server';
import CoreAdminController from '@/core/controller/CoreAdminController';

export async function GET(request: NextRequest) {
  return CoreAdminController.getTenants(request);
}

export async function POST(request: NextRequest) {
  return CoreAdminController.createTenant(request);
}

