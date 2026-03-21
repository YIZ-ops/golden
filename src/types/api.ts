export interface ApiErrorPayload {
  message: string;
  code?: string;
}

export interface ViewerState {
  isFavorited: boolean;
  viewerHeartbeatCount: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
