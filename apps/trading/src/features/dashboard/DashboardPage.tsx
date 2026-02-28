import { useState, useEffect } from 'react';
import { useStream } from '../../hooks/useStream';
import type { StreamEvent, Position, EngineStatus } from '../../types/api';

type AccountSummary = {
  equity: number;
  todayPl: number;
  activeStrategies: number;
  currency: string;
};

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<AccountSummary>({ equity: 0, todayPl: 0, activeStrategies: 0, currency: 'JPY' });
  const [positions, setPositions] = useState<Position[]>([]);

  const refresh = () => {
    void fetch('/api/positions')
      .then(r => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setPositions(data as Position[]);
      });
    void fetch('/api/account')
      .then(r => r.json())
      .then((data: unknown) => {
        const d = data as { equity: number; activeStrategies: number; currency: string };
        setSummary(prev => ({ ...prev, equity: d.equity, activeStrategies: d.activeStrategies, currency: d.currency }));
      });
  };

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  }, []);

  useStream((event: StreamEvent) => {
    if (event.type === 'engine_status') {
      const status = event as EngineStatus & { type: string };
      setSummary(prev => ({
        ...prev,
        equity: status.equity,
        activeStrategies: (event as { strategies: { running: boolean }[] }).strategies.filter(s => s.running).length,
      }));
    }
    if (event.type === 'order_opened' || event.type === 'order_closed') {
      void fetch('/api/positions')
        .then(r => r.json())
        .then((data: unknown) => {
          if (Array.isArray(data)) setPositions(data as Position[]);
        });
      if (event.type === 'order_closed') {
        setSummary(prev => ({ ...prev, todayPl: prev.todayPl + (event as { profit: number }).profit }));
      }
    }
  });

  const totalUnrealizedPl = positions.reduce((acc, p) => acc + parseFloat(p.unrealizedPl), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">ダッシュボード</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <p className="text-sm text-gray-400">口座残高（直近）</p>
          <p className="text-2xl font-bold mt-1">{formatAmount(summary.equity, summary.currency)}</p>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <p className="text-sm text-gray-400">本日確定 P&L</p>
          <p className={`text-2xl font-bold mt-1 ${summary.todayPl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {summary.todayPl >= 0 ? '+' : ''}{formatAmount(summary.todayPl, summary.currency)}
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <p className="text-sm text-gray-400">稼働中戦略</p>
          <p className="text-2xl font-bold mt-1">{summary.activeStrategies}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-medium">オープンポジション</h2>
          <span className="text-sm text-gray-400">
            含み損益合計:{' '}
            <span className={totalUnrealizedPl >= 0 ? 'text-green-400' : 'text-red-400'}>
              {totalUnrealizedPl >= 0 ? '+' : ''}{formatAmount(totalUnrealizedPl, summary.currency)}
            </span>
          </span>
        </div>
        {positions.length === 0 ? (
          <p className="p-4 text-gray-500 text-sm">ポジションなし</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="px-4 py-2">チケット</th>
                <th className="px-4 py-2">銘柄</th>
                <th className="px-4 py-2">種別</th>
                <th className="px-4 py-2">ロット</th>
                <th className="px-4 py-2">含み損益</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(p => (
                <tr key={p.ticket} className="border-b border-gray-800 last:border-0">
                  <td className="px-4 py-2 text-gray-400">{p.ticket}</td>
                  <td className="px-4 py-2 font-medium">{p.symbol}</td>
                  <td className="px-4 py-2">
                    <span className={p.orderType === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                      {p.orderType}
                    </span>
                  </td>
                  <td className="px-4 py-2">{p.lot}</td>
                  <td className={`px-4 py-2 ${parseFloat(p.unrealizedPl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(p.unrealizedPl) >= 0 ? '+' : ''}{formatAmount(parseFloat(p.unrealizedPl), summary.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
