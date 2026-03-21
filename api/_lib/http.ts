export interface JsonErrorBody {
  message: string;
  code?: string;
}

export function jsonResponse<T>(body: T, init: ResponseInit = {}) {
  return Response.json(body, init);
}

export function successResponse<T>(body: T, status = 200) {
  return jsonResponse(body, { status });
}

export function errorResponse(status: number, message: string, code?: string) {
  return jsonResponse<JsonErrorBody>(
    {
      message,
      code,
    },
    { status },
  );
}

export function badRequest(message: string, code?: string) {
  return errorResponse(400, message, code);
}

export function unauthorized(message: string, code?: string) {
  return errorResponse(401, message, code);
}

export function notFound(message: string, code?: string) {
  return errorResponse(404, message, code);
}

export function conflict(message: string, code?: string) {
  return errorResponse(409, message, code);
}

export function upstreamError(message: string, code?: string) {
  return errorResponse(502, message, code);
}

export function internalError(message = '服务内部错误', code = 'INTERNAL_ERROR') {
  return errorResponse(500, message, code);
}
