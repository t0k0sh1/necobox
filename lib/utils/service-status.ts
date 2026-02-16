import { promisify } from "util";
import { parseString } from "xml2js";

const parseXML = promisify(parseString) as (xml: string) => Promise<unknown>;

const REQUEST_TIMEOUT = 5000; // 5 seconds

export type ServiceStatus = "operational" | "degraded" | "down" | "unknown";

export type ServiceCategory =
  | "cloud-vendor"
  | "file-storage"
  | "dev-tools"
  | "communication"
  | "hosting-cdn"
  | "ai-ml"
  | "design-tools"
  | "other";

export interface ScheduledMaintenance {
  name: string;
  scheduled_for: string; // ISO 8601形式
  scheduled_until?: string; // ISO 8601形式、オプショナル
}

export interface ServiceComponent {
  name: string;
  status: string;
}

export interface ServiceStatusInfo {
  id: string;
  name: string;
  category: ServiceCategory;
  status: ServiceStatus;
  url: string;
  statusUrl: string;
  lastChecked?: Date;
  scheduledMaintenances?: ScheduledMaintenance[];
  responseTimeMs?: number;
  components?: ServiceComponent[];
  downdetectorUrl?: string;
  statusGatorUrl?: string;
}

interface ServiceConfig {
  id: string;
  name: string;
  category: ServiceCategory;
  url: string;
  statusUrl: string;
  downdetectorSlug?: string;
  statusGatorSlug?: string;
  fetchFn: () => Promise<ServiceStatus>;
  fetchRichFn?: () => Promise<{
    status: ServiceStatus;
    components?: ServiceComponent[];
    scheduledMaintenances?: ScheduledMaintenance[];
  }>;
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

// RSSアイテムが解消済みかどうかを判定するヘルパー関数
// タイトルまたは説明文に解消済みキーワードが含まれていれば true を返す
export function isResolvedRssItem(title: string, description: string): boolean {
  const resolvedKeywords = [
    "resolved",
    "operating normally",
    "back to normal",
    "informational message",
    "service is operating",
    "has been resolved",
    "issue has been fixed",
    "no longer experiencing",
  ];

  const lowerTitle = title.toLowerCase();
  const lowerDescription = description.toLowerCase();

  return resolvedKeywords.some(
    (keyword) =>
      lowerTitle.includes(keyword) || lowerDescription.includes(keyword)
  );
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
    const result = (await parseXML(xmlText)) as {
      rss?: {
        channel?: Array<{ item?: unknown[] }>;
      };
    };

    // RSSフィードのitem要素を確認
    const items = (result?.rss?.channel?.[0]?.item || []) as Array<{
      title?: Array<string>;
      description?: Array<string>;
      pubDate?: Array<string>;
    }>;

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

    // 解消済みアイテムは正常として扱う
    if (isResolvedRssItem(title, description)) {
      return "operational";
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

    // どのキーワードにも一致しないアイテムは障害ではない
    return "operational";
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
    const result = (await parseXML(xmlText)) as {
      rss?: {
        channel?: Array<{ item?: unknown[] }>;
      };
    };

    const items = (result?.rss?.channel?.[0]?.item || []) as Array<{
      title?: Array<string>;
      description?: Array<string>;
      pubDate?: Array<string>;
    }>;

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

    // 解消済みアイテムは正常として扱う
    if (isResolvedRssItem(title, description)) {
      return "operational";
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

    // どのキーワードにも一致しないアイテムは障害ではない
    return "operational";
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

    const result = (await parseXML(xmlText)) as {
      feed?: {
        entry?: unknown[] | unknown;
      };
    };

    // Atomフィードの構造: feed.entry (RSSとは異なる)
    const entriesRaw = result?.feed?.entry || [];
    const entries = Array.isArray(entriesRaw) ? entriesRaw : [entriesRaw];

    // エントリがなければ正常と判断
    if (entries.length === 0) {
      return "operational";
    }

    // 最新のエントリを取得（通常は最初の要素が最新）
    const latestEntry = entries[0] as {
      title?: Array<string | { _?: string }>;
      summary?: Array<string | { _?: string }>;
      content?: Array<string | { _?: string }>;
      updated?: Array<string>;
      published?: Array<string>;
    };

    // Atomフィードのタイトル取得（構造が異なる可能性がある）
    const titleElement = latestEntry?.title?.[0];
    let title = "";
    if (typeof titleElement === "string") {
      title = titleElement.toLowerCase();
    } else if (
      titleElement &&
      typeof titleElement === "object" &&
      "_" in titleElement
    ) {
      title = titleElement._?.toLowerCase() || "";
    }

    // Atomフィードのsummary/content取得
    const summaryElement =
      latestEntry?.summary?.[0] || latestEntry?.content?.[0];
    let summary = "";
    if (typeof summaryElement === "string") {
      summary = summaryElement.toLowerCase();
    } else if (
      summaryElement &&
      typeof summaryElement === "object" &&
      "_" in summaryElement
    ) {
      summary = summaryElement._?.toLowerCase() || "";
    }

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

    // 解消済みアイテムは正常として扱う
    if (isResolvedRssItem(title, summary)) {
      return "operational";
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

    // どのキーワードにも一致しないアイテムは障害ではない
    return "operational";
  } catch (error) {
    console.error("Stripe status fetch error:", error);
    return "unknown";
  }
}

// X (Twitter) ステータスチェック
// 公式ステータスページ (api.twitterstat.us) は無効化されているため、
// x.com への直接アクセスでレスポンスを確認する簡易チェック
async function fetchXStatus(): Promise<ServiceStatus> {
  try {
    // x.com は HEAD リクエストを 403 で拒否するため GET を使用
    const response = await fetchWithTimeout("https://x.com");
    if (response.ok) {
      return "operational";
    }
    if (response.status >= 500) {
      return "down";
    }
    return "degraded";
  } catch (error) {
    console.error("X status fetch error:", error);
    return "unknown";
  }
}

// Statuspage APIレスポンスからステータスを判定するヘルパー関数
function determineStatuspageStatus(data: {
  incidents?: Array<{ status?: string; impact?: string }>;
  status?: { indicator?: string };
}): ServiceStatus {
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
}

// Statuspage.ioベースのサービス（基本ステータス取得）
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

    return determineStatuspageStatus(data);
  } catch (error) {
    console.error("Statuspage status fetch error:", error);
    return "unknown";
  }
}

// Statuspage.ioベースのリッチ取得（コンポーネント情報・メンテナンス情報含む）
async function fetchStatuspageStatusRich(url: string): Promise<{
  status: ServiceStatus;
  components?: ServiceComponent[];
  scheduledMaintenances?: ScheduledMaintenance[];
}> {
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      return { status: "unknown" };
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(
        `Statuspage status fetch error: Invalid content-type: ${contentType} for ${url}`
      );
      return { status: "unknown" };
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
      return { status: "unknown" };
    }

