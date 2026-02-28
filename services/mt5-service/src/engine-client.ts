/**
 * Python Trading Engine の WebSocket に接続し、イベントを受信する。
 * 受信したイベントは eventBus を通じて各ルートに配信される。
 */

import { EventEmitter } from 'events';
import { eq } from 'drizzle-orm';
import { db, positions, trades } from './db/index';

export const eventBus = new EventEmitter();
eventBus.setMaxListeners(100);

const ENGINE_WS_URL = process.env['ENGINE_WS_URL'] ?? 'ws://localhost:8765/ws';
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

let ws: WebSocket | null = null;
let reconnectDelay = RECONNECT_BASE_MS;

export function connectToEngine(): void {
  console.log(`[engine-client] Connecting to ${ENGINE_WS_URL}`);
  try {
    ws = new WebSocket(ENGINE_WS_URL);

    ws.onopen = () => {
      console.log('[engine-client] Connected to Trading Engine');
      reconnectDelay = RECONNECT_BASE_MS;
      eventBus.emit('connected');
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data as string) as Record<string, unknown>;
        await handleEngineEvent(data);
        eventBus.emit('event', data);
      } catch (e) {
        console.error('[engine-client] Event parse error:', e);
      }
    };

    ws.onclose = () => {
      console.warn(`[engine-client] Disconnected. Reconnecting in ${reconnectDelay}ms...`);
      eventBus.emit('disconnected');
      setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
        connectToEngine();
      }, reconnectDelay);
    };

    ws.onerror = (err) => {
      console.error('[engine-client] WebSocket error:', err);
    };
  } catch (e) {
    console.error('[engine-client] Connection failed:', e);
    setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
      connectToEngine();
    }, reconnectDelay);
  }
}

async function handleEngineEvent(event: Record<string, unknown>): Promise<void> {
  const type = event['type'] as string;

  if (type === 'order_opened') {
    await persistOrderOpened(event);
  } else if (type === 'order_closed') {
    await persistOrderClosed(event);
  } else if (type === 'engine_status') {
    await syncPositions(event);
  }
}

async function persistOrderOpened(event: Record<string, unknown>): Promise<void> {
  try {
    const ticket = event['ticket'] as number;
    const now = new Date();
    await db.insert(trades).values({
      ticket,
      symbol: event['symbol'] as string,
      strategyId: (event['strategy_id'] as number) ?? null,
      orderType: event['order_type'] as string,
      lot: String(event['lot']),
      openPrice: String(event['price']),
      openTime: now,
      status: 'open',
    }).onConflictDoNothing();

    await db.insert(positions).values({
      ticket,
      symbol: event['symbol'] as string,
      strategyId: (event['strategy_id'] as number) ?? null,
      orderType: event['order_type'] as string,
      lot: String(event['lot']),
      openPrice: String(event['price']),
      currentPrice: String(event['price']),
      unrealizedPl: '0',
      openTime: now,
    }).onConflictDoNothing();
  } catch (e) {
    console.error('[engine-client] persistOrderOpened error:', e);
  }
}

async function persistOrderClosed(event: Record<string, unknown>): Promise<void> {
  try {
    const ticket = event['ticket'] as number;
    const now = new Date();
    await db.update(trades)
      .set({
        closePrice: event['close_price'] != null ? String(event['close_price']) : null,
        closeTime: now,
        profit: event['profit'] != null ? String(event['profit']) : null,
        status: 'closed',
      })
      .where(eq(trades.ticket, ticket));

    await db.delete(positions).where(eq(positions.ticket, ticket));
  } catch (e) {
    console.error('[engine-client] persistOrderClosed error:', e);
  }
}

async function syncPositions(event: Record<string, unknown>): Promise<void> {
  // engine_status イベントから P&L を更新（将来的な拡張ポイント）
  // 現状は eventBus の転送のみ
}

export async function callEngineApi(path: string, method = 'POST', body?: unknown): Promise<unknown> {
  const ENGINE_API_URL = process.env['ENGINE_API_URL'] ?? 'http://localhost:8765';
  const res = await fetch(`${ENGINE_API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  return res.json();
}
