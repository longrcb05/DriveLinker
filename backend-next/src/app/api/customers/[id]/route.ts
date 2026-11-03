import { NextRequest } from 'next/server';
import CustomerController from '@/customer/controller/CustomerController';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const customerId = parseInt(params.id, 10);
  return CustomerController.getCustomerById(request, customerId);
}

