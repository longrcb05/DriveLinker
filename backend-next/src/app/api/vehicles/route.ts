import { NextRequest } from 'next/server';
import VehicleController from '@/vehicle/controller/VehicleController';

export async function POST(request: NextRequest) {
  return VehicleController.createVehicle(request);
}

export async function GET(request: NextRequest) {
  return VehicleController.getAllVehicles(request);
}

