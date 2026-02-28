import type { AppEntry } from '../../data/apps';
import { AppRow } from './AppRow';

interface AppListProps {
  apps: AppEntry[];
}

export function AppList({ apps }: AppListProps) {
  return (
    <div className="flex flex-col gap-2">
      {apps.map((app) => (
        <AppRow key={app.id} app={app} />
      ))}
    </div>
  );
}
