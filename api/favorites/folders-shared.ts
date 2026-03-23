import { badRequest } from "../_lib/http.js";

export interface FavoriteFolderRecord {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FavoriteFolderSummary {
  id: string;
  name: string;
  isDefault: boolean;
  quoteCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export async function ensureDefaultFolder(userClient: any, userId: string) {
  const { data, error } = await userClient
    .from("favorite_folders")
    .select("id, user_id, name, is_default, created_at, updated_at")
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data as FavoriteFolderRecord;
  }

  const { data: inserted, error: insertError } = await userClient
    .from("favorite_folders")
    .insert({
      user_id: userId,
      name: "默认收藏夹",
      is_default: true,
    })
    .select("id, user_id, name, is_default, created_at, updated_at")
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted as FavoriteFolderRecord;
}

export async function getFolderById(userClient: any, userId: string, folderId: string) {
  const { data, error } = await userClient
    .from("favorite_folders")
    .select("id, user_id, name, is_default, created_at, updated_at")
    .eq("id", folderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as FavoriteFolderRecord | null) ?? null;
}

export async function listFoldersWithCounts(userClient: any, userId: string) {
  const defaultFolder = await ensureDefaultFolder(userClient, userId);

  const [{ data: folderRows, error: folderError }, { data: favoriteRows, error: favoritesError }] = await Promise.all([
    userClient
      .from("favorite_folders")
      .select("id, user_id, name, is_default, created_at, updated_at")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
    userClient.from("favorites").select("folder_id").eq("user_id", userId),
  ]);

  if (folderError) {
    throw folderError;
  }

  if (favoritesError) {
    throw favoritesError;
  }

  const records = ((folderRows ?? []) as FavoriteFolderRecord[]).length > 0 ? ((folderRows ?? []) as FavoriteFolderRecord[]) : [defaultFolder];

  const countMap = ((favoriteRows ?? []) as Array<{ folder_id?: string | null }>).reduce<Map<string, number>>((map, row) => {
    const key = row.folder_id || defaultFolder.id;
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map());

  return records.map((folder) => ({
    id: folder.id,
    name: folder.name,
    isDefault: Boolean(folder.is_default),
    quoteCount: countMap.get(folder.id) ?? 0,
    createdAt: folder.created_at ?? undefined,
    updatedAt: folder.updated_at ?? undefined,
  })) as FavoriteFolderSummary[];
}

export function readFolderName(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length > 24) {
    return null;
  }

  return normalized;
}

export async function readFolderIdFromBody(request: Request) {
  try {
    const body = (await request.json()) as { folderId?: unknown };
    return readQueryValue(typeof body.folderId === "string" ? body.folderId : null);
  } catch {
    return null;
  }
}

export function readQueryValue(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function parsePagination(url: URL) {
  const page = Number(readQueryValue(url.searchParams.get("page")) ?? "1");
  const pageSize = Number(readQueryValue(url.searchParams.get("pageSize")) ?? "20");

  if (!Number.isInteger(page) || !Number.isInteger(pageSize) || page < 1 || pageSize < 1 || pageSize > 50) {
    return badRequest("分页参数无效，page 必须大于等于 1，pageSize 必须在 1 到 50 之间。", "INVALID_PAGINATION");
  }

  return {
    page,
    pageSize,
  };
}
