import { createUnauthorizedErrorResponse, getUserIdFromJwt, isAuthFailure, requireBearerToken } from "../../_lib/auth.js";
import { badRequest, internalError, successResponse, unauthorized } from "../../_lib/http.js";
import { createUserServerClient } from "../../_lib/supabase.js";
import { ensureDefaultFolder, getFolderById, listFoldersWithCounts, readFolderIdFromBody, readFolderName } from "../folders-shared.js";

export async function GET(request: Request) {
  try {
    const authResult = await authenticate(request);

    if (authResult instanceof Response) {
      return authResult;
    }

    const { userClient, userId } = authResult;
    const items = await listFoldersWithCounts(userClient, userId);

    return successResponse({ items });
  } catch (error) {
    console.error("GET /api/favorites/folders failed", error);
    return internalError("获取收藏夹失败。", "FAVORITE_FOLDERS_LIST_FAILED");
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await authenticate(request);

    if (authResult instanceof Response) {
      return authResult;
    }

    const { userClient, userId } = authResult;
    const body = (await request.json()) as { name?: unknown };
    const name = readFolderName(body.name);

    if (!name) {
      return badRequest("收藏夹名称不能为空，且不能超过 24 个字符。", "INVALID_FOLDER_NAME");
    }

    const { data, error } = await userClient
      .from("favorite_folders")
      .insert({
        user_id: userId,
        name,
        is_default: false,
      })
      .select("id, name, is_default, created_at, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return successResponse(
      {
        item: {
          id: data.id,
          name: data.name,
          isDefault: Boolean(data.is_default),
          quoteCount: 0,
          createdAt: data.created_at ?? undefined,
          updatedAt: data.updated_at ?? undefined,
        },
      },
      201,
    );
  } catch (error) {
    console.error("POST /api/favorites/folders failed", error);
    return internalError("创建收藏夹失败。", "FAVORITE_FOLDER_CREATE_FAILED");
  }
}

export async function PATCH(request: Request) {
  try {
    const authResult = await authenticate(request);

    if (authResult instanceof Response) {
      return authResult;
    }

    const { userClient, userId } = authResult;
    const body = (await request.json()) as { folderId?: unknown; name?: unknown };
    const folderId = typeof body.folderId === "string" ? body.folderId.trim() : "";
    const name = readFolderName(body.name);

    if (!folderId) {
      return badRequest("folderId 不能为空。", "INVALID_FOLDER_ID");
    }

    if (!name) {
      return badRequest("收藏夹名称不能为空，且不能超过 24 个字符。", "INVALID_FOLDER_NAME");
    }

    const folder = await getFolderById(userClient, userId, folderId);

    if (!folder) {
      return badRequest("收藏夹不存在。", "FOLDER_NOT_FOUND");
    }

    const { data, error } = await userClient
      .from("favorite_folders")
      .update({
        name,
      })
      .eq("id", folder.id)
      .eq("user_id", userId)
      .select("id, name, is_default, created_at, updated_at")
      .single();

    if (error) {
      throw error;
    }

    const { count, error: countError } = await userClient
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("folder_id", folder.id);

    if (countError) {
      throw countError;
    }

    return successResponse({
      item: {
        id: data.id,
        name: data.name,
        isDefault: Boolean(data.is_default),
        quoteCount: count ?? 0,
        createdAt: data.created_at ?? undefined,
        updatedAt: data.updated_at ?? undefined,
      },
    });
  } catch (error) {
    console.error("PATCH /api/favorites/folders failed", error);
    return internalError("重命名收藏夹失败。", "FAVORITE_FOLDER_UPDATE_FAILED");
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await authenticate(request);

    if (authResult instanceof Response) {
      return authResult;
    }

    const { userClient, userId } = authResult;
    const folderId = await readFolderIdFromBody(request);

    if (!folderId) {
      return badRequest("folderId 不能为空。", "INVALID_FOLDER_ID");
    }

    const folder = await getFolderById(userClient, userId, folderId);

    if (!folder) {
      return badRequest("收藏夹不存在。", "FOLDER_NOT_FOUND");
    }

    if (folder.is_default) {
      return badRequest("默认收藏夹不能删除。", "DEFAULT_FOLDER_DELETE_FORBIDDEN");
    }

    const defaultFolder = await ensureDefaultFolder(userClient, userId);

    const { error: moveError } = await userClient
      .from("favorites")
      .update({ folder_id: defaultFolder.id })
      .eq("user_id", userId)
      .eq("folder_id", folder.id);

    if (moveError) {
      throw moveError;
    }

    const { error: deleteError } = await userClient.from("favorite_folders").delete().eq("id", folder.id).eq("user_id", userId);

    if (deleteError) {
      throw deleteError;
    }

    return successResponse({ deleted: true, movedToFolderId: defaultFolder.id });
  } catch (error) {
    console.error("DELETE /api/favorites/folders failed", error);
    return internalError("删除收藏夹失败。", "FAVORITE_FOLDER_DELETE_FAILED");
  }
}

async function authenticate(request: Request) {
  const token = requireBearerToken(request.headers.get("Authorization"));

  if (isAuthFailure(token)) {
    return createUnauthorizedErrorResponse(token);
  }

  const userId = getUserIdFromJwt(token);

  if (!userId) {
    return unauthorized("当前登录凭证无效，请重新登录。", "INVALID_TOKEN");
  }

  return {
    userClient: createUserServerClient(token),
    userId,
  };
}
