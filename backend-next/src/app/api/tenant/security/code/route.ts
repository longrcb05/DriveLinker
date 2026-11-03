import { NextRequest } from 'next/server';
import TenantController from '@/tenant/controller/TenantController';

export async function PUT(request: NextRequest) {
  return TenantController.updateCompanyCode(request);
}

