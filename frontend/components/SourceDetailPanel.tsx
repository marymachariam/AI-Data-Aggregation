"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  errorMessage,
  fileStatusTone,
  formatDateTime,
  formatDuration,
  parseDate,
  syncStatusTone,
} from "@/lib/format";
import { getSourceType, sourceTypeLabel } from "@/lib/sourceTypes";
import { colors, tableStyles } from "@/lib/theme";
import type { FileRecord, Source, SyncLog } from "@/lib/types";
import { EmptyState } from "@/components/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";

interface SourceDetailPanelProps {
  source: Source | null;
  files: FileRecord[];
  logs: SyncLog[];
  onClose: () => void;
  onChanged: () => Promise<void>;
}

type Tab = "files" | "history";

interface UploadOutcome {
  name: string;
  ok: boolean;
  message: string;
}

interface Notice {
  tone: "success" | "error";
  text: string;
}

export function SourceDetailPanel({ source, files, logs, onClose, onChanged }: SourceDetailPanelProps) {
  const [tab, setTab] = useState<Tab>("files");
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [outcomes, setOutcomes] = useState<UploadOutcome[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!source) return null;

  const definition = getSourceType(source.type);
  const isUpload = source.type === "local_upload";
  const sortedLogs = [...logs].sort(
    (a, b) => (parseDate(b.run_started_at)?.getTime() ?? 0) - (parseDate(a.run_started_at)?.getTime() ?? 0),
  );

  async function handleSync() {
    if (!source) return;
    setSyncing(true);
    setNotice(null);
    try {
      await api.syncSource(source.id);
      await onChanged();
      setNotice({ tone: "success", text: "Sync finished. Results are listed below." });
    } catch (err) {
      setNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete() {
    if (!source) return;
    setDeleting(true);
    try {
      await api.deleteSource(source.id);
      onClose();
      await onChanged();
    } catch (err) {
      setNotice({ tone: "error", text: errorMessage(err) });
      setDeleting(false);
    }
  }

  async function handleFiles(list: FileList | null) {
    if (!source || !list || list.length === 0) return;
    setUploading(true);
    const results: UploadOutcome[] = [];
    for (const file of Array.from(list)) {
      try {
        const result = await api.uploadFile(source.id, file);
        results.push({
          name: file.name,
          ok: true,
          message:
            result.status === "unchanged"
              ? "Already uploaded, no changes."
              : `Indexed ${result.chunks_created ?? 0} chunks.`,
        });
      } catch (err) {
        results.push({ name: file.name, ok: false, message: errorMessage(err) });
      }
    }
    setOutcomes(results);
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    await onChanged();
  }

  const tabButton = (value: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(value)}
      style={{
        padding: "10px 4px",
        marginRight: 20,
        fontSize: 14,
        fontWeight: 600,
        color: tab === value ? colors.primary : colors.textMuted,
        background: "none",
        border: "none",
        borderBottom: `2px solid ${tab === value ? colors.primary : "transparent"}`,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <Drawer
      open
      title={source.name}
      onClose={onClose}
      subtitle={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: colors.textMuted }}>{sourceTypeLabel(source.type)}</span>
          <Badge tone={source.connection_status === "active" ? "success" : "neutral"}>
            {source.connection_status}
          </Badge>
        </div>
      }
    >
      <div style={{ display: "grid", gap: 20 }}>
        {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          {definition?.syncable ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Button onClick={handleSync} loading={syncing}>
                <Icon name="refresh" size={16} />
                Sync now
              </Button>
              <span style={{ fontSize: 13, color: colors.textMuted }}>
                Syncs also run automatically on a schedule.
              </span>
            </div>
          ) : (
            <span />
          )}

          <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
            Remove this source
          </Button>
        </div>

        {isUpload && (
          <div style={{ display: "grid", gap: 12 }}>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept=".pdf,.txt,.csv,.docx"
              onChange={(e) => handleFiles(e.target.files)}
              style={{ display: "none" }}
            />
            <div>
              <Button onClick={() => fileInput.current?.click()} loading={uploading}>
                <Icon name="upload" size={16} />
                Upload files
              </Button>
            </div>
            <span style={{ fontSize: 13, color: colors.textMuted }}>Supported: PDF, Word (.docx), CSV, and text.</span>
            {outcomes.map((o) => (
              <Alert key={o.name} tone={o.ok ? "success" : "error"}>
                <strong>{o.name}</strong>: {o.message}
              </Alert>
            ))}
          </div>
        )}

        <div style={{ borderBottom: `1px solid ${colors.border}` }}>
          {tabButton("files", `Files (${files.length})`)}
          {tabButton("history", `Sync history (${logs.length})`)}
        </div>

        {tab === "files" &&
          (files.length === 0 ? (
            <EmptyState title="No files yet" description="Files appear here once the first sync or upload completes." />
          ) : (
            <div style={tableStyles.wrapper}>
              <table style={tableStyles.table}>
                <thead>
                  <tr>
                    <th style={tableStyles.th}>File</th>
                    <th style={tableStyles.th}>Status</th>
                    <th style={tableStyles.th}>Processed</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.id}>
                      <td style={{ ...tableStyles.td, fontWeight: 500, wordBreak: "break-word" }}>{file.file_name}</td>
                      <td style={tableStyles.td}>
                        <Badge tone={fileStatusTone(file.status)}>{file.status}</Badge>
                      </td>
                      <td style={{ ...tableStyles.td, color: colors.textMuted }}>
                        {formatDateTime(file.last_processed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "history" &&
          (sortedLogs.length === 0 ? (
            <EmptyState title="No syncs yet" description="Each sync run is recorded here with its outcome." />
          ) : (
            <div style={tableStyles.wrapper}>
              <table style={tableStyles.table}>
                <thead>
                  <tr>
                    <th style={tableStyles.th}>Started</th>
                    <th style={tableStyles.th}>Status</th>
                    <th style={tableStyles.th}>Processed</th>
                    <th style={tableStyles.th}>Failed</th>
                    <th style={tableStyles.th}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={tableStyles.td}>{formatDateTime(log.run_started_at)}</td>
                      <td style={tableStyles.td}>
                        <Badge tone={syncStatusTone(log.status)}>{log.status}</Badge>
                      </td>
                      <td style={tableStyles.td}>{log.files_processed_count}</td>
                      <td style={tableStyles.td}>{log.files_failed_count}</td>
                      <td style={{ ...tableStyles.td, color: colors.textMuted }}>
                        {formatDuration(log.run_started_at, log.run_completed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>

      <Modal open={confirming} title="Remove this source?" onClose={() => setConfirming(false)}>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: colors.textMuted, lineHeight: 1.5 }}>
          This deletes {source.name} and everything indexed from it. This can&apos;t be undone.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={() => setConfirming(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Remove
          </Button>
        </div>
      </Modal>
    </Drawer>
  );
}