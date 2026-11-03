import { NextRequest } from 'next/server';
import CoreAdminController from '@/core/controller/CoreAdminController';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return CoreAdminController.impersonate(request, resolvedParams.id);
}

