import { Link } from 'react-router';
import { Card, Badge } from '@allmyapps/ui';
import type { AppEntry, AppStatus } from '../../data/apps';

interface AppCardProps {
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
        className="h-12 w-12 rounded-lg object-cover"
      />
    );
  }
  const initial = Array.from(app.name)[0] ?? '?';
  return (
    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold select-none">
      {initial}
    </div>
  );
}

export function AppCard({ app }: AppCardProps) {
  const { label, variant } = statusBadge[app.status];

  return (
    <Link to={`/apps/${app.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
      <Card className="h-full p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3 mb-3">
          <AppIcon app={app} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{app.name}</h3>
            <Badge variant={variant} className="mt-1">
              {label}
            </Badge>
          </div>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {app.description}
        </p>

        {app.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {app.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            {app.tags.length > 3 && (
              <Badge variant="secondary">+{app.tags.length - 3}</Badge>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
