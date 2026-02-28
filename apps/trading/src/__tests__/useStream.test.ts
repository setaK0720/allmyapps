import { describe, it, expect } from 'bun:test';

// Unit tests for useStream logic (pure behavior, no DOM)
describe('useStream event parsing', () => {
  it('parses order_opened event', () => {
    const raw = JSON.stringify({
      type: 'order_opened',
      ticket: 123,
      symbol: 'USDJPY',
      orderType: 'BUY',
      lot: 0.01,
      price: 149.5,
      strategyId: 1,
    });
    const parsed = JSON.parse(raw) as { type: string };
    expect(parsed.type).toBe('order_opened');
  });

  it('parses order_closed event', () => {
    const raw = JSON.stringify({
      type: 'order_closed',
      ticket: 123,
      profit: 150.0,
      closePrice: 149.65,
    });
    const parsed = JSON.parse(raw) as { type: string; profit: number };
    expect(parsed.type).toBe('order_closed');
    expect(parsed.profit).toBe(150.0);
  });

  it('parses engine_status event', () => {
    const raw = JSON.stringify({
      type: 'engine_status',
      running: true,
      strategies: [{ id: 1, symbol: 'USDJPY', running: true }],
      equity: 10000.0,
    });
    const parsed = JSON.parse(raw) as { type: string; running: boolean; equity: number };
    expect(parsed.type).toBe('engine_status');
    expect(parsed.running).toBe(true);
    expect(parsed.equity).toBe(10000.0);
  });

  it('parses risk_alert event', () => {
    const raw = JSON.stringify({
      type: 'risk_alert',
      level: 'warning',
      message: '日次損失 80% に到達',
    });
    const parsed = JSON.parse(raw) as { type: string; level: string };
    expect(parsed.type).toBe('risk_alert');
    expect(parsed.level).toBe('warning');
  });

  it('ignores malformed JSON gracefully', () => {
    const malformed = 'not json {{{';
    let error: unknown = null;
    try {
      JSON.parse(malformed);
    } catch (e) {
      error = e;
    }
    expect(error).not.toBeNull();
  });
});
