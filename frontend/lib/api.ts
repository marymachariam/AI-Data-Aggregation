import type {
  CreateSourcePayload,
  FileRecord,
  RegisterPayload,
  SearchResponse,
  Source,
  SyncLog,
  TokenResponse,
  UploadResult,
  User,
  ChatHistoryItem,
  ChatResponse,
  KnowledgeInsights,
  AssistantResponse,
  InsightsSummary,
} from "./types";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"
).replace(/\/$/, "");
const TOKEN_KEY = "aggre8_token";

export const UNAUTHORIZED_EVENT = "aggre8:unauthorized";

export const tokenStore = {
  get: (): string | null =>
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => window.localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => window.localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d) =>
          d && typeof d === "object" && "msg" in d
            ? String((d as { msg: unknown }).msg)
            : String(d),
        )
        .join(" ");
    }
  }
  return fallback;
}

function jsonInit(method: string, payload: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  requireAuth = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (requireAuth) {
    const token = tokenStore.get();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      0,
      "Cannot reach the server. Check that the backend is running.",
    );
  }

  const text = await response.text();
  const body = text ? safeJson(text) : null;

  if (response.status === 401 && requireAuth) {
    tokenStore.clear();
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractMessage(body, `Request failed (${response.status})`),
    );
  }

  return body as T;
}

export const api = {
  register: (payload: RegisterPayload) =>
    request<User>("/auth/register", jsonInit("POST", payload), false),

  login: (email: string, password: string) =>
    request<TokenResponse>(
      "/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password }),
      },
      false,
    ),

  me: () => request<User>("/auth/me"),

  listSources: () => request<Source[]>("/sources"),
  createSource: (payload: CreateSourcePayload) =>
    request<Source>("/sources", jsonInit("POST", payload)),
  syncSource: (id: string) =>
    request<SyncLog>(`/sources/${encodeURIComponent(id)}/sync`, {
      method: "POST",
    }),
  getLogs: (id: string) =>
    request<SyncLog[]>(`/sources/${encodeURIComponent(id)}/logs`),
  getFiles: (id: string) =>
    request<FileRecord[]>(`/sources/${encodeURIComponent(id)}/files`),

  deleteSource: (id: string) =>
    request<{ status: string }>(`/sources/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  uploadFile: (id: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<UploadResult>(`/sources/${encodeURIComponent(id)}/upload`, {
      method: "POST",
      body,
    });
  },

  search: (query: string, nResults = 5) =>
    request<SearchResponse>(
      "/search",
      jsonInit("POST", { query, n_results: nResults }),
    ),

  chat: (message: string, history: ChatHistoryItem[]) =>
    request<ChatResponse>("/chat", jsonInit("POST", { message, history })),
  assistantChat: (message: string, history: ChatHistoryItem[]) =>
    request<AssistantResponse>(
      "/chat/assistant",
      jsonInit("POST", { message, history }),
    ),

  sendFeedback: (logId: string, rating: "up" | "down") =>
    request<{ status: string }>(
      "/chat/feedback",
      jsonInit("POST", { log_id: logId, rating }),
    ),

  getInsights: () => request<KnowledgeInsights>("/chat/insights"),

  getInsightsSummary: () =>
    request<InsightsSummary>("/chat/insights/summary", { method: "POST" }),
};
