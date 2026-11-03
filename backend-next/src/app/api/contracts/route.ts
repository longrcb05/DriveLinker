import { NextRequest } from 'next/server';
import RentalContractController from '@/rental/controller/RentalContractController';

export async function POST(request: NextRequest) {
  return RentalContractController.createContract(request);
}

export async function GET(request: NextRequest) {
  return RentalContractController.getAllContracts(request);
}
