import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
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
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      serviceStatus: {
        title: "Service Status",
        description: "Check operational status of major cloud vendors and services",
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
      },
      common: {
        home: "Home",
      },
    };
    return translations[namespace]?.[key] || key;
  },
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
      json: () => Promise.resolve({ error: "Failed to fetch service statuses" }),
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
    (global.fetch as jest.Mock).mockRejectedValue(
      new Error("Network error")
    );

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
});