    // ステータス判定
    const status = determineStatuspageStatus(data);

    // コンポーネント情報を抽出
    interface StatuspageComponent {
      name?: string;
      status?: string;
      group?: boolean;
      group_id?: string | null;
    }
    const rawComponents = (data.components || []) as StatuspageComponent[];
    const components: ServiceComponent[] = rawComponents
      .filter((c) => !c.group && c.name)
      .map((c) => ({
        name: c.name!,
        status: c.status || "unknown",
      }));

    // メンテナンス情報を取得
    let futureMaintenances: ScheduledMaintenance[] = [];
    try {
      interface StatuspageMaintenance {
        name?: string;
        status?: string;
        scheduled_for?: string;
        scheduled_until?: string;
      }
      const scheduledMaintenances = (data.scheduled_maintenances ||
        []) as StatuspageMaintenance[];
      const now = new Date();

      futureMaintenances = scheduledMaintenances
        .filter((maintenance) => {
          try {
            if (maintenance.status !== "scheduled") return false;
            if (!maintenance.scheduled_for) return false;
            const scheduledFor = new Date(maintenance.scheduled_for);
            if (isNaN(scheduledFor.getTime())) return false;
            return scheduledFor > now;
          } catch {
            return false;
          }
        })
        .map((maintenance) => ({
          name: maintenance.name || "Scheduled Maintenance",
          scheduled_for: maintenance.scheduled_for!,
          scheduled_until: maintenance.scheduled_until,
        }));
    } catch (maintenanceError) {
      console.error(
        "Error processing maintenance information:",
        maintenanceError
      );
    }

