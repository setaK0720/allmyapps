import type { AppEntry } from '../../data/apps';
import { AppCard } from './AppCard';

interface AppGridProps {
  apps: AppEntry[];
}

export function AppGrid({ apps }: AppGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}
