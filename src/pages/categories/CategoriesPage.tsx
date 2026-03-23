import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CategoryFilters } from "@/pages/categories/components/CategoryFilters";
import { getPeople } from "@/services/api/people";
import type { PersonListItem } from "@/types/person";

export function CategoriesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [authorOffset, setAuthorOffset] = useState(0);
  const [singerOffset, setSingerOffset] = useState(0);
  const [authors, setAuthors] = useState<PersonListItem[]>([]);
  const [singers, setSingers] = useState<PersonListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPeople() {
      setLoading(true);

      try {
        const [authorResponse, singerResponse] = await Promise.all([
          getPeople({ role: "author", keyword: searchQuery, page: 1, pageSize: 20 }),
          getPeople({ role: "singer", keyword: searchQuery, page: 1, pageSize: 20 }),
        ]);

        if (cancelled) {
          return;
        }

        setAuthors(authorResponse.items);
        setSingers(singerResponse.items);
      } catch {
        if (cancelled) {
          return;
        }

        setAuthors([]);
        setSingers([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPeople();

    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  function handleCategorySelect(categoryId: string) {
    navigate(`/categories/${categoryId}`);
  }

  function handleAuthorSelect(author: PersonListItem) {
    navigate(`/categories/author/${author.id}`, {
      state: {
        personName: author.name,
      },
    });
  }

  function handleSingerSelect(singer: PersonListItem) {
    navigate(`/categories/singer/${singer.id}`, {
      state: {
        personName: singer.name,
      },
    });
  }

  return (
    <section className="space-y-6">
      <CategoryFilters
        authors={authors}
        authorOffset={authorOffset}
        loading={loading}
        onAuthorSelect={handleAuthorSelect}
        onCategorySelect={handleCategorySelect}
        onRotateAuthors={() => setAuthorOffset((value) => value + 4)}
        onRotateSingers={() => setSingerOffset((value) => value + 4)}
        onSearchChange={setSearchQuery}
        onSingerSelect={handleSingerSelect}
        searchQuery={searchQuery}
        singers={singers}
        singerOffset={singerOffset}
      />
    </section>
  );
}
