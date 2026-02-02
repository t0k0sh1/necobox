// HTTPステータスコードのカテゴリ
export type HttpStatusCategory = "2xx" | "3xx" | "4xx" | "5xx" | "cloudflare";

// HTTPステータスコードの型
export interface HttpStatusCode {
  code: number;
  nameEn: string;
  nameJa: string;
  category: HttpStatusCategory;
}

// HTTPステータスコード一覧
export const HTTP_STATUS_CODES: HttpStatusCode[] = [
  // 2xx Success（成功）
  { code: 200, nameEn: "OK", nameJa: "成功", category: "2xx" },
  { code: 201, nameEn: "Created", nameJa: "作成完了", category: "2xx" },
  { code: 202, nameEn: "Accepted", nameJa: "受理済み", category: "2xx" },
  { code: 204, nameEn: "No Content", nameJa: "コンテンツなし", category: "2xx" },
  { code: 206, nameEn: "Partial Content", nameJa: "部分的コンテンツ", category: "2xx" },

  // 3xx Redirection（リダイレクト）
  { code: 301, nameEn: "Moved Permanently", nameJa: "恒久的移動", category: "3xx" },
  { code: 302, nameEn: "Found", nameJa: "発見（一時的移動）", category: "3xx" },
  { code: 303, nameEn: "See Other", nameJa: "他を参照", category: "3xx" },
  { code: 304, nameEn: "Not Modified", nameJa: "未更新", category: "3xx" },
  { code: 307, nameEn: "Temporary Redirect", nameJa: "一時的リダイレクト", category: "3xx" },
  { code: 308, nameEn: "Permanent Redirect", nameJa: "恒久的リダイレクト", category: "3xx" },

  // 4xx Client Error（クライアントエラー）
  { code: 400, nameEn: "Bad Request", nameJa: "不正なリクエスト", category: "4xx" },
  { code: 401, nameEn: "Unauthorized", nameJa: "認証が必要", category: "4xx" },
  { code: 403, nameEn: "Forbidden", nameJa: "アクセス禁止", category: "4xx" },
  { code: 404, nameEn: "Not Found", nameJa: "見つかりません", category: "4xx" },
  { code: 405, nameEn: "Method Not Allowed", nameJa: "メソッド不許可", category: "4xx" },
  { code: 408, nameEn: "Request Timeout", nameJa: "リクエストタイムアウト", category: "4xx" },
  { code: 409, nameEn: "Conflict", nameJa: "競合", category: "4xx" },
  { code: 410, nameEn: "Gone", nameJa: "消滅", category: "4xx" },
  { code: 413, nameEn: "Payload Too Large", nameJa: "ペイロードが大きすぎる", category: "4xx" },
  { code: 414, nameEn: "URI Too Long", nameJa: "URIが長すぎる", category: "4xx" },
  { code: 415, nameEn: "Unsupported Media Type", nameJa: "未対応メディア形式", category: "4xx" },
  { code: 422, nameEn: "Unprocessable Entity", nameJa: "処理不可エンティティ", category: "4xx" },
  { code: 429, nameEn: "Too Many Requests", nameJa: "リクエスト過多", category: "4xx" },
  { code: 451, nameEn: "Unavailable For Legal Reasons", nameJa: "法的理由で利用不可", category: "4xx" },

  // 5xx Server Error（サーバーエラー）
  { code: 500, nameEn: "Internal Server Error", nameJa: "内部サーバーエラー", category: "5xx" },
  { code: 501, nameEn: "Not Implemented", nameJa: "未実装", category: "5xx" },
  { code: 502, nameEn: "Bad Gateway", nameJa: "不正なゲートウェイ", category: "5xx" },
  { code: 503, nameEn: "Service Unavailable", nameJa: "サービス利用不可", category: "5xx" },
  { code: 504, nameEn: "Gateway Timeout", nameJa: "ゲートウェイタイムアウト", category: "5xx" },
  { code: 505, nameEn: "HTTP Version Not Supported", nameJa: "HTTPバージョン未対応", category: "5xx" },

  // CloudFront/AWS/Cloudflare固有（非標準）
  { code: 460, nameEn: "Client Closed Connection", nameJa: "クライアント切断（ELB/CloudFront）", category: "cloudflare" },
  { code: 463, nameEn: "X-Forwarded-For Header Too Large", nameJa: "X-Forwarded-For過多（ELB/CloudFront）", category: "cloudflare" },
  { code: 520, nameEn: "Web Server Returns Unknown Error", nameJa: "不明エラー（Cloudflare）", category: "cloudflare" },
  { code: 521, nameEn: "Web Server Is Down", nameJa: "Webサーバー停止（Cloudflare）", category: "cloudflare" },
  { code: 522, nameEn: "Connection Timed Out", nameJa: "接続タイムアウト（Cloudflare）", category: "cloudflare" },
  { code: 523, nameEn: "Origin Is Unreachable", nameJa: "オリジン到達不可（Cloudflare）", category: "cloudflare" },
  { code: 524, nameEn: "A Timeout Occurred", nameJa: "タイムアウト発生（Cloudflare）", category: "cloudflare" },
];

// カテゴリの表示順序
export const CATEGORY_ORDER: HttpStatusCategory[] = ["2xx", "3xx", "4xx", "5xx", "cloudflare"];

// カテゴリごとにグループ化
export function getStatusCodesByCategory(): Map<HttpStatusCategory, HttpStatusCode[]> {
  const grouped = new Map<HttpStatusCategory, HttpStatusCode[]>();

  for (const category of CATEGORY_ORDER) {
    grouped.set(category, []);
  }

  for (const code of HTTP_STATUS_CODES) {
    const list = grouped.get(code.category);
    if (list) {
      list.push(code);
    }
  }

  return grouped;
}
