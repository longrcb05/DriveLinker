import { NextRequest } from 'next/server';
import TelemetryController from '@/telemetry/controller/TelemetryController';

export async function POST(request: NextRequest) {
  return TelemetryController.receiveGpsData(request);
}

