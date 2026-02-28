import { describe, it, expect } from 'bun:test';
import { filterApps } from '../features/catalog/filter';
import type { AppEntry } from '../data/apps';

const sampleApps: AppEntry[] = [
  {
    id: 'app-a',
    name: 'Task Manager',
    description: 'Manage your tasks',
    url: 'http://localhost:5173',
    category: 'productivity',
    tags: ['tasks', 'todo'],
    status: 'active',
    addedAt: '2026-01-01',
  },
  {
    id: 'app-b',
    name: 'Note App',
    description: 'Take notes easily',
    url: 'http://localhost:5174',
    category: 'productivity',
    tags: ['notes', 'writing'],
    status: 'beta',
    addedAt: '2026-01-02',
  },
  {
    id: 'app-c',
    name: 'Dev Tools',
    description: 'Useful developer utilities',
    url: 'http://localhost:5175',
    category: 'tools',
    tags: ['dev', 'utilities'],
    status: 'active',
    addedAt: '2026-01-03',
  },
];

describe('filterApps', () => {
  it('クエリなし・カテゴリなし・タグなしで全件返す', () => {
    const result = filterApps(sampleApps, { query: '', category: '', tags: [] });
    expect(result).toHaveLength(3);
  });

  it('name に一致するテキストで絞り込む', () => {
    const result = filterApps(sampleApps, { query: 'task', category: '', tags: [] });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('app-a');
  });

  it('description に一致するテキストで絞り込む', () => {
    const result = filterApps(sampleApps, { query: 'notes', category: '', tags: [] });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('app-b');
  });

  it('大文字小文字を区別しない', () => {
    const result = filterApps(sampleApps, { query: 'TASK', category: '', tags: [] });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('app-a');
  });

  it('カテゴリで絞り込む', () => {
    const result = filterApps(sampleApps, { query: '', category: 'tools', tags: [] });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('app-c');
  });

  it('タグ1件で絞り込む', () => {
    const result = filterApps(sampleApps, { query: '', category: '', tags: ['todo'] });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('app-a');
  });

  it('複数タグのAND条件で絞り込む', () => {
    const result = filterApps(sampleApps, { query: '', category: '', tags: ['tasks', 'todo'] });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('app-a');
  });

  it('存在しないタグで0件を返す', () => {
    const result = filterApps(sampleApps, { query: '', category: '', tags: ['nonexistent'] });
    expect(result).toHaveLength(0);
  });

  it('テキスト × カテゴリ × タグのAND条件で絞り込む', () => {
    const result = filterApps(sampleApps, {
      query: 'task',
      category: 'productivity',
      tags: ['tasks'],
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('app-a');
  });

  it('条件が合わない場合は0件を返す', () => {
    const result = filterApps(sampleApps, {
      query: 'task',
      category: 'tools',
      tags: [],
    });
    expect(result).toHaveLength(0);
  });
});
