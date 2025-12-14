import { promisify } from "util";
import { parseString } from "xml2js";

const parseXML = promisify(parseString);

const REQUEST_TIMEOUT = 5000; // 5 seconds

export type ServiceStatus = "operational" | "degraded" | "down" | "unknown";

export type ServiceCategory =
  | "cloud-vendor"
  | "file-storage"
  | "dev-tools"
  | "communication"
  | "hosting-cdn"
  | "other";

export interface ServiceStatusInfo {
  id: string;
  name: string;
  category: ServiceCategory;
  status: ServiceStatus;
  url: string;
  statusUrl: string;
  lastChecked?: Date;
}

interface ServiceConfig {
  id: string;
  name: string;
  category: ServiceCategory;
  url: string;
  statusUrl: string;
  fetchFn: () => Promise<ServiceStatus>;
}

// タイムアウト付きfetch
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
}

// AWS RSSフィード解析
async function fetchAWSStatus(): Promise<ServiceStatus> {
  try {
    const response = await fetchWithTimeout(
      "https://status.aws.amazon.com/rss/all.rss"
    );
    if (!response.ok) {
      return "unknown";
    }
    const xmlText = await response.text();
    const result = await parseXML(xmlText);

    // RSSフィードのitem要素を確認
    const items = result?.rss?.channel?.[0]?.item || [];

    // itemが存在する場合は、最新のものを確認
    // AWS RSSフィードは問題がある場合のみitemが追加される
    if (items.length === 0) {
      return "operational";
    }

    // 最新のitemを確認（通常は最初の要素が最新）
    const latestItem = items[0];
    const title = latestItem?.title?.[0]?.toLowerCase() || "";
    const description = latestItem?.description?.[0]?.toLowerCase() || "";
    const pubDate = latestItem?.pubDate?.[0] || "";

    // 24時間以内のアイテムのみを考慮（古い問題は無視）
    if (pubDate) {
      const pubDateObj = new Date(pubDate);
      const now = new Date();
      const hoursDiff =
        (now.getTime() - pubDateObj.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        // 24時間以上前の更新は無視（問題が解決した可能性）
        return "operational";
      }
    }

    // 重大な問題のキーワードをチェック
    if (
      title.includes("service disruption") ||
      title.includes("service interruption") ||
      title.includes("service unavailable") ||
      description.includes("service disruption") ||
      description.includes("service interruption") ||
      description.includes("service unavailable")
    ) {
      return "down";
    }

    // パフォーマンス低下や部分的な問題
    if (
      title.includes("performance") ||
      title.includes("degraded") ||
      title.includes("increased error") ||
      description.includes("performance") ||
      description.includes("degraded") ||
      description.includes("increased error")
    ) {
      return "degraded";
    }

    // その他の問題がある場合
    return "degraded";
  } catch (error) {
    console.error("AWS status fetch error:", error);
    return "unknown";
  }
}

// Azure RSSフィード解析
async function fetchAzureStatus(): Promise<ServiceStatus> {
  try {
    const response = await fetchWithTimeout(
      "https://status.azure.com/en-us/status/feed/"
    );
    if (!response.ok) {
      return "unknown";
    }
    const xmlText = await response.text();
    const result = await parseXML(xmlText);

    const items = result?.rss?.channel?.[0]?.item || [];

    if (items.length === 0) {
      return "operational";
    }

    const latestItem = items[0];
    const title = latestItem?.title?.[0]?.toLowerCase() || "";
    const description = latestItem?.description?.[0]?.toLowerCase() || "";
    const pubDate = latestItem?.pubDate?.[0] || "";

    // 24時間以内のアイテムのみを考慮
    if (pubDate) {
      const pubDateObj = new Date(pubDate);
      const now = new Date();
      const hoursDiff =
        (now.getTime() - pubDateObj.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        return "operational";
      }
    }

    if (
      title.includes("service disruption") ||
      title.includes("service interruption") ||
      title.includes("service unavailable") ||
      description.includes("service disruption") ||
      description.includes("service interruption") ||
      description.includes("service unavailable")
    ) {
      return "down";
    }

    if (
      title.includes("performance") ||
      title.includes("degraded") ||
      title.includes("increased error") ||
      description.includes("performance") ||
      description.includes("degraded") ||
      description.includes("increased error")
    ) {
      return "degraded";
    }

    return "degraded";
  } catch (error) {
    console.error("Azure status fetch error:", error);
    return "unknown";
  }
}

