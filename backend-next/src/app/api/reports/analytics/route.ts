import { NextRequest } from 'next/server';
import ReportController from '@/report/controller/ReportController';

export async function GET(request: NextRequest) {
  return ReportController.getAnalytics(request);
}

