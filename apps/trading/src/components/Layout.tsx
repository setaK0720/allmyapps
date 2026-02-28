import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

async function emergencyStop(): Promise<void> {
  await fetch('/api/control/emergency-stop', { method: 'POST' });
}

type Props = { children: ReactNode };

export default function Layout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg tracking-tight">MT5 Auto Trader</span>
          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm transition-colors ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`
              }
            >
              ダッシュボード
            </NavLink>
            <NavLink
              to="/positions"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm transition-colors ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`
              }
            >
              ポジション
            </NavLink>
            <NavLink
              to="/strategies"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm transition-colors ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`
              }
            >
              戦略管理
            </NavLink>
            <NavLink
              to="/risk"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm transition-colors ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`
              }
            >
              リスク設定
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm transition-colors ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`
              }
            >
              約定履歴
            </NavLink>
          </nav>
        </div>
        <button
          onClick={() => { void emergencyStop(); }}
          className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold px-4 py-2 rounded text-sm transition-colors"
          data-testid="emergency-stop-btn"
        >
          緊急停止
        </button>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
