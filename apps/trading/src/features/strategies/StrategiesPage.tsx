import { useState, useEffect } from 'react';
import type { StrategyConfig, NewStrategyConfig } from '../../types/api';

const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];
const STRATEGY_TYPES = ['scalp_ema', 'scalp_rsi'];

async function apiPatch(id: number, body: Partial<StrategyConfig>): Promise<void> {
  await fetch(`/api/strategies/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function apiDelete(id: number): Promise<void> {
  await fetch(`/api/strategies/${id}`, { method: 'DELETE' });
}

async function apiCreate(body: NewStrategyConfig): Promise<StrategyConfig> {
  const r = await fetch('/api/strategies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json() as Promise<StrategyConfig>;
}

type EditState = {
  id: number;
  paramsText: string;
};

const emptyForm: NewStrategyConfig = {
  symbol: '',
  timeframe: 'M1',
  strategyType: 'scalp_ema',
  params: {},
  enabled: false,
};

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<StrategyConfig[]>([]);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NewStrategyConfig>(emptyForm);
  const [paramsError, setParamsError] = useState('');

  const load = () => {
    void fetch('/api/strategies')
      .then(r => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setStrategies(data as StrategyConfig[]);
      });
  };

  useEffect(load, []);

  const toggleEnabled = async (s: StrategyConfig) => {
    await apiPatch(s.id, { enabled: !s.enabled });
    load();
  };

  const startEdit = (s: StrategyConfig) => {
    setEditState({ id: s.id, paramsText: JSON.stringify(s.params, null, 2) });
  };

  const saveParams = async () => {
    if (!editState) return;
    try {
      const parsed = JSON.parse(editState.paramsText) as Record<string, unknown>;
      await apiPatch(editState.id, { params: parsed });
      setEditState(null);
      load();
    } catch {
      setParamsError('JSON の形式が正しくありません');
    }
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    await apiDelete(deleteId);
    setDeleteId(null);
    load();
  };

  const handleCreate = async () => {
    if (!form.symbol.trim()) return;
    await apiCreate(form);
    setShowCreate(false);
    setForm(emptyForm);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">戦略管理</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded transition-colors"
        >
          + 新規作成
        </button>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800">
        {strategies.length === 0 ? (
          <p className="p-4 text-gray-500 text-sm">戦略が登録されていません</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">銘柄</th>
                <th className="px-4 py-2">タイムフレーム</th>
                <th className="px-4 py-2">タイプ</th>
                <th className="px-4 py-2">有効</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {strategies.map(s => (
                <tr key={s.id} className="border-b border-gray-800 last:border-0">
                  <td className="px-4 py-2 text-gray-400">{s.id}</td>
                  <td className="px-4 py-2 font-medium">{s.symbol}</td>
                  <td className="px-4 py-2 text-gray-300">{s.timeframe}</td>
                  <td className="px-4 py-2 text-gray-300">{s.strategyType}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => { void toggleEnabled(s); }}
                      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${s.enabled ? 'bg-green-600' : 'bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${s.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => startEdit(s)}
                      className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => setDeleteId(s.id)}
                      className="text-xs bg-red-900 hover:bg-red-800 text-red-200 px-2 py-1 rounded transition-colors"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Params edit modal */}
      {editState && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="font-semibold">パラメータ編集</h2>
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm font-mono text-gray-100 h-48 resize-none focus:outline-none focus:border-blue-500"
              value={editState.paramsText}
              onChange={e => {
                setEditState({ ...editState, paramsText: e.target.value });
                setParamsError('');
              }}
            />
            {paramsError && <p className="text-red-400 text-sm">{paramsError}</p>}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setEditState(null); setParamsError(''); }}
                className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => { void saveParams(); }}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold">戦略を削除しますか？</h2>
            <p className="text-sm text-gray-400">ID: {deleteId} の戦略を削除します。この操作は取り消せません。</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => { void confirmDelete(); }}
                className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="font-semibold">新規戦略作成</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">銘柄</label>
                <input
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="USDJPY"
                  value={form.symbol}
                  onChange={e => setForm({ ...form, symbol: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">タイムフレーム</label>
                <select
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none"
                  value={form.timeframe}
                  onChange={e => setForm({ ...form, timeframe: e.target.value })}
                >
                  {TIMEFRAMES.map(tf => <option key={tf}>{tf}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">戦略タイプ</label>
                <select
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none"
                  value={form.strategyType}
                  onChange={e => setForm({ ...form, strategyType: e.target.value })}
                >
                  {STRATEGY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowCreate(false); setForm(emptyForm); }}
                className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => { void handleCreate(); }}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
