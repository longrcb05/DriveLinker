import { NextRequest } from 'next/server';
import PriceChangeController from '@/price/controller/PriceChangeController';

export async function GET(request: NextRequest) {
  return PriceChangeController.getRequests(request);
}

export async function POST(request: NextRequest) {
  return PriceChangeController.createRequest(request);
}
