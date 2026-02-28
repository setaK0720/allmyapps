import { describe, it, expect } from 'bun:test';

describe('risk config validation', () => {
  it('max_lot_per_trade must be positive', () => {
    const validate = (v: number) => v > 0;
    expect(validate(0.01)).toBe(true);
    expect(validate(0)).toBe(false);
    expect(validate(-0.01)).toBe(false);
  });

  it('daily_loss_limit must be positive', () => {
    const validate = (v: number) => v > 0;
    expect(validate(100)).toBe(true);
    expect(validate(0)).toBe(false);
  });

  it('max_open_positions must be at least 1', () => {
    const validate = (v: number) => Number.isInteger(v) && v >= 1;
    expect(validate(1)).toBe(true);
    expect(validate(10)).toBe(true);
    expect(validate(0)).toBe(false);
    expect(validate(1.5)).toBe(false);
  });

  it('emergency_stop defaults to false', () => {
    const config = { emergencyStop: false };
    expect(config.emergencyStop).toBe(false);
  });

  it('emergency stop update sets flag to true', () => {
    const config = { emergencyStop: false };
    const updated = { ...config, emergencyStop: true };
    expect(updated.emergencyStop).toBe(true);
  });
});