    return {
      status,
      components: components.length > 0 ? components : undefined,
      scheduledMaintenances:
        futureMaintenances.length > 0 ? futureMaintenances : undefined,
    };
  } catch (error) {
    console.error("Statuspage rich fetch error:", error);
    return { status: "unknown" };
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
    downdetectorSlug: "aws-amazon-web-services",
    statusGatorSlug: "aws",
    fetchFn: fetchAWSStatus,
  },
  {
    id: "azure",
    name: "Azure",
    category: "cloud-vendor",
    url: "https://azure.microsoft.com",
    statusUrl: "https://status.azure.com",
    downdetectorSlug: "windows-azure",
    statusGatorSlug: "azure",
    fetchFn: fetchAzureStatus,
  },
  {
    id: "gcp",
    name: "Google Cloud Platform",
    category: "cloud-vendor",
    url: "https://cloud.google.com",
    statusUrl: "https://status.cloud.google.com",
    downdetectorSlug: "google-cloud",
    statusGatorSlug: "google-cloud-platform",
    fetchFn: fetchGCPStatus,
  },
  {
    id: "box",
    name: "Box",
    category: "file-storage",
    url: "https://www.box.com",
    statusUrl: "https://status.box.com",
    downdetectorSlug: "box",
    statusGatorSlug: "box",
    fetchFn: () =>
      fetchStatuspageStatus("https://status.box.com/api/v2/summary.json"),
    fetchRichFn: () =>
      fetchStatuspageStatusRich("https://status.box.com/api/v2/summary.json"),
  },
  {
    id: "dropbox",
    name: "Dropbox",
    category: "file-storage",
    url: "https://www.dropbox.com",
    statusUrl: "https://status.dropbox.com",
    downdetectorSlug: "dropbox",
    statusGatorSlug: "dropbox",
    fetchFn: () =>
      fetchStatuspageStatus(
        "https://status.dropbox.com/api/v2/summary.json"
      ),
    fetchRichFn: () =>
      fetchStatuspageStatusRich(
        "https://status.dropbox.com/api/v2/summary.json"
      ),
  },
  {
    id: "github",
    name: "GitHub",
    category: "dev-tools",
    url: "https://github.com",
    statusUrl: "https://www.githubstatus.com",
    downdetectorSlug: "github",
    statusGatorSlug: "github",
    fetchFn: fetchGitHubStatus,
  },
  {
    id: "circleci",
    name: "CircleCI",
    category: "dev-tools",
    url: "https://circleci.com",
    statusUrl: "https://status.circleci.com",
    downdetectorSlug: "circleci",
    statusGatorSlug: "circleci",
    fetchFn: () =>
      fetchStatuspageStatus(
        "https://status.circleci.com/api/v2/summary.json"
      ),
    fetchRichFn: () =>
      fetchStatuspageStatusRich(
        "https://status.circleci.com/api/v2/summary.json"
      ),
  },
  {
    id: "jira",
    name: "Jira",
    category: "dev-tools",
    url: "https://www.atlassian.com/software/jira",
    statusUrl: "https://jira-software.status.atlassian.com",
    statusGatorSlug: "jira",
    fetchFn: () =>
      fetchStatuspageStatus(
        "https://jira-software.status.atlassian.com/api/v2/summary.json"
      ),
    fetchRichFn: () =>
      fetchStatuspageStatusRich(
        "https://jira-software.status.atlassian.com/api/v2/summary.json"
      ),
  },
  {
    id: "slack",
    name: "Slack",
    category: "communication",
    url: "https://slack.com",
    statusUrl: "https://slack-status.com",
    downdetectorSlug: "slack",
    statusGatorSlug: "slack",
    fetchFn: fetchSlackStatus,
  },
  {
    id: "zoom",
    name: "Zoom",
    category: "communication",
    url: "https://zoom.us",
    statusUrl: "https://status.zoom.us",
    downdetectorSlug: "zoom",
    statusGatorSlug: "zoom",
    fetchFn: () =>
      fetchStatuspageStatus("https://status.zoom.us/api/v2/summary.json"),
    fetchRichFn: () =>
      fetchStatuspageStatusRich(
        "https://status.zoom.us/api/v2/summary.json"
      ),
  },
  {
    id: "discord",
    name: "Discord",
    category: "communication",
    url: "https://discord.com",
    statusUrl: "https://discordstatus.com",
    downdetectorSlug: "discord",
    statusGatorSlug: "discord",
    fetchFn: () =>
      fetchStatuspageStatus(
        "https://discordstatus.com/api/v2/summary.json"
      ),
    fetchRichFn: () =>
      fetchStatuspageStatusRich(
        "https://discordstatus.com/api/v2/summary.json"
      ),
  },
  {
    id: "notion",
    name: "Notion",
    category: "communication",
    url: "https://www.notion.so",
    statusUrl: "https://www.notion-status.com",
    downdetectorSlug: "notion",
    statusGatorSlug: "notion",
    fetchFn: () =>
      fetchStatuspageStatus(
        "https://www.notion-status.com/api/v2/summary.json"
      ),
    fetchRichFn: () =>
      fetchStatuspageStatusRich(
        "https://www.notion-status.com/api/v2/summary.json"
      ),
  },
  {
    id: "x",
    name: "X (Twitter)",
    category: "communication",
    url: "https://x.com",
    statusUrl: "https://api.twitterstat.us",
    downdetectorSlug: "twitter",
    statusGatorSlug: "twitter",
    fetchFn: fetchXStatus,
  },
  {
    id: "vercel",
    name: "Vercel",
    category: "hosting-cdn",
    url: "https://vercel.com",
    statusUrl: "https://www.vercel-status.com",
    downdetectorSlug: "vercel",
    statusGatorSlug: "vercel",
    fetchFn: () =>
      fetchStatuspageStatus(
        "https://www.vercel-status.com/api/v2/summary.json"
      ),
    fetchRichFn: () =>
      fetchStatuspageStatusRich(
        "https://www.vercel-status.com/api/v2/summary.json"
      ),
  },
  {
    id: "netlify",
    name: "Netlify",
    category: "hosting-cdn",
    url: "https://www.netlify.com",
    statusUrl: "https://www.netlifystatus.com",
    downdetectorSlug: "netlify",
    statusGatorSlug: "netlify",
    fetchFn: () =>
      fetchStatuspageStatus(
        "https://www.netlifystatus.com/api/v2/summary.json"
      ),
    fetchRichFn: () =>
      fetchStatuspageStatusRich(
        "https://www.netlifystatus.com/api/v2/summary.json"
      ),
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    category: "hosting-cdn",
    url: "https://www.cloudflare.com",
    statusUrl: "https://www.cloudflarestatus.com",
    downdetectorSlug: "cloudflare",
    statusGatorSlug: "cloudflare",
    fetchFn: () =>
      fetchStatuspageStatus(
        "https://www.cloudflarestatus.com/api/v2/summary.json"
      ),
    fetchRichFn: () =>
      fetchStatuspageStatusRich(
        "https://www.cloudflarestatus.com/api/v2/summary.json"
      ),
  },
  {
    id: "openai",
    name: "OpenAI",
    category: "ai-ml",
    url: "https://openai.com",
    statusUrl: "https://status.openai.com",
    downdetectorSlug: "openai",
    statusGatorSlug: "openai",
    fetchFn: () =>
      fetchStatuspageStatus(
        "https://status.openai.com/api/v2/summary.json"
      ),
    fetchRichFn: () =>
      fetchStatuspageStatusRich(
        "https://status.openai.com/api/v2/summary.json"
      ),
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    category: "ai-ml",
    url: "https://www.anthropic.com",
    statusUrl: "https://status.anthropic.com",
    downdetectorSlug: "anthropic",
    statusGatorSlug: "anthropic",
    fetchFn: () =>
      fetchStatuspageStatus(
        "https://status.anthropic.com/api/v2/summary.json"
      ),
    fetchRichFn: () =>
      fetchStatuspageStatusRich(
        "https://status.anthropic.com/api/v2/summary.json"
      ),
  },
  {
    id: "figma",
    name: "Figma",
    category: "design-tools",
    url: "https://www.figma.com",
    statusUrl: "https://status.figma.com",
    downdetectorSlug: "figma",
    statusGatorSlug: "figma",
    fetchFn: () =>
      fetchStatuspageStatus(
        "https://status.figma.com/api/v2/summary.json"
      ),
    fetchRichFn: () =>
      fetchStatuspageStatusRich(
        "https://status.figma.com/api/v2/summary.json"
      ),
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "other",
    url: "https://stripe.com",
    statusUrl: "https://status.stripe.com",
    downdetectorSlug: "stripe",
    statusGatorSlug: "stripe",
    fetchFn: fetchStripeStatus,
  },
];

