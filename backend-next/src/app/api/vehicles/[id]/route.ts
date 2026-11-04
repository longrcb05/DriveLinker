import { NextRequest } from 'next/server';
import VehicleController from '@/vehicle/controller/VehicleController';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return VehicleController.getVehicleById(request, params.id);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return VehicleController.updateVehicle(request, params.id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return VehicleController.deleteVehicle(request, params.id);
}

