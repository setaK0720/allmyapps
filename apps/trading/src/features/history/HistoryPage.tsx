import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Trade, TradeStats } from '../../types/api';

type Filters = {
  from: string;
  to: string;
  symbol: string;
};

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export default function HistoryPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [filters, setFilters] = useState<Filters>({ from: monthAgo, to: today, symbol: '' });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.symbol) params.set('symbol', filters.symbol);

    void fetch(`/api/trades?${params.toString()}`)
      .then(r => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setTrades(data as Trade[]);
      });

    void fetch('/api/trades/stats')
      .then(r => r.json())
      .then((data: unknown) => setStats(data as TradeStats));
  }, [filters]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">約定履歴</h1>

      {/* Filters */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 flex gap-4 flex-wrap">
        <div>
          <label className="text-xs text-gray-400 block mb-1">開始日</label>
          <input
            type="date"
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none"
            value={filters.from}
            onChange={e => setFilters({ ...filters, from: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">終了日</label>
          <input
            type="date"
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none"
            value={filters.to}
            onChange={e => setFilters({ ...filters, to: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">銘柄</label>
          <input
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none"
            placeholder="USDJPY"
            value={filters.symbol}
            onChange={e => setFilters({ ...filters, symbol: e.target.value })}
          />
        </div>
      </div>

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <h2 className="text-sm font-medium mb-3 text-gray-300">日次 P&L</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={stats.daily}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', fontSize: 12 }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L']}
                />
                <Line type="monotone" dataKey="profit" stroke="#3b82f6" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <h2 className="text-sm font-medium mb-3 text-gray-300">戦略別 P&L</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.byStrategy}>
                <XAxis dataKey="strategyType" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', fontSize: 12 }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L']}
                />
                <Bar dataKey="profit" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Trades table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800">
        <div className="px-4 py-3 border-b border-gray-800">
          <span className="text-sm text-gray-400">{trades.length} 件</span>
        </div>
        {trades.length === 0 ? (
          <p className="p-4 text-gray-500 text-sm">該当する約定なし</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="px-4 py-2">チケット</th>
                  <th className="px-4 py-2">銘柄</th>
                  <th className="px-4 py-2">種別</th>
                  <th className="px-4 py-2">ロット</th>
                  <th className="px-4 py-2">建値</th>
                  <th className="px-4 py-2">決済値</th>
                  <th className="px-4 py-2">損益</th>
                  <th className="px-4 py-2">状態</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(t => (
                  <tr key={t.id} className="border-b border-gray-800 last:border-0">
                    <td className="px-4 py-2 text-gray-400">{t.ticket}</td>
                    <td className="px-4 py-2 font-medium">{t.symbol}</td>
                    <td className="px-4 py-2">
                      <span className={t.orderType === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                        {t.orderType}
                      </span>
                    </td>
                    <td className="px-4 py-2">{t.lot}</td>
                    <td className="px-4 py-2 text-gray-300">{t.openPrice}</td>
                    <td className="px-4 py-2 text-gray-300">{t.closePrice ?? '—'}</td>
                    <td className={`px-4 py-2 ${t.profit && parseFloat(t.profit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {t.profit ? `${parseFloat(t.profit) >= 0 ? '+' : ''}$${t.profit}` : '—'}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${t.status === 'open' ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-400'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