// GCP JSON API
async function fetchGCPStatus(): Promise<ServiceStatus> {
  try {
    const response = await fetchWithTimeout(
      "https://status.cloud.google.com/incidents.json"
    );
    if (!response.ok) {
      return "unknown";
    }
    const data = await response.json();

    // アクティブなインシデントを確認
    interface GCPIncident {
      status?: string;
      severity?: string;
    }
    const activeIncidents = ((data.incidents || []) as GCPIncident[]).filter(
      (incident) => incident.status !== "resolved"
    );

    if (activeIncidents.length === 0) {
      return "operational";
    }

    // 重大なインシデントがあるか確認
    const criticalIncidents = activeIncidents.filter(
      (incident) =>
        incident.severity === "critical" || incident.severity === "high"
    );

    if (criticalIncidents.length > 0) {
      return "down";
    }

    return "degraded";
  } catch (error) {
    console.error("GCP status fetch error:", error);
    return "unknown";
  }
}

// GitHub Status API
async function fetchGitHubStatus(): Promise<ServiceStatus> {
  try {
    const response = await fetchWithTimeout(
      "https://www.githubstatus.com/api/v2/status.json"
    );
    if (!response.ok) {
      return "unknown";
    }
    const data = await response.json();
    const indicator = data.status?.indicator || "none";

    switch (indicator) {
      case "none":
      case "operational":
        return "operational";
      case "minor":
        return "degraded";
      case "major":
      case "critical":
        return "down";
      default:
        return "unknown";
    }
  } catch (error) {
    console.error("GitHub status fetch error:", error);
    return "unknown";
  }
}

// Slack Status API
async function fetchSlackStatus(): Promise<ServiceStatus> {
  try {
    const response = await fetchWithTimeout(
      "https://slack-status.com/api/v2.0.0/current"
    );
    if (!response.ok) {
      return "unknown";
    }
    const data = await response.json();

    if (
      data.status === "ok" &&
      (!data.active_incidents || data.active_incidents.length === 0)
    ) {
      return "operational";
    }

    // アクティブなインシデントがある場合
    interface SlackIncident {
      impact?: string;
    }
    const activeIncidents = (data.active_incidents || []) as SlackIncident[];
    if (activeIncidents.length > 0) {
      // 重大なインシデントか確認
      const criticalIncidents = activeIncidents.filter(
        (incident) =>
          incident.impact === "critical" || incident.impact === "major"
      );
      if (criticalIncidents.length > 0) {
        return "down";
      }
      return "degraded";
    }

    return "unknown";
  } catch (error) {
    console.error("Slack status fetch error:", error);
    return "unknown";
  }
}

