import { NextRequest } from 'next/server';
import TenantController from '@/tenant/controller/TenantController';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return TenantController.updateDeviceStatus(request, resolvedParams.id);
}

