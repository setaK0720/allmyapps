import { useSearchParams } from 'react-router';
import { Button } from '@allmyapps/ui';
import { getAllApps, getCategories } from '../../data/apps';
import { filterApps } from './filter';
import { SearchBar } from './SearchBar';
import { CategoryFilter } from './CategoryFilter';
import { AppGrid } from './AppGrid';
import { AppList } from './AppList';

type ViewMode = 'grid' | 'list';

function getAllTags(): string[] {
  const apps = getAllApps();
  const tags = new Set(apps.flatMap((app) => app.tags));
  return Array.from(tags).sort();
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const tags = searchParams.getAll('tags');
  const view = (searchParams.get('view') ?? 'grid') as ViewMode;

  const allApps = getAllApps();
  const categories = getCategories();
  const allTags = getAllTags();

  const filteredApps = filterApps(allApps, { query, category, tags });

  function setParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    });
  }

  function handleTagToggle(tag: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const current = next.getAll('tags');
      next.delete('tags');
      if (current.includes(tag)) {
        current.filter((t) => t !== tag).forEach((t) => next.append('tags', t));
      } else {
        [...current, tag].forEach((t) => next.append('tags', t));
      }
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">AllMyApps</h1>
          <p className="mt-1 text-sm text-gray-500">自作アプリの一覧</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <SearchBar value={query} onChange={(v) => setParam('q', v)} />

          <div className="flex items-center gap-1 shrink-0" aria-label="表示切替">
            <Button
              variant={view === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setParam('view', 'grid')}
              aria-label="グリッド表示"
              aria-pressed={view === 'grid'}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm8 0A1.5 1.5 0 0 1 10.5 9h3A1.5 1.5 0 0 1 15 10.5v3A1.5 1.5 0 0 1 13.5 15h-3A1.5 1.5 0 0 1 9 13.5z" />
              </svg>
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setParam('view', 'list')}
              aria-label="リスト表示"
              aria-pressed={view === 'list'}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
              </svg>
            </Button>
          </div>
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategory={category}
          onCategoryChange={(c) => setParam('category', c)}
          allTags={allTags}
          selectedTags={tags}
          onTagToggle={handleTagToggle}
        />

        {filteredApps.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">アプリが見つかりません</p>
            <p className="mt-1 text-sm">検索条件を変えてみてください</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {filteredApps.length} 件のアプリ
            </p>
            {view === 'grid' ? (
              <AppGrid apps={filteredApps} />
            ) : (
              <AppList apps={filteredApps} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
