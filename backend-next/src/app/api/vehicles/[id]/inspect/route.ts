import { NextRequest } from 'next/server';
import VehicleController from '@/vehicle/controller/VehicleController';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return VehicleController.inspectVehicle(request, params.id);
}

