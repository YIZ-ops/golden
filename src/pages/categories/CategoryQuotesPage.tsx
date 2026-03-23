import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { HITOKOTO_CATEGORIES } from "@/constants/categories";
import type { QuoteListItem } from "@/services/api/quotes";
import { QuoteInfiniteList } from "@/pages/categories/components/QuoteInfiniteList";
import type { PersonRole } from "@/types/person";

type DetailRouteParams = {
  categoryId?: string;
  role?: string;
  personId?: string;
};

type PersonRouteState = {
  personName?: string;
};

type HomeRouteState = {
  focusQuote?: QuoteListItem;
};

const ROLE_TITLE_MAP: Record<PersonRole, string> = {
  author: "作者",
  singer: "歌手",
};

function isPersonRole(value?: string): value is PersonRole {
  return value === "author" || value === "singer";
}

export function CategoryQuotesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId, role, personId } = useParams<DetailRouteParams>();
  const routeState = (location.state ?? {}) as PersonRouteState;
  const [resolvedName, setResolvedName] = useState(routeState.personName ?? "");

  const personRole = isPersonRole(role) ? role : null;
  const category = useMemo(() => HITOKOTO_CATEGORIES.find((item) => item.id === categoryId), [categoryId]);
  const roleTitle = personRole ? ROLE_TITLE_MAP[personRole] : "人物";

  useEffect(() => {
    setResolvedName(routeState.personName ?? "");
  }, [routeState.personName, personId]);

  const isPersonMode = Boolean(personRole && personId);

  const listTitle = useMemo(() => {
    if (isPersonMode) {
      return resolvedName || `${roleTitle}结果`;
    }

    return category?.name || "分类结果";
  }, [category?.name, isPersonMode, resolvedName, roleTitle]);

  const queryParams = useMemo(() => {
    if (isPersonMode && personRole && personId) {
      return {
        personId,
        authorRole: personRole,
      };
    }

    if (category) {
      return {
        category: category.name,
      };
    }

    return null;
  }, [category, isPersonMode, personId, personRole]);

  const invalidErrorMessage = isPersonMode ? "人物参数无效，请返回重试。" : "分类不存在，请返回重试。";
  const requestErrorMessage = isPersonMode ? `加载${roleTitle}金句失败，请稍后重试。` : "加载分类金句失败，请稍后重试。";
  const emptyDescription = isPersonMode
    ? `${listTitle}下还没有可展示的句子。`
    : category
      ? `分类“${category.name}”下还没有可展示的句子。`
      : "当前分类没有可展示的数据。";

  function handleOpenQuote(item: QuoteListItem) {
    navigate("/", {
      state: {
        focusQuote: item,
      } satisfies HomeRouteState,
    });
  }

  return (
    <section className="space-y-4">
      <button
        className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-600 transition hover:border-stone-400 hover:text-stone-900"
        onClick={() => navigate("/categories")}
        type="button"
      >
        <ChevronLeft size={16} />
      </button>

      <QuoteInfiniteList
        emptyDescription={emptyDescription}
        initialLoadingLabel="列表加载中"
        invalidErrorMessage={invalidErrorMessage}
        listTitle={listTitle}
        onItemClick={handleOpenQuote}
        onFirstPageLoaded={(items: QuoteListItem[]) => {
          if (!isPersonMode || routeState.personName || items.length === 0) {
            return;
          }

          const first = items[0];
          setResolvedName(first.person?.name || first.author || "");
        }}
        queryParams={queryParams}
        requestErrorMessage={requestErrorMessage}
      />
    </section>
  );
}
