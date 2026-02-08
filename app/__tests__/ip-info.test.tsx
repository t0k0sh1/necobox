import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import IPInfoPage from "../[locale]/ip-info/page";

// Mock fetch
global.fetch = jest.fn();

// MapViewをモック（leaflet依存を回避）
jest.mock("@/app/components/MapView", () => ({
  MapView: () => <div data-testid="map-view">Map</div>,
}));

// Radix UIのTabsはjsdomでタブ切り替えが動作しないため、
// 全タブコンテンツを常に表示するモックに置き換え
jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement("div", { "data-testid": "tabs", ...props }, children),
  TabsList: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement("div", { role: "tablist", ...props }, children),
  TabsTrigger: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement("button", { role: "tab", ...props }, children),
  TabsContent: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement("div", { role: "tabpanel", ...props }, children),
}));

/**
 * ヘルパー: 検索を実行し、結果が表示されるまで待つ
 */
async function searchAndWaitForResults(searchValue: string) {
  const input = screen.getByPlaceholderText(/Enter IP address or hostname/);
  fireEvent.change(input, { target: { value: searchValue } });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));

  await waitFor(() => {
    expect(screen.getByTestId("tabs")).toBeInTheDocument();
  });
}

describe("IP Info Page", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it("ページタイトルが表示される", () => {
    render(<IPInfoPage />);
    expect(
      screen.getByRole("heading", { name: "IP/Hostname Info" })
    ).toBeInTheDocument();
  });

  it("IP検索後にdb-ip.comリンクが正しいhref・target・relで表示される", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          input: "8.8.8.8",
          ip: "8.8.8.8",
          basicInfo: { ip: "8.8.8.8", hostname: "dns.google" },
          geoip: { country: "US", city: "Mountain View" },
        }),
    });

    render(<IPInfoPage />);
    await searchAndWaitForResults("8.8.8.8");

    const link = screen.getByText("View details on db-ip.com");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute(
      "href",
      "https://db-ip.com/8.8.8.8"
    );
    expect(link.closest("a")).toHaveAttribute("target", "_blank");
    expect(link.closest("a")).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("basicInfo.ipのみの場合もdb-ip.comリンクが生成される", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          input: "1.1.1.1",
          basicInfo: { ip: "1.1.1.1" },
          geoip: { country: "AU" },
        }),
    });

    render(<IPInfoPage />);
    await searchAndWaitForResults("1.1.1.1");

    const link = screen.getByText("View details on db-ip.com");
    expect(link.closest("a")).toHaveAttribute(
      "href",
      "https://db-ip.com/1.1.1.1"
    );
  });

  it("IPがない場合はdb-ip.comリンクが表示されない", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          input: "example.com",
          basicInfo: {},
          geoip: { country: "US" },
        }),
    });

    render(<IPInfoPage />);
    await searchAndWaitForResults("example.com");

    expect(
      screen.queryByText("View details on db-ip.com")
    ).not.toBeInTheDocument();
  });

  it("IPv6アドレスがURLエンコードされる", async () => {
    const ipv6 = "2001:4860:4860::8888";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          input: ipv6,
          ip: ipv6,
          basicInfo: { ip: ipv6 },
          geoip: { country: "US" },
        }),
    });

    render(<IPInfoPage />);
    await searchAndWaitForResults(ipv6);

    const link = screen.getByText("View details on db-ip.com");
    expect(link.closest("a")).toHaveAttribute(
      "href",
      `https://db-ip.com/${encodeURIComponent(ipv6)}`
    );
  });
});
