import { NextRequest } from 'next/server';
import AlertController from '@/alert/controller/AlertController';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return AlertController.resolveAlert(request, params.id);
}

