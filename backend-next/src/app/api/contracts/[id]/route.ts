import { NextRequest } from 'next/server';
import RentalContractController from '@/rental/controller/RentalContractController';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const contractId = parseInt(params.id, 10);
  return RentalContractController.getContractById(request, contractId);
}

