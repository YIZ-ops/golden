import { HITOKOTO_CATEGORIES } from "../../src/constants/categories.js";

import { upstreamError } from "../_lib/http.js";
import { createServiceRoleClient } from "../_lib/supabase.js";

interface HitokotoResponse {
  uuid: string;
  hitokoto: string;
  from: string;
  from_who: string | null;
  type: string;
}

export interface CanonicalQuoteRow {
  id: string;
  source_quote_id?: string | null;
  content: string;
  author: string;
  source?: string | null;
  category?: string | null;
  source_type?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CanonicalQuote {
  id: string;
  content: string;
  author: string;
  source?: string;
  category?: string;
  sourceType?: "seed" | "hitokoto" | "manual";
  createdAt?: string;
  updatedAt?: string;
}

export async function ingestHitokotoQuote(category?: string | null): Promise<CanonicalQuote> {
  const query = category ? `?c=${encodeURIComponent(category)}` : "";
  const response = await fetch(`https://v1.hitokoto.cn/${query}`);

  if (!response.ok) {
    throw upstreamError("一言接口暂时不可用。", "HITOKOTO_UPSTREAM_FAILED");
  }

  const payload = (await response.json()) as HitokotoResponse;
  const matchedCategory = HITOKOTO_CATEGORIES.find((item) => item.id === payload.type || item.id === category);
  const serviceClient = createServiceRoleClient();

  const quoteLookup = await serviceClient
    .from("quotes")
    .select("id, source_quote_id, content, author, source, category, source_type, created_at, updated_at")
    .eq("source_type", "hitokoto")
    .eq("source_quote_id", payload.uuid)
    .maybeSingle();

  if (quoteLookup.error) {
    throw quoteLookup.error;
  }

  let quote = quoteLookup.data as CanonicalQuoteRow | null;

  if (!quote) {
    const inserted = await serviceClient
      .from("quotes")
      .insert({
        source_quote_id: payload.uuid,
        content: payload.hitokoto,
        author: payload.from_who ?? "佚名",
        source: payload.from,
        category: matchedCategory?.name ?? "其他",
        source_type: "hitokoto",
      })
      .select("id, source_quote_id, content, author, source, category, source_type, created_at, updated_at")
      .single();

    if (inserted.error) {
      throw inserted.error;
    }

    quote = inserted.data as CanonicalQuoteRow;
  }

  return normalizeQuoteRecord(quote);
}

export function normalizeQuoteRecord(row: CanonicalQuoteRow): CanonicalQuote {
  return {
    id: row.id,
    content: row.content,
    author: row.author,
    source: row.source ?? undefined,
    category: row.category ?? undefined,
    sourceType: normalizeSourceType(row.source_type),
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function normalizeSourceType(value?: string | null) {
  if (value === "seed" || value === "hitokoto" || value === "manual") {
    return value;
  }

  return undefined;
}
