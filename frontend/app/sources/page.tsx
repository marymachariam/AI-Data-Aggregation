"use client";

import { useState } from "react";
import { useWorkspaceData } from "@/hooks/useWorkspaceData";
import { AddSourceModal } from "@/components/AddSourceModal";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/LoadingBlock";
import { SourceDetailPanel } from "@/components/SourceDetailPanel";
import { SourcesTable } from "@/components/SourcesTable";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

export default function SourcesPage() {
  const { sources, logs, files, loading, error, reload } = useWorkspaceData();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = sources.find((s) => s.id === selectedId) ?? null;

  return (
    <AppShell
      title="Data sources"
      subtitle="The tools your company data is pulled from."
      actions={
        <Button data-tour="add-source" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={16} />
          Add source
        </Button>
      }
    >
      {error && <Alert tone="error">{error}</Alert>}

      <Card padded={false} data-tour="sources-list">
        {loading ? (
          <LoadingBlock />
        ) : sources.length === 0 ? (
          <EmptyState
            title="No sources connected"
            description="Add a source to start building your AI-ready dataset."
            action={<Button onClick={() => setShowAdd(true)}>Add source</Button>}
          />
        ) : (
          <SourcesTable sources={sources} files={files} onManage={setSelectedId} />
        )}
      </Card>

      <AddSourceModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={async (created) => {
          setShowAdd(false);
          await reload();
          setSelectedId(created.id);
        }}
      />

      <SourceDetailPanel
        source={selected}
        files={selected ? (files[selected.id] ?? []) : []}
        logs={selected ? (logs[selected.id] ?? []) : []}
        onClose={() => setSelectedId(null)}
        onChanged={reload}
      />
    </AppShell>
  );
}