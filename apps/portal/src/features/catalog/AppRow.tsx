import { Link } from 'react-router';
import { Badge } from '@allmyapps/ui';
import type { AppEntry, AppStatus } from '../../data/apps';

interface AppRowProps {
  app: AppEntry;
}

const statusBadge: Record<AppStatus, { label: string; variant: 'success' | 'default' | 'secondary' | 'warning' | 'outline' }> = {
  active: { label: '稼働中', variant: 'success' },
  beta: { label: 'Beta', variant: 'warning' },
  planned: { label: '計画中', variant: 'secondary' },
  archived: { label: 'アーカイブ', variant: 'outline' },
};

function AppIcon({ app }: { app: AppEntry }) {
  if (app.iconUrl) {
    return (
      <img
        src={app.iconUrl}
        alt={`${app.name} アイコン`}
        className="h-10 w-10 rounded-lg object-cover shrink-0"
      />
    );
  }
  const initial = Array.from(app.name)[0] ?? '?';
  return (
    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-lg font-bold select-none shrink-0">
      {initial}
    </div>
  );
}

export function AppRow({ app }: AppRowProps) {
  const { label, variant } = statusBadge[app.status];

  return (
    <Link
      to={`/apps/${app.id}`}
      className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <AppIcon app={app} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-gray-900">{app.name}</h3>
          <Badge variant={variant}>{label}</Badge>
        </div>
        <p className="text-sm text-gray-600 truncate">{app.description}</p>
      </div>

      <div className="hidden sm:flex flex-wrap gap-1 shrink-0">
        {app.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
    </Link>
  );
}
