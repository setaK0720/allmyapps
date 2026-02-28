import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { eventBus } from '../engine-client';

export const streamRouter = new Hono();

streamRouter.get('/', (c) => {
  return streamSSE(c, async (stream) => {
    const handler = async (event: Record<string, unknown>) => {
      const type = event['type'] as string;
      // tick は量が多いためストリームに含めない（フロントは engine_status を使う）
      if (type === 'tick') return;
      try {
        await stream.writeSSE({
          data: JSON.stringify(event),
          event: type,
        });
      } catch {
        // クライアント切断時は無視
      }
    };

    eventBus.on('event', handler);

    // 接続確認用の初期イベント
    await stream.writeSSE({
      data: JSON.stringify({ type: 'connected', message: 'SSE stream established' }),
      event: 'connected',
    });

    // 接続を保持
    stream.onAbort(() => {
      eventBus.off('event', handler);
    });

    // 接続を無期限に保持（クライアント切断まで）
    await new Promise<void>((resolve) => {
      stream.onAbort(resolve);
    });
  });
});
