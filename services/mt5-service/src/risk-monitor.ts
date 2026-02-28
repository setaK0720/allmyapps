/**
 * 日次損失上限の監視。
 * engine_status イベントを監視し、上限超過時に Engine に PAUSE を送信する。
 */

import { eventBus, callEngineApi } from './engine-client';
import { db, riskConfig } from './db/index';

let dailyStartEquity: number | null = null;
let pauseSent = false;
let lastDate = new Date().toDateString();

export function startRiskMonitor(): void {
  eventBus.on('event', async (event: Record<string, unknown>) => {
    if (event['type'] !== 'engine_status') return;

    const equity = event['equity'] as number | undefined;
    if (equity == null) return;

    // 日付が変わったらリセット
    const today = new Date().toDateString();
    if (today !== lastDate) {
      dailyStartEquity = null;
      pauseSent = false;
      lastDate = today;
    }

    if (dailyStartEquity == null) {
      dailyStartEquity = equity;
      return;
    }

    const dailyLoss = dailyStartEquity - equity;
    if (dailyLoss <= 0) return;

    try {
      const [config] = await db.select().from(riskConfig).limit(1);
      if (!config) return;

      const limit = parseFloat(config.dailyLossLimit);
      if (dailyLoss >= limit && !pauseSent) {
        console.warn(`[risk-monitor] 日次損失上限到達: $${dailyLoss.toFixed(2)} / $${limit.toFixed(2)}`);
        pauseSent = true;
        await callEngineApi('/control/pause');
        eventBus.emit('event', {
          type: 'risk_alert',
          level: 'error',
          message: `日次損失上限到達: $${dailyLoss.toFixed(2)}。全戦略を一時停止しました。`,
        });
      } else if (dailyLoss >= limit * 0.8 && !pauseSent) {
        eventBus.emit('event', {
          type: 'risk_alert',
          level: 'warning',
          message: `日次損失が上限の 80% に達しています: $${dailyLoss.toFixed(2)}`,
        });
      }
    } catch (e) {
      console.error('[risk-monitor] Error:', e);
    }
  });
}
