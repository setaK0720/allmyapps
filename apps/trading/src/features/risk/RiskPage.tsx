import { useState, useEffect } from 'react';
import type { RiskConfig } from '../../types/api';

type FormState = {
  maxLotPerTrade: string;
  dailyLossLimit: string;
  maxOpenPositions: string;
};

export default function RiskPage() {
  const [config, setConfig] = useState<RiskConfig | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch('/api/risk-config')
      .then(r => r.json())
      .then((data: unknown) => {
        const d = data as RiskConfig;
        setConfig(d);
        setForm({
          maxLotPerTrade: d.maxLotPerTrade,
          dailyLossLimit: d.dailyLossLimit,
          maxOpenPositions: String(d.maxOpenPositions),
        });
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await fetch('/api/risk-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxLotPerTrade: form.maxLotPerTrade,
          dailyLossLimit: form.dailyLossLimit,
          maxOpenPositions: parseInt(form.maxOpenPositions, 10),
        }),
      });
      setShowConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  if (!form || !config) {
    return <p className="text-gray-400">読み込み中...</p>;
  }

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-semibold">リスク設定</h1>

      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-5">
        <div>
          <label className="text-sm text-gray-400">最大ロット / 注文</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            value={form.maxLotPerTrade}
            onChange={e => setForm({ ...form, maxLotPerTrade: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">日次損失上限（USD）</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            value={form.dailyLossLimit}
            onChange={e => setForm({ ...form, dailyLossLimit: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">最大同時ポジション数</label>
          <input
            type="number"
            step="1"
            min="1"
            className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            value={form.maxOpenPositions}
            onChange={e => setForm({ ...form, maxOpenPositions: e.target.value })}
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors"
          >
            保存
          </button>
        </div>
      </form>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold">設定を変更しますか？</h2>
            <p className="text-sm text-gray-400">
              リスク設定を変更します。変更は即時 Engine に反映されます。
            </p>
            <div className="text-sm space-y-1 bg-gray-800 rounded p-3">
              <p>最大ロット: <span className="text-white">{form.maxLotPerTrade}</span></p>
              <p>日次損失上限: <span className="text-white">${form.dailyLossLimit}</span></p>
              <p>最大ポジション数: <span className="text-white">{form.maxOpenPositions}</span></p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors"
                disabled={saving}
              >
                キャンセル
              </button>
              <button
                onClick={() => { void confirmSave(); }}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
                disabled={saving}
              >
                {saving ? '保存中...' : '確定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
