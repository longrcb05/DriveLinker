import { NextRequest } from 'next/server';
import CustomerController from '@/customer/controller/CustomerController';

export async function POST(request: NextRequest) {
  return CustomerController.createCustomer(request);
}

export async function GET(request: NextRequest) {
  return CustomerController.getAllCustomer(request);
}

