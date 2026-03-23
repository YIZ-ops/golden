import { beforeEach, describe, expect, it, vi } from "vitest";

const requireBearerToken = vi.fn();
const isAuthFailure = vi.fn();
const createUnauthorizedErrorResponse = vi.fn();
const getOptionalBearerToken = vi.fn();
const getUserIdFromJwt = vi.fn();
const createAnonServerClient = vi.fn();
const createUserServerClient = vi.fn();
const getViewerStateMap = vi.fn();
const isQueryValidationError = vi.fn();
const parseQuoteQuery = vi.fn();

vi.mock("../_lib/auth.js", () => ({
  requireBearerToken,
  isAuthFailure,
  createUnauthorizedErrorResponse,
  getOptionalBearerToken,
  getUserIdFromJwt,
}));

vi.mock("../_lib/supabase.js", () => ({
  createAnonServerClient,
  createUserServerClient,
}));

vi.mock("./viewer-state.js", () => ({
  getViewerStateMap,
}));

vi.mock("./query.js", () => ({
  isQueryValidationError,
  parseQuoteQuery,
}));

describe("POST /api/quotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireBearerToken.mockReturnValue("token");
    isAuthFailure.mockReturnValue(false);
    createUnauthorizedErrorResponse.mockImplementation(() => new Response(null, { status: 401 }));
  });

  it("creates a manual quote for an authenticated user", async () => {
    const insert = vi.fn(() => ({
      select: () => ({
        maybeSingle: async () => ({
          data: {
            id: "quote-1",
            content: "自定义句子",
            author: "作者甲",
            category: "分类甲",
            source: "来源甲",
            source_type: "manual",
            created_by: "user-1",
            created_at: "2026-03-23T10:00:00.000Z",
          },
          error: null,
        }),
      }),
    }));

    createUserServerClient.mockReturnValue({
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: "user-1",
              email: "golden@example.com",
            },
          },
          error: null,
        }),
      },
      from: () => ({
        insert,
      }),
    });

    const { POST } = await import("./index");
    const response = await POST(
      new Request("http://localhost/api/quotes", {
        method: "POST",
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "  自定义句子  ",
          author: " 作者甲 ",
          source: " 来源甲 ",
          category: " 分类甲 ",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledWith({
      content: "自定义句子",
      author: "作者甲",
      source: "来源甲",
      category: "分类甲",
      source_type: "manual",
      author_role: "unknown",
      created_by: "user-1",
    });

    await expect(response.json()).resolves.toEqual({
      quote: {
        id: "quote-1",
        content: "自定义句子",
        author: "作者甲",
        source: "来源甲",
        category: "分类甲",
        sourceType: "manual",
        createdAt: "2026-03-23T10:00:00.000Z",
        createdBy: "user-1",
      },
    });
  });

  it("rejects missing content or author", async () => {
    const from = vi.fn();

    createUserServerClient.mockReturnValue({
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: "user-1",
              email: "golden@example.com",
            },
          },
          error: null,
        }),
      },
      from,
    });

    const { POST } = await import("./index");
    const response = await POST(
      new Request("http://localhost/api/quotes", {
        method: "POST",
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "   ",
          author: "",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      code: "INVALID_QUOTE_CREATE",
      message: "quote create 参数无效。",
    });
    expect(from).not.toHaveBeenCalled();
  });
});

describe("GET /api/quotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOptionalBearerToken.mockReturnValue(null);
    isAuthFailure.mockReturnValue(false);
    isQueryValidationError.mockReturnValue(false);
    parseQuoteQuery.mockReturnValue({
      category: null,
      author: null,
      authorRole: null,
      personId: null,
      keyword: null,
      page: 1,
      pageSize: 20,
    });
    getViewerStateMap.mockResolvedValue(null);
  });

  it("returns quote items without joining or serializing works", async () => {
    const range = vi.fn(async () => ({
      data: [
        {
          id: "quote-1",
          content: "分类里的句子",
          author: "作者甲",
          source: "作品甲",
          source_type: "seed",
          created_at: "2026-03-23T10:00:00.000Z",
          people: {
            id: "person-1",
            name: "作者甲",
            role: "author",
          },
          works: {
            id: "work-1",
            title: "作品甲",
            work_type: "book",
          },
        },
      ],
      count: 1,
      error: null,
    }));
    const ilike = vi.fn();
    const eq = vi.fn();
    const order = vi.fn(() => ({
      eq,
      ilike,
      range,
    }));
    const select = vi.fn(() => ({
      order,
    }));

    createAnonServerClient.mockReturnValue({
      from: vi.fn(() => ({
        select,
      })),
    });

    const { GET } = await import("./index");
    const response = await GET(new Request("http://localhost/api/quotes?page=1&pageSize=20"));

    expect(select).toHaveBeenCalledWith("*, people(id, name, role)", { count: "exact" });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [
        {
          id: "quote-1",
          content: "分类里的句子",
          author: "作者甲",
          source: "作品甲",
          sourceType: "seed",
          createdAt: "2026-03-23T10:00:00.000Z",
          person: {
            id: "person-1",
            name: "作者甲",
            role: "author",
          },
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });
  });
});

describe("PATCH /api/quotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireBearerToken.mockReturnValue("token");
    isAuthFailure.mockReturnValue(false);
    createUnauthorizedErrorResponse.mockImplementation(() => new Response(null, { status: 401 }));
  });

  it("updates own manual quote", async () => {
    const ownerCheckMaybeSingle = vi.fn(async () => ({
      data: {
        id: "quote-1",
        created_by: "user-1",
        source_type: "manual",
      },
      error: null,
    }));
    const update = vi.fn(() => ({
      eq: () => ({
        select: () => ({
          maybeSingle: async () => ({
            data: {
              id: "quote-1",
              content: "新内容",
              author: "新作者",
              source: "新来源",
              category: "新分类",
              source_type: "manual",
              created_by: "user-1",
            },
            error: null,
          }),
        }),
      }),
    }));

    const from = vi
      .fn()
      .mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            maybeSingle: ownerCheckMaybeSingle,
          }),
        }),
      })
      .mockReturnValueOnce({
        update,
      });

    createUserServerClient.mockReturnValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from,
    });

    const { PATCH } = await import("./index");
    const response = await PATCH(
      new Request("http://localhost/api/quotes", {
        method: "PATCH",
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: "quote-1",
          content: "新内容",
          author: "新作者",
          source: "新来源",
          category: "新分类",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      content: "新内容",
      author: "新作者",
      source: "新来源",
      category: "新分类",
    });
  });
});

describe("DELETE /api/quotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireBearerToken.mockReturnValue("token");
    isAuthFailure.mockReturnValue(false);
    createUnauthorizedErrorResponse.mockImplementation(() => new Response(null, { status: 401 }));
  });

  it("rejects deleting quote not owned by current user", async () => {
    const deleteFn = vi.fn();
    const from = vi
      .fn()
      .mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: "quote-1",
                created_by: "user-2",
                source_type: "manual",
              },
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        delete: deleteFn,
      });

    createUserServerClient.mockReturnValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from,
    });

    const { DELETE } = await import("./index");
    const response = await DELETE(
      new Request("http://localhost/api/quotes", {
        method: "DELETE",
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: "quote-1" }),
      }),
    );

    expect(response.status).toBe(404);
    expect(deleteFn).not.toHaveBeenCalled();
  });
});
