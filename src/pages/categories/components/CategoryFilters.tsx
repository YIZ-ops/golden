import { HITOKOTO_CATEGORIES } from "@/constants/categories";
import type { PersonListItem } from "@/types/person";

type FilterSectionItem = {
  id: string;
  name: string;
};

interface CategoryFiltersProps {
  searchQuery: string;
  authors: PersonListItem[];
  authorOffset: number;
  singers: PersonListItem[];
  singerOffset: number;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onCategorySelect: (categoryId: string) => void;
  onAuthorSelect: (author: PersonListItem) => void;
  onSingerSelect: (singer: PersonListItem) => void;
  onRotateAuthors: () => void;
  onRotateSingers: () => void;
}

const ITEMS_PER_PAGE = 4;

export function CategoryFilters({
  searchQuery,
  authors,
  authorOffset,
  singers,
  singerOffset,
  loading,
  onSearchChange,
  onCategorySelect,
  onAuthorSelect,
  onSingerSelect,
  onRotateAuthors,
  onRotateSingers,
}: CategoryFiltersProps) {
  const keyword = searchQuery.trim().toLowerCase();
  const categories = HITOKOTO_CATEGORIES.filter(
    (item) => !keyword || item.name.toLowerCase().includes(keyword) || item.description.toLowerCase().includes(keyword),
  );
  const authorItems = paginateItems(
    authors.filter((item) => !keyword || item.name.toLowerCase().includes(keyword)),
    authorOffset,
  );
  const singerItems = paginateItems(
    singers.filter((item) => !keyword || item.name.toLowerCase().includes(keyword)),
    singerOffset,
  );

  return (
    <div className="space-y-6">
      <div>
        <label className="block">
          <span className="sr-only">搜索分类、作者或歌手</span>
          <input
            aria-label="搜索分类、作者或歌手"
            className="app-input w-full rounded-xl px-4 py-4 text-sm outline-none"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="搜索分类、作者或歌手"
            type="search"
            value={searchQuery}
          />
        </label>
      </div>

      <FilterSection items={categories} onSelect={(item) => onCategorySelect(item.id)} title="主题分类" disabled={loading} />
      <FilterSection
        items={authorItems}
        onSelect={(item) => onAuthorSelect(item as PersonListItem)}
        title="作者"
        actionLabel="换一换"
        onAction={onRotateAuthors}
        disabled={loading}
      />
      <FilterSection
        items={singerItems}
        onSelect={(item) => onSingerSelect(item as PersonListItem)}
        title="歌手"
        actionLabel="换一换"
        onAction={onRotateSingers}
        disabled={loading}
      />
    </div>
  );
}

function FilterSection({
  title,
  items,
  onSelect,
  actionLabel,
  onAction,
  disabled,
}: {
  title: string;
  items: FilterSectionItem[];
  onSelect: (item: FilterSectionItem) => void;
  actionLabel?: string;
  onAction?: () => void;
  disabled: boolean;
}) {
  return (
    <section className="app-border border-b pb-5 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="app-text text-sm font-semibold">{title}</h3>
        </div>
        {actionLabel && onAction ? (
          <button className="app-button-secondary rounded-full px-3 py-1 text-xs transition" disabled={disabled} onClick={onAction} type="button">
            {actionLabel}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <button
              key={item.id}
              className="app-input app-text rounded-full px-4 py-2 text-sm transition hover:bg-[var(--app-input-focus)] disabled:opacity-60"
              disabled={disabled}
              onClick={() => onSelect(item)}
              type="button"
            >
              {item.name}
            </button>
          ))
        ) : (
          <p className="app-muted text-sm">没有匹配项</p>
        )}
      </div>
    </section>
  );
}

function paginateItems(items: FilterSectionItem[], offset: number) {
  if (items.length <= ITEMS_PER_PAGE) {
    return items;
  }

  const normalizedOffset = offset % items.length;
  const result = items.slice(normalizedOffset, normalizedOffset + ITEMS_PER_PAGE);

  if (result.length === ITEMS_PER_PAGE) {
    return result;
  }

  return [...result, ...items.slice(0, ITEMS_PER_PAGE - result.length)];
}
