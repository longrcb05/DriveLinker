import { NextRequest } from 'next/server';
import VehicleController from '@/vehicle/controller/VehicleController';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const vehicleId = parseInt(params.id, 10);
  return VehicleController.getVehicleById(request, vehicleId);
}

