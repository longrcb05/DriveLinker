import { NextRequest } from 'next/server';
import TrackingController from '@/tracking/controller/TrackingController';

export async function GET(request: NextRequest) {
  return TrackingController.getPositions(request);
}

