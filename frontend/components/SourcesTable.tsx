"use client";

import { colors, tableStyles } from "@/lib/theme";
import { sourceTypeLabel } from "@/lib/sourceTypes";
import { timeAgo } from "@/lib/format";
import type { FileRecord, Source } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface SourcesTableProps {
  sources: Source[];
  files: Record<string, FileRecord[]>;
  onManage: (id: string) => void;
}

export function SourcesTable({ sources, files, onManage }: SourcesTableProps) {
  return (
    <div style={tableStyles.wrapper}>
      <table style={tableStyles.table}>
        <thead>
          <tr>
            <th style={tableStyles.th}>Name</th>
            <th style={tableStyles.th}>Type</th>
            <th style={tableStyles.th}>Status</th>
            <th style={tableStyles.th}>Files</th>
            <th style={tableStyles.th}>Last synced</th>
            <th style={tableStyles.th} />
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => (
            <tr key={source.id}>
              <td style={{ ...tableStyles.td, fontWeight: 600 }}>{source.name}</td>
              <td style={{ ...tableStyles.td, color: colors.textMuted }}>{sourceTypeLabel(source.type)}</td>
              <td style={tableStyles.td}>
                <Badge tone={source.connection_status === "active" ? "success" : "neutral"}>
                  {source.connection_status}
                </Badge>
              </td>
              <td style={tableStyles.td}>{(files[source.id] ?? []).length}</td>
              <td style={{ ...tableStyles.td, color: colors.textMuted }}>{timeAgo(source.last_synced_at)}</td>
              <td style={{ ...tableStyles.td, textAlign: "right" }}>
                <Button size="sm" variant="secondary" onClick={() => onManage(source.id)}>
                  Manage
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}