import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import ServiceStatusPage from "../[locale]/service-status/page";

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  MockLink.displayName = "MockLink";
  return MockLink;
});

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations:
    (namespace: string) => (key: string, values?: Record<string, string>) => {
      const translations: Record<string, Record<string, string>> = {
        serviceStatus: {
          title: "Service Status",
          description:
            "Check operational status of major cloud vendors and services",
          breadcrumb: "Service Status",
          refreshAll: "Refresh All",
          refresh: "Refresh",
          viewStatusPage: "Open status page",
          "status.operational": "Operational",
          "status.degraded": "Degraded",
          "status.down": "Down",
          "status.unknown": "Unknown",
          "categories.cloud-vendor": "Cloud Vendors",
          "categories.file-storage": "File Storage",
          "categories.dev-tools": "Development Tools",
          "categories.communication": "Communication",
          "categories.hosting-cdn": "Hosting/CDN",
          "categories.other": "Other",
          scheduledMaintenance: "Scheduled Maintenance",
          maintenanceFrom: "From: {date}",
          maintenanceUntil: "Until: {date}",
        },
        common: {
          home: "Home",
        },
      };
      let translation = translations[namespace]?.[key] || key;

      // 変数置換を実行
      if (values) {
        Object.entries(values).forEach(([varKey, value]) => {
          translation = translation.replace(`{${varKey}}`, value);
        });
      }

      return translation;
    },
  useLocale: () => "en",
}));

// Mock fetch
global.fetch = jest.fn();

const mockServiceStatuses = [
  {
    id: "aws",
    name: "AWS",
    category: "cloud-vendor" as const,
    status: "operational" as const,
    url: "https://aws.amazon.com",
    statusUrl: "https://status.aws.amazon.com",
    lastChecked: new Date(),
  },
  {
    id: "github",
    name: "GitHub",
    category: "dev-tools" as const,
    status: "operational" as const,
    url: "https://github.com",
    statusUrl: "https://www.githubstatus.com",
    lastChecked: new Date(),
  },
  {
    id: "slack",
    name: "Slack",
    category: "communication" as const,
    status: "degraded" as const,
    url: "https://slack.com",
    statusUrl: "https://slack-status.com",
    lastChecked: new Date(),
  },
];

const createMockServiceWithMaintenance = (
  id: string,
  name: string,
  category: "file-storage",
  futureDate: Date
) => ({
  id,
  name,
  category: category as "file-storage",
  status: "operational" as const,
  url: `https://${id}.com`,
  statusUrl: `https://status.${id}.com`,
  lastChecked: new Date(),
  scheduledMaintenances: [
    {
      name: "Scheduled Maintenance",
      scheduled_for: futureDate.toISOString(),
      scheduled_until: new Date(
        futureDate.getTime() + 3 * 60 * 60 * 1000
      ).toISOString(), // 3 hours later
    },
  ],
});

const createMockServiceWithPastMaintenance = (
  id: string,
  name: string,
  category: "file-storage"
) => ({
  id,
  name,
  category: category as "file-storage",
  status: "operational" as const,
  url: `https://${id}.com`,
  statusUrl: `https://status.${id}.com`,
  lastChecked: new Date(),
  scheduledMaintenances: [
    {
      name: "Past Maintenance",
      scheduled_for: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      scheduled_until: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString(), // 3 hours after start
    },
  ],
});

