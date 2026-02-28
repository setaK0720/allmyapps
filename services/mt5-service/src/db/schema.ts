import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  varchar,
  bigint,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const strategyConfigs = pgTable('strategy_configs', {
  id: serial('id').primaryKey(),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  timeframe: varchar('timeframe', { length: 10 }).notNull(),
  strategyType: varchar('strategy_type', { length: 50 }).notNull(),
  params: jsonb('params').notNull().default({}),
  enabled: boolean('enabled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const riskConfig = pgTable('risk_config', {
  id: integer('id').primaryKey().default(1),
  maxLotPerTrade: decimal('max_lot_per_trade', { precision: 10, scale: 2 }).notNull().default('0.01'),
  dailyLossLimit: decimal('daily_loss_limit', { precision: 10, scale: 2 }).notNull().default('100.00'),
  maxOpenPositions: integer('max_open_positions').notNull().default(3),
  emergencyStop: boolean('emergency_stop').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const trades = pgTable('trades', {
  id: serial('id').primaryKey(),
  ticket: bigint('ticket', { mode: 'number' }).unique().notNull(),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  strategyId: integer('strategy_id').references(() => strategyConfigs.id),
  orderType: varchar('order_type', { length: 10 }).notNull(),
  lot: decimal('lot', { precision: 10, scale: 2 }).notNull(),
  openPrice: decimal('open_price', { precision: 20, scale: 5 }).notNull(),
  closePrice: decimal('close_price', { precision: 20, scale: 5 }),
  openTime: timestamp('open_time', { withTimezone: true }).notNull(),
  closeTime: timestamp('close_time', { withTimezone: true }),
  profit: decimal('profit', { precision: 10, scale: 2 }),
  swap: decimal('swap', { precision: 10, scale: 2 }),
  commission: decimal('commission', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 10 }).notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const positions = pgTable('positions', {
  ticket: bigint('ticket', { mode: 'number' }).primaryKey(),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  strategyId: integer('strategy_id').references(() => strategyConfigs.id),
  orderType: varchar('order_type', { length: 10 }).notNull(),
  lot: decimal('lot', { precision: 10, scale: 2 }).notNull(),
  openPrice: decimal('open_price', { precision: 20, scale: 5 }).notNull(),
  currentPrice: decimal('current_price', { precision: 20, scale: 5 }).notNull(),
  unrealizedPl: decimal('unrealized_pl', { precision: 10, scale: 2 }).notNull(),
  openTime: timestamp('open_time', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type StrategyConfig = typeof strategyConfigs.$inferSelect;
export type NewStrategyConfig = typeof strategyConfigs.$inferInsert;
export type RiskConfig = typeof riskConfig.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type Position = typeof positions.$inferSelect;
