import { NextRequest } from 'next/server';
import DashboardController from '@/dashboard/controller/DashboardController';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const vehicleId = parseInt(params.id, 10);
  return DashboardController.getJourney(request, vehicleId);
}

