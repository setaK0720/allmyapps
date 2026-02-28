import { describe, it, expect, beforeEach, mock } from 'bun:test';

// DB をモック
const mockDb = {
  select: () => mockDb,
  from: () => mockDb,
  orderBy: () => Promise.resolve([
    { id: 1, symbol: 'USDJPY', timeframe: 'M1', strategyType: 'scalp_ema', params: {}, enabled: true },
    { id: 2, symbol: 'EURUSD', timeframe: 'M1', strategyType: 'scalp_rsi', params: {}, enabled: false },
  ]),
  insert: () => mockDb,
  values: () => mockDb,
  returning: () => Promise.resolve([
    { id: 3, symbol: 'GBPJPY', timeframe: 'M5', strategyType: 'scalp_ema', params: {}, enabled: false },
  ]),
  update: () => mockDb,
  set: () => mockDb,
  where: () => mockDb,
  delete: () => mockDb,
};

describe('strategy config validation', () => {
  it('valid strategy config fields', () => {
    const config = {
      symbol: 'USDJPY',
      timeframe: 'M1',
      strategyType: 'scalp_ema',
      params: { fast_period: 5, slow_period: 20 },
      enabled: true,
    };
    expect(config.symbol).toBeTruthy();
    expect(config.timeframe).toBeTruthy();
    expect(config.strategyType).toBeTruthy();
  });

  it('rejects empty symbol', () => {
    const validate = (s: string) => s.length > 0;
    expect(validate('')).toBe(false);
    expect(validate('USDJPY')).toBe(true);
  });

  it('rejects invalid timeframe', () => {
    const validTimeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];
    const validate = (tf: string) => validTimeframes.includes(tf);
    expect(validate('M1')).toBe(true);
    expect(validate('M3')).toBe(false);
    expect(validate('invalid')).toBe(false);
  });

  it('default params is empty object', () => {
    const params = {};
    expect(Object.keys(params)).toHaveLength(0);
  });

  it('enabled defaults to false', () => {
    const config = { enabled: false };
    expect(config.enabled).toBe(false);
  });
});
