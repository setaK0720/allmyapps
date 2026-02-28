import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router';

async function emergencyStop(): Promise<void> {
  await fetch('/api/control/emergency-stop', { method: 'POST' });
}

const NAV_ITEMS = [
  { to: '/', label: 'ダッシュボード', end: true },
  { to: '/positions', label: 'ポジション' },
  { to: '/strategies', label: '戦略管理' },
  { to: '/risk', label: 'リスク設定' },
  { to: '/history', label: '約定履歴' },
];

type Props = { children: ReactNode };

export default function Layout({ children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900 px-4 py-3">
        {/* 1行目：タイトル・ハンバーガー・緊急停止 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* ハンバーガーメニュー（スマホのみ表示） */}
            <button
              className="md:hidden p-1 rounded text-gray-400 hover:text-white"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="メニュー"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
            <span className="font-bold text-base tracking-tight">MT5 Auto Trader</span>
          </div>

          <div className="flex items-center gap-3">
            {/* PC 用ナビ */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded text-sm transition-colors ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={() => { void emergencyStop(); }}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold px-3 py-1.5 rounded text-sm transition-colors"
              data-testid="emergency-stop-btn"
            >
              緊急停止
            </button>
          </div>
        </div>

        {/* スマホ用ドロップダウンナビ */}
        {menuOpen && (
          <nav className="md:hidden mt-3 flex flex-col gap-1">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded text-sm transition-colors ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="p-4 md:p-6 max-w-screen-xl mx-auto">{children}</main>
    </div>
  );
}
