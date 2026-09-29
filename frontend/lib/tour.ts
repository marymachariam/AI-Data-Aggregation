export interface TourStep {
  id: string;
  route: string;
  selector: string;
  title: string;
  body: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "overview",
    route: "/dashboard",
    selector: '[data-tour="nav-overview"]',
    title: "Overview",
    body: "See your connected sources, sync status, and any failures here at a glance.",
  },
  {
    id: "sources-nav",
    route: "/dashboard",
    selector: '[data-tour="nav-sources"]',
    title: "Data sources",
    body: "This is where you connect the tools your company uses.",
  },
  {
    id: "add-source",
    route: "/sources",
    selector: '[data-tour="add-source"]',
    title: "Connect a tool",
    body: "Click here to connect Google Drive, Slack, Dropbox, or upload files directly.",
  },
  {
    id: "sources-list",
    route: "/sources",
    selector: '[data-tour="sources-list"]',
    title: "Manage your sources",
    body: "Every connected tool shows up here. Click Manage to sync, upload files, or remove it.",
  },
  {
    id: "assistant",
    route: "/dashboard",
    selector: '[data-tour="assistant-button"]',
    title: "Ask the assistant",
    body: "Click this any time for help or questions about your data.",
  },
];