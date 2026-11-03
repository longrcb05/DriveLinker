import { NextRequest } from 'next/server';
import AlertController from '@/alert/controller/AlertController';

export async function GET(request: NextRequest) {
  return AlertController.getAlerts(request);
}

