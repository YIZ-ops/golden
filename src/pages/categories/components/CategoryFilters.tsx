import { HITOKOTO_CATEGORIES } from '@/constants/categories';
import type { PersonListItem } from '@/types/person';

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
    (item) =>
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword),
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
      <section className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Search</p>
        <h3 className="mt-3 font-serif text-2xl text-stone-900">分类导航</h3>
        <p className="mt-2 text-sm text-stone-500">搜索分类、作者或歌手，然后直接在当前页继续往下读。</p>
        <div className="mt-5">
          <label className="block">
            <span className="sr-only">搜索分类、作者或歌手</span>
            <input
              aria-label="搜索分类、作者或歌手"
              className="w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-800 outline-none transition focus:border-stone-400"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="搜索分类、作者或歌手"
              type="search"
              value={searchQuery}
            />
          </label>
        </div>
      </section>

      <FilterSection
        items={categories}
        onSelect={(item) => onCategorySelect(item.id)}
        title="一言分类"
        subtitle="点一下，拉一条新的句子进来"
        disabled={loading}
      />
      <FilterSection
        items={authorItems}
        onSelect={(item) => onAuthorSelect(item as PersonListItem)}
        title="作者"
        subtitle="按作者把相关句子集中找出来"
        actionLabel="换一换作者"
        onAction={onRotateAuthors}
        disabled={loading}
      />
      <FilterSection
        items={singerItems}
        onSelect={(item) => onSingerSelect(item as PersonListItem)}
        title="歌手"
        subtitle="按歌手去翻歌词和相关摘句"
        actionLabel="换一换歌手"
        onAction={onRotateSingers}
        disabled={loading}
      />
    </div>
  );
}

function FilterSection({
  title,
  subtitle,
  items,
  onSelect,
  actionLabel,
  onAction,
  disabled,
}: {
  title: string;
  subtitle: string;
  items: FilterSectionItem[];
  onSelect: (item: FilterSectionItem) => void;
  actionLabel?: string;
  onAction?: () => void;
  disabled: boolean;
}) {
  return (
    <section className="rounded-[2rem] border border-stone-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
          <p className="mt-1 text-xs text-stone-500">{subtitle}</p>
        </div>
        {actionLabel && onAction ? (
          <button
            className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-600 transition hover:border-stone-400 hover:text-stone-900"
            disabled={disabled}
            onClick={onAction}
            type="button"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <button
              key={item.id}
              className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700 transition hover:border-stone-400 hover:bg-white hover:text-stone-900 disabled:opacity-60"
              disabled={disabled}
              onClick={() => onSelect(item)}
              type="button"
            >
              {item.name}
            </button>
          ))
        ) : (
          <p className="text-sm text-stone-400">没有匹配项</p>
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
