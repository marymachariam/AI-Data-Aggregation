export interface User {
  id: string;
  email: string;
  company_name: string;
  role: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  company_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Source {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  connection_status: string;
  date_connected: string | null;
  last_synced_at: string | null;
}

export interface CreateSourcePayload {
  name: string;
  type: string;
  credentials?: Record<string, string>;
}

export interface SyncLog {
  id: string;
  source_id: string;
  run_started_at: string | null;
  run_completed_at: string | null;
  files_processed_count: number;
  files_failed_count: number;
  status: string;
}

export interface FileRecord {
  id: string;
  source_id: string;
  file_name: string;
  file_type: string;
  fingerprint: string;
  status: string;
  last_processed_at: string | null;
}

export interface UploadResult {
  status: string;
  file_id: string;
  chunks_created?: number;
}

export interface SearchResponse {
  ids: string[][];
  documents: (string | null)[][];
  metadatas: ({ file_id?: string; chunk_order?: number } | null)[][];
  distances?: number[][];
}

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSource {
  file_name: string;
  snippet: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  log_id: string;
}

export interface AssistantResponse {
  answer: string;
}

export interface KnowledgeGap {
  id: string;
  question: string;
  created_at: string | null;
  reason: "no_sources" | "downvoted";
}

export interface KnowledgeInsights {
  sources: number;
  files_indexed: number;
  files_failed: number;
  chunks: number;
  feedback: { up: number; down: number };
  gaps: KnowledgeGap[];
}

export interface InsightsSummary {
  summary: string;
}