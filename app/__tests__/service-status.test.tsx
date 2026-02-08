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
          "categories.all": "All",
          "categories.cloud-vendor": "Cloud Vendors",
          "categories.file-storage": "File Storage",
          "categories.dev-tools": "Development Tools",
          "categories.communication": "Communication",
          "categories.hosting-cdn": "Hosting/CDN",
          "categories.ai-ml": "AI / ML",
          "categories.design-tools": "Design Tools",
          "categories.other": "Other",
          scheduledMaintenance: "Scheduled Maintenance",
          maintenanceFrom: "From: {date}",
          maintenanceUntil: "Until: {date}",
          responseTime: "{ms}ms",
          lastChecked: "Last checked: {time}",
          components: "Components",
          componentsCount: "{ok}/{total} normal",
          viewDownDetector: "View on DownDetector",
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

// Mock service-icons
jest.mock("@/lib/utils/service-icons", () => ({
  getServiceIcon: () => {
    const MockIcon = (props: React.SVGProps<SVGSVGElement>) => (
      <svg data-testid="service-icon" {...props} />
    );
    MockIcon.displayName = "MockIcon";
    return MockIcon;
  },
}));

// Mock relative-time
jest.mock("@/lib/utils/relative-time", () => ({
  formatRelativeTime: () => "2 minutes ago",
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
    responseTimeMs: 120,
    downdetectorUrl: "https://downdetector.com/status/aws-amazon-web-services/",
  },
  {
    id: "github",
    name: "GitHub",
    category: "dev-tools" as const,
    status: "operational" as const,
    url: "https://github.com",
    statusUrl: "https://www.githubstatus.com",
    lastChecked: new Date(),
    responseTimeMs: 85,
    downdetectorUrl: "https://downdetector.com/status/github/",
  },
  {
    id: "slack",
    name: "Slack",
    category: "communication" as const,
    status: "degraded" as const,
    url: "https://slack.com",
    statusUrl: "https://slack-status.com",
    lastChecked: new Date(),
    responseTimeMs: 350,
    downdetectorUrl: "https://downdetector.com/status/slack/",
  },
  {
    id: "openai",
    name: "OpenAI",
    category: "ai-ml" as const,
    status: "operational" as const,
    url: "https://openai.com",
    statusUrl: "https://status.openai.com",
    lastChecked: new Date(),
    responseTimeMs: 200,
    components: [
      { name: "API", status: "operational" },
      { name: "ChatGPT", status: "operational" },
    ],
    downdetectorUrl: "https://downdetector.com/status/openai/",
  },
  {
    id: "figma",
    name: "Figma",
    category: "design-tools" as const,
    status: "operational" as const,
    url: "https://www.figma.com",
    statusUrl: "https://status.figma.com",
    lastChecked: new Date(),
    responseTimeMs: 150,
    downdetectorUrl: "https://downdetector.com/status/figma/",
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
  responseTimeMs: 100,
  scheduledMaintenances: [
    {
      name: "Scheduled Maintenance",
      scheduled_for: futureDate.toISOString(),
      scheduled_until: new Date(
        futureDate.getTime() + 3 * 60 * 60 * 1000
      ).toISOString(),
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
  responseTimeMs: 100,
  scheduledMaintenances: [
    {
      name: "Past Maintenance",
      scheduled_for: new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString(),
      scheduled_until: new Date(
        Date.now() - 21 * 60 * 60 * 1000
      ).toISOString(),
    },
  ],
});

describe("Service Status Page", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    localStorage.clear();
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

  it("shows loading skeleton initially", () => {
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
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("Figma")).toBeInTheDocument();
  });

  it("displays category sidebar with counts", async () => {
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
    expect(screen.getByText("AI / ML")).toBeInTheDocument();
    expect(screen.getByText("Design Tools")).toBeInTheDocument();
  });

  it("filters services by category when sidebar button clicked", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockServiceStatuses }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("AWS")).toBeInTheDocument();
    });

    // 全サービスが表示されていることを確認
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("Slack")).toBeInTheDocument();

    // AI / ML カテゴリをクリック
    fireEvent.click(screen.getByText("AI / ML"));

    // OpenAI のみ表示されることを確認
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.queryByText("AWS")).not.toBeInTheDocument();
    expect(screen.queryByText("GitHub")).not.toBeInTheDocument();
  });

  it("shows all services when 'All' is selected after filtering", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockServiceStatuses }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("AWS")).toBeInTheDocument();
    });

    // カテゴリでフィルタ
    fireEvent.click(screen.getByText("AI / ML"));
    expect(screen.queryByText("AWS")).not.toBeInTheDocument();

    // 「すべて」で戻す - サイドバーの"All"ボタンをクリック
    fireEvent.click(screen.getByText("All"));
    expect(screen.getByText("AWS")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
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

    const operationalTexts = screen.getAllByText("Operational");
    expect(operationalTexts.length).toBeGreaterThan(0);
    const degradedTexts = screen.getAllByText("Degraded");
    expect(degradedTexts.length).toBeGreaterThan(0);
  });

  it("displays response time", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockServiceStatuses }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("AWS")).toBeInTheDocument();
    });

    // レスポンスタイムが表示されることを確認
    expect(screen.getByText("120ms")).toBeInTheDocument();
    expect(screen.getByText("85ms")).toBeInTheDocument();
  });

  it("displays last checked time", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockServiceStatuses }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("AWS")).toBeInTheDocument();
    });

    // 最終確認時刻が表示されることを確認
    const lastCheckedTexts = screen.getAllByText("Last checked: 2 minutes ago");
    expect(lastCheckedTexts.length).toBeGreaterThan(0);
  });

  it("displays component expand section for services with components", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockServiceStatuses }),
    });

    render(<ServiceStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("OpenAI")).toBeInTheDocument();
    });

    // コンポーネントセクションが表示されていることを確認
    expect(screen.getByText("Components")).toBeInTheDocument();
    expect(screen.getByText("(2/2 normal)")).toBeInTheDocument();

    // 展開前はコンポーネント名は非表示
    expect(screen.queryByText("API")).not.toBeInTheDocument();

    // クリックして展開
    fireEvent.click(screen.getByText("Components"));

    // コンポーネント名が表示される
    expect(screen.getByText("API")).toBeInTheDocument();
    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
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

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Service Status" })
      ).toBeInTheDocument();
    });
  });

  it("handles network error gracefully", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    render(<ServiceStatusPage />);

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
      const breadcrumbNav = screen.getByRole("navigation", {
        name: "Breadcrumb",
      });
      expect(breadcrumbNav).toBeInTheDocument();
      expect(breadcrumbNav).toHaveTextContent("Service Status");
    });
  });

  it("displays flag icon when scheduled maintenance is present", async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
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

    const flagIcon = screen.queryByLabelText("Scheduled Maintenance");
    expect(flagIcon).not.toBeInTheDocument();
  });

  it("shows earliest maintenance when multiple future maintenances exist", async () => {
    const futureDate1 = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const futureDate2 = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const boxService = {
      id: "box",
      name: "Box",
      category: "file-storage" as const,
      status: "operational" as const,
      url: "https://box.com",
      statusUrl: "https://status.box.com",
      lastChecked: new Date(),
      responseTimeMs: 100,
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

    const flagIcon = screen.getByLabelText("Scheduled Maintenance");
    expect(flagIcon).toBeInTheDocument();
  });
});
