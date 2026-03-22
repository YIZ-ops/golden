import { badRequest, internalError, successResponse } from "../_lib/http.js";
import { createAnonServerClient } from "../_lib/supabase.js";
import { isPeopleQueryValidationError, parsePeopleQuery } from "./query.js";

interface PersonRow {
  id: string;
  name: string;
  role: "author" | "singer";
}

interface QuotePersonRow {
  person_id: string | null;
}

export async function GET(request: Request) {
  try {
    const parsed = parsePeopleQuery(new URL(request.url));

    if (isPeopleQueryValidationError(parsed)) {
      return badRequest(parsed.message, parsed.code);
    }

    const client = createAnonServerClient();
    const rangeStart = (parsed.page - 1) * parsed.pageSize;
    const rangeEnd = rangeStart + parsed.pageSize - 1;

    let query = client.from("people").select("id, name, role", { count: "exact" }).order("name", { ascending: true });

    if (parsed.role) {
      query = query.eq("role", parsed.role);
    }

    if (parsed.keyword) {
      query = query.ilike("name", `%${parsed.keyword}%`);
    }

    const { data, count, error } = await query.range(rangeStart, rangeEnd);

    if (error) {
      throw error;
    }

    const people = (data ?? []) as PersonRow[];
    const { data: quoteRows, error: quoteError } = await client.from("quotes").select("person_id");

    if (quoteError) {
      throw quoteError;
    }

    const allowedIds = new Set(people.map((item) => item.id));
    const quoteCounts = ((quoteRows ?? []) as QuotePersonRow[]).reduce<Map<string, number>>((map, row) => {
      if (!row.person_id || !allowedIds.has(row.person_id)) {
        return map;
      }

      map.set(row.person_id, (map.get(row.person_id) ?? 0) + 1);
      return map;
    }, new Map());

    const items = people
      .map((item) => ({
        id: item.id,
        name: item.name,
        role: item.role,
        quoteCount: quoteCounts.get(item.id) ?? 0,
      }))
      .filter((item) => item.quoteCount > 0)
      .sort((left, right) => right.quoteCount - left.quoteCount || left.name.localeCompare(right.name, "zh-CN"));

    return successResponse({
      items,
      page: parsed.page,
      pageSize: parsed.pageSize,
      total: count ?? items.length,
    });
  } catch (error) {
    console.error("GET /api/people failed", error);
    return internalError("获取人物列表失败。", "PEOPLE_LIST_FAILED");
  }
}
