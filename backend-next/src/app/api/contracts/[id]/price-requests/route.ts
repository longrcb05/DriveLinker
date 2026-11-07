import { NextRequest } from 'next/server';
import PriceChangeController from '@/price/controller/PriceChangeController';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const contractId = parseInt(params.id, 10);
  return PriceChangeController.createRequest(request, contractId);
}

