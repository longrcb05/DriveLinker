import { NextRequest } from 'next/server';
import AnalyticsController from '@/analytics/controller/AnalyticsController';

export async function GET(request: NextRequest) {
  return AnalyticsController.getEvents(request);
}

