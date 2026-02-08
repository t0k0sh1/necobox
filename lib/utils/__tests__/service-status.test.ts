import { isResolvedRssItem } from "../service-status";

// fetchWithTimeout をモックするため、global.fetch をモック化
const mockFetch = jest.fn();
global.fetch = mockFetch;

// xml2js の parseString をモック化
jest.mock("xml2js", () => ({
  parseString: jest.fn(
    (
      xml: string,
      callback: (err: Error | null, result: unknown) => void
    ) => {
      // テスト内で mockParseXML を差し替えて使う
      const parsed = (global as unknown as { __mockParsedXML: unknown })
        .__mockParsedXML;
      callback(null, parsed);
    }
  ),
}));

// fetchServiceStatus をインポート（モック適用後）
import { fetchServiceStatus } from "../service-status";

// テスト用ヘルパー: RSSフィードのXML結果をセットする
function setMockRssResult(items: Array<{ title: string; description: string; pubDate: string }>) {
  (global as unknown as { __mockParsedXML: unknown }).__mockParsedXML = {
    rss: {
      channel: [
        {
          item: items.map((item) => ({
            title: [item.title],
            description: [item.description],
            pubDate: [item.pubDate],
          })),
        },
      ],
    },
  };
}

// テスト用ヘルパー: Atomフィードの結果をセットする
function setMockAtomResult(entries: Array<{ title: string; summary: string; updated: string }>) {
  (global as unknown as { __mockParsedXML: unknown }).__mockParsedXML = {
    feed: {
      entry: entries.map((entry) => ({
        title: [entry.title],
        summary: [entry.summary],
        updated: [entry.updated],
      })),
    },
  };
}

// 現在時刻から指定時間前の日付文字列を返す
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toUTCString();
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("isResolvedRssItem", () => {
  describe("解消済みと判定されるケース", () => {
    it.each([
      { title: "[RESOLVED] Service disruption for EC2", description: "" },
      { title: "EC2 issue resolved", description: "" },
      { title: "", description: "The service is now operating normally" },
      { title: "Update: back to normal", description: "" },
      { title: "", description: "This is an informational message" },
      { title: "", description: "The service is operating as expected" },
      { title: "", description: "The issue has been resolved" },
      { title: "", description: "The issue has been fixed and verified" },
      { title: "", description: "We are no longer experiencing issues" },
    ])("title=$title, description=$description → true", ({ title, description }) => {
      expect(isResolvedRssItem(title, description)).toBe(true);
    });
  });

  describe("解消済みでないと判定されるケース", () => {
    it.each([
      { title: "Service disruption for EC2", description: "" },
      { title: "Increased error rates for Lambda", description: "" },
      { title: "Performance degradation", description: "" },
      { title: "", description: "We are investigating connectivity issues" },
      { title: "EC2 connectivity issues", description: "Investigating the issue" },
    ])("title=$title, description=$description → false", ({ title, description }) => {
      expect(isResolvedRssItem(title, description)).toBe(false);
    });
  });
});

describe("fetchServiceStatus - AWS", () => {
  it("解消済みアイテムの場合 operational を返す", async () => {
    setMockRssResult([
      {
        title: "[RESOLVED] Service disruption for EC2",
        description: "The issue has been resolved",
        pubDate: hoursAgo(2),
      },
    ]);
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "<rss></rss>",
    });

    const result = await fetchServiceStatus("aws");
    expect(result?.status).toBe("operational");
  });

  it("未解消の障害アイテムの場合 down を返す", async () => {
    setMockRssResult([
      {
        title: "Service disruption for EC2",
        description: "We are investigating the issue",
        pubDate: hoursAgo(1),
      },
    ]);
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "<rss></rss>",
    });

    const result = await fetchServiceStatus("aws");
    expect(result?.status).toBe("down");
  });

  it("24時間以上前のアイテムの場合 operational を返す", async () => {
    setMockRssResult([
      {
        title: "Service disruption for EC2",
        description: "Investigating",
        pubDate: hoursAgo(25),
      },
    ]);
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "<rss></rss>",
    });

    const result = await fetchServiceStatus("aws");
    expect(result?.status).toBe("operational");
  });

  it("RSSアイテムが空の場合 operational を返す", async () => {
    setMockRssResult([]);
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "<rss></rss>",
    });

    const result = await fetchServiceStatus("aws");
    expect(result?.status).toBe("operational");
  });

  it("キーワードに一致しない24時間以内のアイテムの場合 operational を返す", async () => {
    setMockRssResult([
      {
        title: "AWS News Update",
        description: "New feature announcement",
        pubDate: hoursAgo(1),
      },
    ]);
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "<rss></rss>",
    });

    const result = await fetchServiceStatus("aws");
    expect(result?.status).toBe("operational");
  });
});

describe("fetchServiceStatus - Azure", () => {
  it("解消済みアイテムの場合 operational を返す", async () => {
    setMockRssResult([
      {
        title: "[RESOLVED] Azure Storage - Service disruption",
        description: "The issue has been resolved and service is operating normally",
        pubDate: hoursAgo(3),
      },
    ]);
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "<rss></rss>",
    });

    const result = await fetchServiceStatus("azure");
    expect(result?.status).toBe("operational");
  });

  it("未解消の障害アイテムの場合 down を返す", async () => {
    setMockRssResult([
      {
        title: "Service disruption - Azure SQL Database",
        description: "We are investigating connectivity issues",
        pubDate: hoursAgo(1),
      },
    ]);
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "<rss></rss>",
    });

    const result = await fetchServiceStatus("azure");
    expect(result?.status).toBe("down");
  });

  it("キーワードに一致しない24時間以内のアイテムの場合 operational を返す", async () => {
    setMockRssResult([
      {
        title: "Azure Update Notification",
        description: "Planned update for region",
        pubDate: hoursAgo(2),
      },
    ]);
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "<rss></rss>",
    });

    const result = await fetchServiceStatus("azure");
    expect(result?.status).toBe("operational");
  });
});

describe("fetchServiceStatus - Stripe", () => {
  it("解消済みアイテムの場合 operational を返す", async () => {
    setMockAtomResult([
      {
        title: "[Resolved] API connectivity issues",
        summary: "The issue has been resolved",
        updated: hoursAgo(4),
      },
    ]);
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "<feed></feed>",
    });

    const result = await fetchServiceStatus("stripe");
    expect(result?.status).toBe("operational");
  });

  it("未解消の障害アイテムの場合 down を返す", async () => {
    setMockAtomResult([
      {
        title: "Service disruption - Payment processing",
        summary: "We are investigating an outage",
        updated: hoursAgo(1),
      },
    ]);
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "<feed></feed>",
    });

    const result = await fetchServiceStatus("stripe");
    expect(result?.status).toBe("down");
  });

  it("キーワードに一致しない24時間以内のアイテムの場合 operational を返す", async () => {
    setMockAtomResult([
      {
        title: "Stripe Dashboard Update",
        summary: "New features available",
        updated: hoursAgo(2),
      },
    ]);
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "<feed></feed>",
    });

    const result = await fetchServiceStatus("stripe");
    expect(result?.status).toBe("operational");
  });
});
