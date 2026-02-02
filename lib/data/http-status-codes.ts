// HTTPステータスコードのカテゴリ
export type HttpStatusCategory = "1xx" | "2xx" | "3xx" | "4xx" | "5xx" | "non_standard";

// HTTPステータスコードの型
export interface HttpStatusCode {
  code: number;
  nameEn: string;
  nameJa: string;
  category: HttpStatusCategory;
}

// HTTPステータスコード一覧
export const HTTP_STATUS_CODES: HttpStatusCode[] = [
  // 1xx Informational（情報レスポンス）
  { code: 100, nameEn: "Continue", nameJa: "継続", category: "1xx" },
  { code: 101, nameEn: "Switching Protocols", nameJa: "プロトコル切替", category: "1xx" },

  // 2xx Success（成功）
  { code: 200, nameEn: "OK", nameJa: "成功", category: "2xx" },
  { code: 201, nameEn: "Created", nameJa: "作成完了", category: "2xx" },
  { code: 202, nameEn: "Accepted", nameJa: "受理済み", category: "2xx" },
  { code: 203, nameEn: "Non-Authoritative Information", nameJa: "非権威情報", category: "2xx" },
  { code: 204, nameEn: "No Content", nameJa: "コンテンツなし", category: "2xx" },
  { code: 206, nameEn: "Partial Content", nameJa: "部分的コンテンツ", category: "2xx" },

  // 3xx Redirection（リダイレクト）
  { code: 300, nameEn: "Multiple Choices", nameJa: "複数選択", category: "3xx" },
  { code: 301, nameEn: "Moved Permanently", nameJa: "恒久的移動", category: "3xx" },
  { code: 302, nameEn: "Found", nameJa: "発見（一時的移動）", category: "3xx" },
  { code: 303, nameEn: "See Other", nameJa: "他を参照", category: "3xx" },
  { code: 304, nameEn: "Not Modified", nameJa: "未更新", category: "3xx" },
  { code: 307, nameEn: "Temporary Redirect", nameJa: "一時的リダイレクト", category: "3xx" },
  { code: 308, nameEn: "Permanent Redirect", nameJa: "恒久的リダイレクト", category: "3xx" },

  // 4xx Client Error（クライアントエラー）
  { code: 400, nameEn: "Bad Request", nameJa: "不正なリクエスト", category: "4xx" },
  { code: 401, nameEn: "Unauthorized", nameJa: "認証が必要", category: "4xx" },
  { code: 402, nameEn: "Payment Required", nameJa: "支払いが必要", category: "4xx" },
  { code: 403, nameEn: "Forbidden", nameJa: "アクセス禁止", category: "4xx" },
  { code: 404, nameEn: "Not Found", nameJa: "見つかりません", category: "4xx" },
  { code: 405, nameEn: "Method Not Allowed", nameJa: "メソッド不許可", category: "4xx" },
  { code: 406, nameEn: "Not Acceptable", nameJa: "受理不可", category: "4xx" },
  { code: 407, nameEn: "Proxy Authentication Required", nameJa: "プロキシ認証が必要", category: "4xx" },
  { code: 408, nameEn: "Request Timeout", nameJa: "リクエストタイムアウト", category: "4xx" },
  { code: 409, nameEn: "Conflict", nameJa: "競合", category: "4xx" },
  { code: 410, nameEn: "Gone", nameJa: "消滅", category: "4xx" },
  { code: 411, nameEn: "Length Required", nameJa: "Content-Lengthが必要", category: "4xx" },
  { code: 412, nameEn: "Precondition Failed", nameJa: "前提条件が失敗", category: "4xx" },
  { code: 413, nameEn: "Payload Too Large", nameJa: "ペイロードが大きすぎる", category: "4xx" },
  { code: 414, nameEn: "URI Too Long", nameJa: "URIが長すぎる", category: "4xx" },
  { code: 415, nameEn: "Unsupported Media Type", nameJa: "未対応メディア形式", category: "4xx" },
  { code: 416, nameEn: "Range Not Satisfiable", nameJa: "範囲が不正", category: "4xx" },
  { code: 417, nameEn: "Expectation Failed", nameJa: "期待に沿えない", category: "4xx" },
  { code: 422, nameEn: "Unprocessable Entity", nameJa: "処理不可エンティティ", category: "4xx" },
  { code: 426, nameEn: "Upgrade Required", nameJa: "アップグレードが必要", category: "4xx" },
  { code: 428, nameEn: "Precondition Required", nameJa: "前提条件が必要", category: "4xx" },
  { code: 429, nameEn: "Too Many Requests", nameJa: "リクエスト過多", category: "4xx" },
  { code: 431, nameEn: "Request Header Fields Too Large", nameJa: "ヘッダが大きすぎる", category: "4xx" },
  { code: 451, nameEn: "Unavailable For Legal Reasons", nameJa: "法的理由で利用不可", category: "4xx" },

  // 5xx Server Error（サーバーエラー）
  { code: 500, nameEn: "Internal Server Error", nameJa: "内部サーバーエラー", category: "5xx" },
  { code: 501, nameEn: "Not Implemented", nameJa: "未実装", category: "5xx" },
  { code: 502, nameEn: "Bad Gateway", nameJa: "不正なゲートウェイ", category: "5xx" },
  { code: 503, nameEn: "Service Unavailable", nameJa: "サービス利用不可", category: "5xx" },
  { code: 504, nameEn: "Gateway Timeout", nameJa: "ゲートウェイタイムアウト", category: "5xx" },
  { code: 505, nameEn: "HTTP Version Not Supported", nameJa: "HTTPバージョン未対応", category: "5xx" },
  { code: 506, nameEn: "Variant Also Negotiates", nameJa: "バリアントの交渉", category: "5xx" },
  { code: 507, nameEn: "Insufficient Storage", nameJa: "容量不足", category: "5xx" },
  { code: 511, nameEn: "Network Authentication Required", nameJa: "ネットワーク認証が必要", category: "5xx" },

  // 非標準ステータスコード（CloudFront/AWS/Cloudflare等）
  { code: 460, nameEn: "Client Closed Connection", nameJa: "クライアント切断（ELB/CloudFront）", category: "non_standard" },
  { code: 463, nameEn: "X-Forwarded-For Header Too Large", nameJa: "X-Forwarded-For過多（ELB/CloudFront）", category: "non_standard" },
  { code: 520, nameEn: "Web Server Returns Unknown Error", nameJa: "不明エラー（Cloudflare）", category: "non_standard" },
  { code: 521, nameEn: "Web Server Is Down", nameJa: "Webサーバー停止（Cloudflare）", category: "non_standard" },
  { code: 522, nameEn: "Connection Timed Out", nameJa: "接続タイムアウト（Cloudflare）", category: "non_standard" },
  { code: 523, nameEn: "Origin Is Unreachable", nameJa: "オリジン到達不可（Cloudflare）", category: "non_standard" },
  { code: 524, nameEn: "A Timeout Occurred", nameJa: "タイムアウト発生（Cloudflare）", category: "non_standard" },
];

// カテゴリの表示順序
export const CATEGORY_ORDER: HttpStatusCategory[] = ["1xx", "2xx", "3xx", "4xx", "5xx", "non_standard"];

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