// 全サービスのステータスを取得
export async function fetchAllServiceStatuses(): Promise<ServiceStatusInfo[]> {
  const promises = SERVICE_CONFIGS.map(async (config) => {
    const startTime = performance.now();
    try {
      let status: ServiceStatus;
      let components: ServiceComponent[] | undefined;
      let scheduledMaintenances: ScheduledMaintenance[] | undefined;

      if (config.fetchRichFn) {
        const result = await config.fetchRichFn();
        status = result.status;
        components = result.components;
        scheduledMaintenances = result.scheduledMaintenances;
      } else {
        status = await config.fetchFn();
      }

      const responseTimeMs = Math.round(performance.now() - startTime);

      return {
        id: config.id,
        name: config.name,
        category: config.category,
        status,
        url: config.url,
        statusUrl: config.statusUrl,
        lastChecked: new Date(),
        responseTimeMs,
        components,
        scheduledMaintenances,
        downdetectorUrl: config.downdetectorSlug
          ? `https://downdetector.com/status/${config.downdetectorSlug}/`
          : undefined,
        statusGatorUrl: config.statusGatorSlug
          ? `https://statusgator.com/services/${config.statusGatorSlug}`
          : undefined,
      };
    } catch (error) {
      console.error(`Error fetching status for ${config.id}:`, error);
      const responseTimeMs = Math.round(performance.now() - startTime);
      return {
        id: config.id,
        name: config.name,
        category: config.category,
        status: "unknown" as ServiceStatus,
        url: config.url,
        statusUrl: config.statusUrl,
        lastChecked: new Date(),
        responseTimeMs,
        downdetectorUrl: config.downdetectorSlug
          ? `https://downdetector.com/status/${config.downdetectorSlug}/`
          : undefined,
        statusGatorUrl: config.statusGatorSlug
          ? `https://statusgator.com/services/${config.statusGatorSlug}`
          : undefined,
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

  const startTime = performance.now();
  try {
    let status: ServiceStatus;
    let components: ServiceComponent[] | undefined;
    let scheduledMaintenances: ScheduledMaintenance[] | undefined;

    if (config.fetchRichFn) {
      const result = await config.fetchRichFn();
      status = result.status;
      components = result.components;
      scheduledMaintenances = result.scheduledMaintenances;
    } else {
      status = await config.fetchFn();
    }

    const responseTimeMs = Math.round(performance.now() - startTime);

    return {
      id: config.id,
      name: config.name,
      category: config.category,
      status,
      url: config.url,
      statusUrl: config.statusUrl,
      lastChecked: new Date(),
      responseTimeMs,
      components,
      scheduledMaintenances,
      downdetectorUrl: config.downdetectorSlug
        ? `https://downdetector.com/status/${config.downdetectorSlug}/`
        : undefined,
      statusGatorUrl: config.statusGatorSlug
        ? `https://statusgator.com/services/${config.statusGatorSlug}`
        : undefined,
    };
  } catch (error) {
    console.error(`Error fetching status for ${serviceId}:`, error);
    const responseTimeMs = Math.round(performance.now() - startTime);
    return {
      id: config.id,
      name: config.name,
      category: config.category,
      status: "unknown" as ServiceStatus,
      url: config.url,
      statusUrl: config.statusUrl,
      lastChecked: new Date(),
      responseTimeMs,
      downdetectorUrl: config.downdetectorSlug
        ? `https://downdetector.com/status/${config.downdetectorSlug}/`
        : undefined,
      statusGatorUrl: config.statusGatorSlug
        ? `https://statusgator.com/services/${config.statusGatorSlug}`
        : undefined,
    };
  }
}

// サービスIDのリストを取得
export function getServiceIds(): string[] {
  return SERVICE_CONFIGS.map((config) => config.id);
}
