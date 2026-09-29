"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTour } from "@/lib/tour-context";
import { formatDateTime, parseDate, syncStatusTone, timeAgo } from "@/lib/format";
import { sourceTypeLabel } from "@/lib/sourceTypes";
import { colors, tableStyles } from "@/lib/theme";
import { useWorkspaceData } from "@/hooks/useWorkspaceData";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/LoadingBlock";
import { StatCard } from "@/components/StatCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { start, completed } = useTour();
  const { sources, logs, files, loading, error } = useWorkspaceData();

  useEffect(() => {
    if (user && !completed) start();
  }, [user, completed, start]);

  const stats = useMemo(() => {
    const allFiles = Object.values(files).flat();
    const allLogs = Object.values(logs).flat();
    const latest = allLogs
      .map((l) => parseDate(l.run_completed_at ?? l.run_started_at))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return {
      indexed: allFiles.filter((f) => f.status === "processed").length,
      failed: allFiles.filter((f) => f.status === "failed").length,
      lastSync: latest ? timeAgo(latest.toISOString()) : "Never",
    };
  }, [files, logs]);

  const activity = useMemo(
    () =>
      Object.entries(logs)
        .flatMap(([sourceId, list]) =>
          list.map((log) => ({ ...log, sourceName: sources.find((s) => s.id === sourceId)?.name ?? "Unknown" })),
        )
        .sort((a, b) => (parseDate(b.run_started_at)?.getTime() ?? 0) - (parseDate(a.run_started_at)?.getTime() ?? 0))
        .slice(0, 8),
    [logs, sources],
  );

  return (
    <AppShell title="Overview" subtitle="Live status of your connected data. Refreshes every 30 seconds.">
      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <LoadingBlock />
      ) : sources.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            title="Connect your first data source"
            description="Link a tool your company already uses. Its data will be synced, cleaned, and indexed automatically."
            action={<Button onClick={() => router.push("/sources")}>Connect a source</Button>}
          />
        </Card>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <StatCard label="Connected sources" value={sources.length} />
            <StatCard label="Files indexed" value={stats.indexed} />
            <StatCard label="Failed files" value={stats.failed} tone="danger" />
            <StatCard label="Last sync" value={stats.lastSync} />
          </div>

          <Card title="Recent sync activity" padded={false}>
            {activity.length === 0 ? (
              <EmptyState title="No syncs yet" description="Sync runs appear here as soon as the first one starts." />
            ) : (
              <div style={tableStyles.wrapper}>
                <table style={tableStyles.table}>
                  <thead>
                    <tr>
                      <th style={tableStyles.th}>Source</th>
                      <th style={tableStyles.th}>Status</th>
                      <th style={tableStyles.th}>Processed</th>
                      <th style={tableStyles.th}>Failed</th>
                      <th style={tableStyles.th}>Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map((log) => (
                      <tr key={log.id}>
                        <td style={{ ...tableStyles.td, fontWeight: 600 }}>{log.sourceName}</td>
                        <td style={tableStyles.td}>
                          <Badge tone={syncStatusTone(log.status)}>{log.status}</Badge>
                        </td>
                        <td style={tableStyles.td}>{log.files_processed_count}</td>
                        <td style={tableStyles.td}>{log.files_failed_count}</td>
                        <td style={{ ...tableStyles.td, color: colors.textMuted }}>
                          {formatDateTime(log.run_started_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card
            title="Connected sources"
            padded={false}
            action={
              <Button size="sm" variant="secondary" onClick={() => router.push("/sources")}>
                Manage
              </Button>
            }
          >
            <div style={tableStyles.wrapper}>
              <table style={tableStyles.table}>
                <tbody>
                  {sources.map((source) => (
                    <tr key={source.id}>
                      <td style={{ ...tableStyles.td, fontWeight: 600 }}>{source.name}</td>
                      <td style={{ ...tableStyles.td, color: colors.textMuted }}>{sourceTypeLabel(source.type)}</td>
                      <td style={tableStyles.td}>{(files[source.id] ?? []).length} files</td>
                      <td style={tableStyles.td}>
                        <Badge tone={source.connection_status === "active" ? "success" : "neutral"}>
                          {source.connection_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </AppShell>
  );
}