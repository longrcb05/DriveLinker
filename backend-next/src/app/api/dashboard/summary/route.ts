import { NextRequest } from 'next/server';
import DashboardController from '@/dashboard/controller/DashboardController';

export async function GET(request: NextRequest) {
  return DashboardController.getSummary(request);
}

