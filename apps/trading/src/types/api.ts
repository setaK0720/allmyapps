export type StrategyConfig = {
  id: number;
  symbol: string;
  timeframe: string;
  strategyType: string;
  params: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NewStrategyConfig = Omit<StrategyConfig, 'id' | 'createdAt' | 'updatedAt'>;

export type RiskConfig = {
  id: number;
  maxLotPerTrade: string;
  dailyLossLimit: string;
  maxOpenPositions: number;
  emergencyStop: boolean;
  updatedAt: string;
};

export type Trade = {
  id: number;
  ticket: number;
  symbol: string;
  strategyId: number | null;
  orderType: 'BUY' | 'SELL';
  lot: string;
  openPrice: string;
  closePrice: string | null;
  openTime: string;
  closeTime: string | null;
  profit: string | null;
  swap: string | null;
  commission: string | null;
  status: 'open' | 'closed';
  createdAt: string;
};

export type Position = {
  ticket: number;
  symbol: string;
  strategyId: number | null;
  orderType: 'BUY' | 'SELL';
  lot: string;
  openPrice: string;
  currentPrice: string;
  unrealizedPl: string;
  openTime: string;
  updatedAt: string;
};

export type TradeStats = {
  daily: { date: string; profit: number }[];
  monthly: { month: string; profit: number }[];
  byStrategy: { strategyId: number; symbol: string; strategyType: string; profit: number }[];
};

export type EngineStatus = {
  running: boolean;
  strategies: { id: number; symbol: string; running: boolean }[];
  equity: number;
};

// SSE event types
export type StreamEvent =
  | { type: 'order_opened'; ticket: number; symbol: string; orderType: string; lot: number; price: number; strategyId: number }
  | { type: 'order_closed'; ticket: number; profit: number; closePrice: number }
  | { type: 'engine_status'; running: boolean; strategies: EngineStatus['strategies']; equity: number }
  | { type: 'risk_alert'; level: 'warning' | 'critical'; message: string };
