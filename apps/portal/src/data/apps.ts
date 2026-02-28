export type AppStatus = 'active' | 'beta' | 'archived' | 'planned';

export interface AppEntry {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  status: AppStatus;
  iconUrl?: string;
  screenshotUrls?: string[];
  addedAt: string;
}

const STATUS_ORDER: Record<AppStatus, number> = {
  active: 0,
  beta: 1,
  planned: 2,
  archived: 3,
};

const apps: AppEntry[] = [
  {
    id: 'task-mgmt',
    name: 'タスク管理',
    description:
      'シンプルなタスク管理アプリ。タスクの作成・編集・削除・ステータス管理ができる。',
    url: 'http://localhost:5173',
    category: 'productivity',
    tags: ['tasks', 'todo', 'kanban'],
    status: 'active',
    addedAt: '2026-02-28',
  },
  {
    id: 'app-portal',
    name: 'アプリポータル',
    description: '自作アプリへのアクセスを一元化するポータルサイト。',
    url: 'http://localhost:5174',
    category: 'tools',
    tags: ['portal', 'navigation', 'dashboard'],
    status: 'beta',
    addedAt: '2026-02-28',
  },
];

export function getAllApps(): AppEntry[] {
  return [...apps].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  );
}

export function getAppById(id: string): AppEntry | undefined {
  return apps.find((app) => app.id === id);
}

export function getCategories(): string[] {
  const categories = new Set(apps.map((app) => app.category));
  return Array.from(categories).sort();
}
