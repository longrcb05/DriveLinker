import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import TrackingService from '@/tracking/service/TrackingService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  // Mặc định lấy tổ chức CTA2026 (id: 2)
  const org = (await prisma.organization.findFirst({ where: { companyCode: 'CTA2026' } })) || (await prisma.organization.findFirst());
  const orgId = org ? org.id : 2;

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Gửi dữ liệu ban đầu ngay lập tức
      try {
        const positions = await TrackingService.getPositions(orgId);
        const kpi = await TrackingService.getKpi(orgId);
        controller.enqueue(
          encoder.encode(`event: initial\ndata: ${JSON.stringify({ positions, kpi, timestamp: Date.now() })}\n\n`)
        );
      } catch (err) {
        console.error('[SSE Initial Error]', err);
      }

      // 2. Định kỳ gửi heartbeat & cập nhật tọa độ mỗi 3 giây
      const interval = setInterval(async () => {
        try {
          const positions = await TrackingService.getPositions(orgId);
          controller.enqueue(
            encoder.encode(`event: positions\ndata: ${JSON.stringify(positions)}\n\n`)
          );
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 3000);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

