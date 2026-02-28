import { useParams, Navigate, Link } from 'react-router';
import { Badge } from '@allmyapps/ui';
import { getAppById } from '../../data/apps';
import type { AppStatus } from '../../data/apps';

const statusBadge: Record<AppStatus, { label: string; variant: 'success' | 'default' | 'secondary' | 'warning' | 'outline' }> = {
  active: { label: '稼働中', variant: 'success' },
  beta: { label: 'Beta', variant: 'warning' },
  planned: { label: '計画中', variant: 'secondary' },
  archived: { label: 'アーカイブ', variant: 'outline' },
};

export function AppDetailPage() {
  const { id } = useParams<{ id: string }>();
  const app = id ? getAppById(id) : undefined;

  if (!app) {
    return <Navigate to="/" replace />;
  }

  const { label, variant } = statusBadge[app.status];
  const initial = Array.from(app.name)[0] ?? '?';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            一覧に戻る
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            {app.iconUrl ? (
              <img
                src={app.iconUrl}
                alt={`${app.name} アイコン`}
                className="h-16 w-16 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold select-none shrink-0">
                {initial}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{app.name}</h1>
                <Badge variant={variant}>{label}</Badge>
              </div>
              <p className="text-sm text-gray-500">
                カテゴリ: <span className="font-medium text-gray-700">{app.category}</span>
                　追加日: <span className="font-medium text-gray-700">{app.addedAt}</span>
              </p>
            </div>
          </div>

          <p className="mt-4 text-gray-700 leading-relaxed">{app.description}</p>

          {app.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {app.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  # {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-6">
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md font-medium border bg-blue-600 text-white hover:bg-blue-700 border-transparent px-6 py-3 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              アプリを開く
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {app.screenshotUrls && app.screenshotUrls.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">スクリーンショット</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {app.screenshotUrls.map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <img
                    src={url}
                    alt={`${app.name} スクリーンショット ${index + 1}`}
                    className="w-full h-48 object-cover"
                  />
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
