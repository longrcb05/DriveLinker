import { NextRequest } from 'next/server';
import AiResultController from '@/ai/controller/AiResultController';

export async function POST(request: NextRequest) {
  return AiResultController.receiveAiResult(request);
}

