export interface CredentialField {
  key: string;
  label: string;
  type: "text" | "password" | "number";
  placeholder?: string;
  hint?: string;
  required?: boolean;
}

export interface SourceTypeDef {
  value: string;
  label: string;
  description: string;
  syncable: boolean;
  fields: CredentialField[];
}

export const SOURCE_TYPES: SourceTypeDef[] = [
  {
    value: "google_drive",
    label: "Google Drive",
    description: "Authorisation happens through Google's consent screen the first time a sync runs.",
    syncable: true,
    fields: [],
  },
  {
    value: "dropbox",
    label: "Dropbox",
    description: "Files and documents from a Dropbox account.",
    syncable: true,
    fields: [{ key: "access_token", label: "Access token", type: "password", required: true }],
  },
  {
    value: "slack",
    label: "Slack",
    description: "Message history from channels the bot has been invited to.",
    syncable: true,
    fields: [
      { key: "bot_token", label: "Bot token", type: "password", placeholder: "xoxb-…", required: true },
    ],
  },
  {
    value: "notion",
    label: "Notion",
    description: "Pages shared with your Notion integration.",
    syncable: true,
    fields: [{ key: "token", label: "Integration token", type: "password", required: true }],
  },
  {
    value: "sharepoint",
    label: "SharePoint / OneDrive",
    description: "Documents in a Microsoft 365 document library.",
    syncable: true,
    fields: [
      { key: "tenant_id", label: "Tenant ID", type: "text", required: true },
      { key: "client_id", label: "Client ID", type: "text", required: true },
      { key: "client_secret", label: "Client secret", type: "password", required: true },
      { key: "drive_id", label: "Drive ID", type: "text", required: true },
    ],
  },
  {
    value: "airtable",
    label: "Airtable",
    description: "Every table in an Airtable base.",
    syncable: true,
    fields: [
      { key: "token", label: "Personal access token", type: "password", required: true },
      { key: "base_id", label: "Base ID", type: "text", placeholder: "app…", required: true },
    ],
  },
  {
    value: "sql",
    label: "SQL database",
    description: "Read-only access to a Postgres or MySQL database.",
    syncable: true,
    fields: [
      {
        key: "database_url",
        label: "Connection URL",
        type: "password",
        placeholder: "postgresql://user:password@host:5432/db",
        hint: "Use a read-only database user.",
        required: true,
      },
    ],
  },
  {
    value: "zendesk",
    label: "Zendesk",
    description: "Support tickets and their conversation threads.",
    syncable: true,
    fields: [
      { key: "subdomain", label: "Subdomain", type: "text", placeholder: "yourcompany", required: true },
      { key: "email", label: "Agent email", type: "text", required: true },
      { key: "api_token", label: "API token", type: "password", required: true },
    ],
  },
  {
    value: "email",
    label: "Email (IMAP)",
    description: "Messages from any IMAP mailbox, including Gmail and Outlook.",
    syncable: true,
    fields: [
      { key: "host", label: "IMAP host", type: "text", placeholder: "imap.gmail.com", required: true },
      { key: "port", label: "Port", type: "number", placeholder: "993" },
      { key: "address", label: "Email address", type: "text", required: true },
      { key: "password", label: "App password", type: "password", required: true },
      { key: "folder", label: "Folder", type: "text", placeholder: "INBOX" },
    ],
  },
  {
    value: "website_crawler",
    label: "Website crawler",
    description: "Public pages on a website, crawled within one domain.",
    syncable: true,
    fields: [
      { key: "start_url", label: "Start URL", type: "text", placeholder: "https://example.com", required: true },
      { key: "max_pages", label: "Maximum pages", type: "number", placeholder: "50" },
    ],
  },
  {
    value: "local_upload",
    label: "Manual upload",
    description: "Upload PDF, Word, CSV, or text files directly.",
    syncable: false,
    fields: [],
  },
];

export function getSourceType(value: string): SourceTypeDef | undefined {
  return SOURCE_TYPES.find((t) => t.value === value);
}

export function sourceTypeLabel(value: string): string {
  return getSourceType(value)?.label ?? value;
}