// Stripe RSSフィード解析（Atom形式）
async function fetchStripeStatus(): Promise<ServiceStatus> {
  try {
    const response = await fetchWithTimeout(
      "https://status.stripe.com/current/atom.xml"
    );
    if (!response.ok) {
      return "unknown";
    }
    const xmlText = await response.text();

    // 空のレスポンスの場合は正常と判断
    if (!xmlText || xmlText.trim().length === 0) {
      return "operational";
    }

    const result = await parseXML(xmlText);

    // Atomフィードの構造: feed.entry (RSSとは異なる)
    const entries = result?.feed?.entry || [];

    // エントリがなければ正常と判断
    if (entries.length === 0) {
      return "operational";
    }

    // 最新のエントリを取得（通常は最初の要素が最新）
    const latestEntry = Array.isArray(entries) ? entries[0] : entries;

    // Atomフィードのタイトル取得（構造が異なる可能性がある）
    const titleElement = latestEntry?.title?.[0];
    const title =
      typeof titleElement === "string"
        ? titleElement.toLowerCase()
        : titleElement?._?.toLowerCase() || titleElement?.toLowerCase() || "";

    // Atomフィードのsummary/content取得
    const summaryElement =
      latestEntry?.summary?.[0] || latestEntry?.content?.[0];
    const summary =
      typeof summaryElement === "string"
        ? summaryElement.toLowerCase()
        : summaryElement?._?.toLowerCase() ||
          summaryElement?.toLowerCase() ||
          "";

    const updated =
      latestEntry?.updated?.[0] || latestEntry?.published?.[0] || "";

    // 24時間以内のエントリのみを考慮
    if (updated) {
      try {
        const updatedDate = new Date(updated);
        const now = new Date();
        const hoursDiff =
          (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60);
        if (hoursDiff > 24) {
          return "operational";
        }
      } catch {
        // 日付解析エラーは無視
      }
    }

    // 重大な問題のキーワードをチェック
    if (
      title.includes("service disruption") ||
      title.includes("service interruption") ||
      title.includes("service unavailable") ||
      title.includes("outage") ||
      title.includes("down") ||
      summary.includes("service disruption") ||
      summary.includes("service interruption") ||
      summary.includes("service unavailable") ||
      summary.includes("outage") ||
      summary.includes("down")
    ) {
      return "down";
    }

    // パフォーマンス低下や部分的な問題
    if (
      title.includes("performance") ||
      title.includes("degraded") ||
      title.includes("increased error") ||
      title.includes("intermittent") ||
      summary.includes("performance") ||
      summary.includes("degraded") ||
      summary.includes("increased error") ||
      summary.includes("intermittent")
    ) {
      return "degraded";
    }

    // その他の問題がある場合
    return "degraded";
  } catch (error) {
    console.error("Stripe status fetch error:", error);
    return "unknown";
  }
}

// Statuspage.ioベースのサービス（Box, Dropbox, Vercel, Netlify, Cloudflare）
async function fetchStatuspageStatus(url: string): Promise<ServiceStatus> {
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      return "unknown";
    }

    // Content-TypeをチェックしてJSONでない場合はスキップ
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(
        `Statuspage status fetch error: Invalid content-type: ${contentType} for ${url}`
      );
      return "unknown";
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error(
        `Statuspage status fetch error: Failed to parse JSON from ${url}`,
        parseError
      );
      return "unknown";
    }

    // アクティブなインシデントを確認
    interface StatuspageIncident {
      status?: string;
      impact?: string;
    }
    const incidents = (data.incidents || []) as StatuspageIncident[];
    const activeIncidents = incidents.filter(
      (incident) => incident.status !== "resolved"
    );

    // アクティブなインシデントがない場合は、indicatorに関係なく正常として扱う
    // （一部のサービスでは、過去のインシデントが`minor`として残ることがあるため）
    if (activeIncidents.length === 0) {
      // ただし、indicatorがmajor/criticalの場合は念のため確認
      const indicator = data.status?.indicator || "none";
      if (indicator === "major" || indicator === "critical") {
        return "down";
      }
      return "operational";
    }

    // アクティブなインシデントがある場合は、影響度で判定
    const indicator = data.status?.indicator || "none";

    // 重大なインシデントがあるか確認
    const criticalIncidents = activeIncidents.filter(
      (incident) =>
        incident.impact === "critical" ||
        incident.impact === "major" ||
        indicator === "critical" ||
        indicator === "major"
    );

    if (
      criticalIncidents.length > 0 ||
      indicator === "critical" ||
      indicator === "major"
    ) {
      return "down";
    }

    // 軽微なインシデント
    if (indicator === "minor" || activeIncidents.length > 0) {
      return "degraded";
    }

    return "operational";
  } catch (error) {
    console.error("Statuspage status fetch error:", error);
    return "unknown";
  }
}