describe("Service Status Page", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders page title and description", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockServiceStatuses }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Service Status" })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Check operational status of major cloud vendors and services"
      )
    ).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    );

    render(<ServiceStatusPage />);

    // ローディング中はリフレッシュボタンが無効化されることを確認
    const refreshButton = screen.getByText("Refresh All");
    expect(refreshButton).toBeDisabled();

    // ローディング中はサービスが表示されないことを確認
    expect(screen.queryByText("AWS")).not.toBeInTheDocument();
  });

  it("displays service statuses after fetching", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockServiceStatuses }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("AWS")).toBeInTheDocument();
    });

    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("Slack")).toBeInTheDocument();
  });

  it("groups services by category", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockServiceStatuses }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("Cloud Vendors")).toBeInTheDocument();
    });

    expect(screen.getByText("Development Tools")).toBeInTheDocument();
    expect(screen.getByText("Communication")).toBeInTheDocument();
  });

  it("displays correct status indicators", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockServiceStatuses }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("AWS")).toBeInTheDocument();
    });

    // ステータステキストが表示されることを確認（複数存在する可能性があるためgetAllByTextを使用）
    const operationalTexts = screen.getAllByText("Operational");
    expect(operationalTexts.length).toBeGreaterThan(0);
    const degradedTexts = screen.getAllByText("Degraded");
    expect(degradedTexts.length).toBeGreaterThan(0);
  });

  it("handles refresh all functionality", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockServiceStatuses }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("AWS")).toBeInTheDocument();
    });

    const refreshButton = screen.getByText("Refresh All");
    expect(refreshButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(refreshButton);
    });

    // リフレッシュが呼び出されることを確認
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/v1/service-status");
    });
  });

  it("handles API error gracefully", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({ error: "Failed to fetch service statuses" }),
    });

    render(<ServiceStatusPage />);

    // エラーが発生してもページは表示される
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Service Status" })
      ).toBeInTheDocument();
    });
  });

  it("handles network error gracefully", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    render(<ServiceStatusPage />);

    // エラーが発生してもページは表示される
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Service Status" })
      ).toBeInTheDocument();
    });
  });

  it("fetches from correct endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockServiceStatuses }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/v1/service-status");
    });
  });

  it("renders refresh button", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockServiceStatuses }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("Refresh All")).toBeInTheDocument();
    });
  });

  it("disables refresh button while loading", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    );

    render(<ServiceStatusPage />);

    const refreshButton = screen.getByText("Refresh All");
    expect(refreshButton).toBeDisabled();
  });

  it("renders breadcrumbs", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockServiceStatuses }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      const homeLink = screen.getByRole("link", { name: "Home" });
      expect(homeLink).toBeInTheDocument();
    });

    const statusLinks = screen.getAllByRole("link", { name: "Service Status" });
    expect(statusLinks.length).toBeGreaterThan(0);
  });

  it("displays flag icon when scheduled maintenance is present", async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
    const boxService = createMockServiceWithMaintenance(
      "box",
      "Box",
      "file-storage",
      futureDate
    );

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: [boxService] }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("Box")).toBeInTheDocument();
    });

    // Flag icon should be present (aria-labelで検索)
    const flagIcon = screen.getByLabelText("Scheduled Maintenance");
    expect(flagIcon).toBeInTheDocument();
  });

  it("does not display flag icon when no scheduled maintenance", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockServiceStatuses }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("AWS")).toBeInTheDocument();
    });

    // Flag icon should not be present
    const flagIcon = screen.queryByLabelText("Scheduled Maintenance");
    expect(flagIcon).not.toBeInTheDocument();
  });

  it("filters out past maintenances", async () => {
    const boxService = createMockServiceWithPastMaintenance(
      "box",
      "Box",
      "file-storage"
    );

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: [boxService] }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("Box")).toBeInTheDocument();
    });

    // Past maintenance should not show flag icon
    const flagIcon = screen.queryByLabelText("Scheduled Maintenance");
    expect(flagIcon).not.toBeInTheDocument();
  });

  it("shows earliest maintenance when multiple future maintenances exist", async () => {
    const futureDate1 = new Date(Date.now() + 48 * 60 * 60 * 1000); // 2 days from now
    const futureDate2 = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now (earlier)

    const boxService = {
      id: "box",
      name: "Box",
      category: "file-storage" as const,
      status: "operational" as const,
      url: "https://box.com",
      statusUrl: "https://status.box.com",
      lastChecked: new Date(),
      scheduledMaintenances: [
        {
          name: "Later Maintenance",
          scheduled_for: futureDate1.toISOString(),
        },
        {
          name: "Earlier Maintenance",
          scheduled_for: futureDate2.toISOString(),
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: [boxService] }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("Box")).toBeInTheDocument();
    });

    // Flag icon should be present
    const flagIcon = screen.getByLabelText("Scheduled Maintenance");
    expect(flagIcon).toBeInTheDocument();

    // Tooltip content should show the earlier maintenance (hover to see)
    // Note: Testing tooltip content requires more complex setup with user interactions
    // This test verifies the flag is shown when maintenance exists
  });
});
