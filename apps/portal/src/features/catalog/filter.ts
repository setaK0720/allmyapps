import type { AppEntry } from '../../data/apps';

export interface FilterParams {
  query: string;
  category: string;
  tags: string[];
}

export function filterApps(apps: AppEntry[], params: FilterParams): AppEntry[] {
  const { query, category, tags } = params;
  const normalizedQuery = query.trim().toLowerCase();

  return apps.filter((app) => {
    const matchesQuery =
      !normalizedQuery ||
      app.name.toLowerCase().includes(normalizedQuery) ||
      app.description.toLowerCase().includes(normalizedQuery) ||
      app.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

    const matchesCategory = !category || app.category === category;

    const matchesTags =
      tags.length === 0 || tags.every((tag) => app.tags.includes(tag));

    return matchesQuery && matchesCategory && matchesTags;
  });
}