// サービス設定
const SERVICE_CONFIGS: ServiceConfig[] = [
  {
    id: "aws",
    name: "AWS",
    category: "cloud-vendor",
    url: "https://aws.amazon.com",
    statusUrl: "https://status.aws.amazon.com",
    fetchFn: fetchAWSStatus,
  },
  {
    id: "azure",
    name: "Azure",
    category: "cloud-vendor",
    url: "https://azure.microsoft.com",
    statusUrl: "https://status.azure.com",
    fetchFn: fetchAzureStatus,
  },
  {
    id: "gcp",
    name: "Google Cloud Platform",
    category: "cloud-vendor",
    url: "https://cloud.google.com",
    statusUrl: "https://status.cloud.google.com",
    fetchFn: fetchGCPStatus,
  },
  {
    id: "box",
    name: "Box",
    category: "file-storage",
    url: "https://www.box.com",
    statusUrl: "https://status.box.com",
    fetchFn: () =>
      fetchStatuspageStatus("https://status.box.com/api/v2/summary.json"),
  },
  {
    id: "dropbox",
    name: "Dropbox",
    category: "file-storage",
    url: "https://www.dropbox.com",
    statusUrl: "https://status.dropbox.com",
    fetchFn: () =>
      fetchStatuspageStatus("https://status.dropbox.com/api/v2/summary.json"),
  },
  {
    id: "github",
    name: "GitHub",
    category: "dev-tools",
    url: "https://github.com",
    statusUrl: "https://www.githubstatus.com",
    fetchFn: fetchGitHubStatus,
  },
  {
    id: "slack",
    name: "Slack",
    category: "communication",
    url: "https://slack.com",
    statusUrl: "https://slack-status.com",
    fetchFn: fetchSlackStatus,
  },
  {
    id: "vercel",
    name: "Vercel",
    category: "hosting-cdn",
    url: "https://vercel.com",
    statusUrl: "https://www.vercel-status.com",
    fetchFn: () =>
      fetchStatuspageStatus(
        "https://www.vercel-status.com/api/v2/summary.json"
      ),
  },
  {
    id: "netlify",
    name: "Netlify",
    category: "hosting-cdn",
    url: "https://www.netlify.com",
    statusUrl: "https://www.netlifystatus.com",
    fetchFn: () =>
      fetchStatuspageStatus(
        "https://www.netlifystatus.com/api/v2/summary.json"
      ),
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    category: "hosting-cdn",
    url: "https://www.cloudflare.com",
    statusUrl: "https://www.cloudflarestatus.com",
    fetchFn: () =>
      fetchStatuspageStatus(
        "https://www.cloudflarestatus.com/api/v2/summary.json"
      ),
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "other",
    url: "https://stripe.com",
    statusUrl: "https://status.stripe.com",
    fetchFn: fetchStripeStatus,
  },
];

// 全サービスのステータスを取得
export async function fetchAllServiceStatuses(): Promise<ServiceStatusInfo[]> {
  const promises = SERVICE_CONFIGS.map(async (config) => {
    try {
      const status = await config.fetchFn();
      return {
        id: config.id,
        name: config.name,
        category: config.category,
        status,
        url: config.url,
        statusUrl: config.statusUrl,
        lastChecked: new Date(),
      };
    } catch (error) {
      console.error(`Error fetching status for ${config.id}:`, error);
      return {
        id: config.id,
        name: config.name,
        category: config.category,
        status: "unknown" as ServiceStatus,
        url: config.url,
        statusUrl: config.statusUrl,
        lastChecked: new Date(),
      };
    }
  });

  return Promise.all(promises);
}

// 特定のサービスのステータスを取得
export async function fetchServiceStatus(
  serviceId: string
): Promise<ServiceStatusInfo | null> {
  const config = SERVICE_CONFIGS.find((c) => c.id === serviceId);
  if (!config) {
    return null;
  }

  try {
    const status = await config.fetchFn();
    return {
      id: config.id,
      name: config.name,
      category: config.category,
      status,
      url: config.url,
      statusUrl: config.statusUrl,
      lastChecked: new Date(),
    };
  } catch (error) {
    console.error(`Error fetching status for ${serviceId}:`, error);
    return {
      id: config.id,
      name: config.name,
      category: config.category,
      status: "unknown" as ServiceStatus,
      url: config.url,
      statusUrl: config.statusUrl,
      lastChecked: new Date(),
    };
  }
}

// サービスIDのリストを取得
export function getServiceIds(): string[] {
  return SERVICE_CONFIGS.map((config) => config.id);
}
