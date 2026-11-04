import { NextRequest } from 'next/server';
import TrackingController from '@/tracking/controller/TrackingController';

export async function GET(
  request: NextRequest,
  { params }: { params: { contractId: string } }
) {
  return TrackingController.getContractEvidence(request, params.contractId);
}

