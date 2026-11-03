import { NextRequest } from 'next/server';
import AlertController from '@/alert/controller/AlertController';

export async function POST(request: NextRequest) {
  return AlertController.receiveAlert(request);
}

