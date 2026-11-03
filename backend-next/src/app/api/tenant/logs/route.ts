import { NextRequest } from 'next/server';
import TenantController from '@/tenant/controller/TenantController';

export async function GET(request: NextRequest) {
  return TenantController.getAuditLogs(request);
}

