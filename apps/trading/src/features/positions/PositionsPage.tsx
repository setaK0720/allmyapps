import { useState, useEffect } from 'react';
import { useStream } from '../../hooks/useStream';
import type { Position, StreamEvent } from '../../types/api';

async function closePosition(ticket: number): Promise<void> {
  await fetch(`/api/control/close-position`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket }),
  });
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);

  const load = () => {
    void fetch('/api/positions')
      .then(r => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setPositions(data as Position[]);
      });
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">ポジション</h1>

      <div className="bg-gray-900 rounded-lg border border-gray-800">
        {positions.length === 0 ? (
          <p className="p-4 text-gray-500 text-sm">オープンポジションなし</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="px-4 py-2">チケット</th>
                <th className="px-4 py-2">銘柄</th>
                <th className="px-4 py-2">種別</th>
                <th className="px-4 py-2">ロット</th>
                <th className="px-4 py-2">建値</th>
                <th className="px-4 py-2">現在値</th>
                <th className="px-4 py-2">含み損益</th>
                <th className="px-4 py-2">戦略 ID</th>
                <th className="px-4 py-2"></th>
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
                  <td className="px-4 py-2 text-gray-300">{p.openPrice}</td>
                  <td className="px-4 py-2 text-gray-300">{p.currentPrice}</td>
                  <td className={`px-4 py-2 ${parseFloat(p.unrealizedPl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(p.unrealizedPl) >= 0 ? '+' : ''}${p.unrealizedPl}
                  </td>
                  <td className="px-4 py-2 text-gray-400">{p.strategyId ?? '—'}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => { void closePosition(p.ticket); }}
                      className="text-xs bg-red-900 hover:bg-red-800 text-red-200 px-2 py-1 rounded transition-colors"
                    >
                      決済
                    </button>
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
