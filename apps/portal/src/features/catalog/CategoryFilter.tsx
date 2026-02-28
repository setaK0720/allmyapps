import { Button, Badge } from '@allmyapps/ui';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  allTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  allTags,
  selectedTags,
  onTagToggle,
}: CategoryFilterProps) {
  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="カテゴリフィルター"
        className="flex flex-wrap gap-2"
      >
        <Button
          role="tab"
          aria-selected={selectedCategory === ''}
          variant={selectedCategory === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange('')}
        >
          すべて
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            role="tab"
            aria-selected={selectedCategory === category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="タグフィルター">
          {allTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onTagToggle(tag)}
                aria-pressed={isSelected}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
              >
                <Badge
                  variant={isSelected ? 'default' : 'outline'}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  # {tag}
                </Badge>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
