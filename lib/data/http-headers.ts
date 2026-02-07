// HTTPヘッダーのカテゴリ
export type HttpHeaderCategory =
  | "request_general"
  | "response_general"
  | "caching"
  | "security"
  | "cors"
  | "content_negotiation"
  | "authentication";

// HTTPヘッダーの型
export interface HttpHeader {
  header: string;
  nameEn: string;
  nameJa: string;
  category: HttpHeaderCategory;
  descriptionEn: string;
  descriptionJa: string;
  exampleValue: string;
  direction: "request" | "response" | "both";
  mdnPath?: string;
}

// カテゴリの表示順
export const HTTP_HEADER_CATEGORY_ORDER: HttpHeaderCategory[] = [
  "request_general",
  "response_general",
  "caching",
  "security",
  "cors",
  "content_negotiation",
  "authentication",
];

// HTTPヘッダー一覧
export const HTTP_HEADERS: HttpHeader[] = [
  // リクエスト全般 (request_general)
  {
    header: "Host",
    nameEn: "Host",
    nameJa: "ホスト",
    category: "request_general",
    descriptionEn: "Specifies the domain name of the server and optionally the TCP port number.",
    descriptionJa: "サーバーのドメイン名とオプションでTCPポート番号を指定します。",
    exampleValue: "example.com",
    direction: "request",
    mdnPath: "Web/HTTP/Headers/Host",
  },
  {
    header: "User-Agent",
    nameEn: "User Agent",
    nameJa: "ユーザーエージェント",
    category: "request_general",
    descriptionEn: "Contains a characteristic string that allows the network protocol peers to identify the application type, OS, software vendor, or version.",
    descriptionJa: "ネットワークプロトコルのピアがアプリケーションの種類、OS、ソフトウェアベンダー、バージョンを識別するための文字列を含みます。",
    exampleValue: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    direction: "request",
    mdnPath: "Web/HTTP/Headers/User-Agent",
  },
  {
    header: "Referer",
    nameEn: "Referer",
    nameJa: "リファラー",
    category: "request_general",
    descriptionEn: "Contains the address of the previous web page from which a link to the currently requested page was followed.",
    descriptionJa: "現在リクエストされているページへのリンク元のWebページのアドレスを含みます。",
    exampleValue: "https://example.com/page",
    direction: "request",
    mdnPath: "Web/HTTP/Headers/Referer",
  },
  {
    header: "Cookie",
    nameEn: "Cookie",
    nameJa: "クッキー",
    category: "request_general",
    descriptionEn: "Contains stored HTTP cookies previously sent by the server with the Set-Cookie header.",
    descriptionJa: "サーバーが Set-Cookie ヘッダーで以前送信した保存済みHTTPクッキーを含みます。",
    exampleValue: "session_id=abc123; theme=dark",
    direction: "request",
    mdnPath: "Web/HTTP/Headers/Cookie",
  },
  {
    header: "Content-Type",
    nameEn: "Content Type",
    nameJa: "コンテンツタイプ",
    category: "request_general",
    descriptionEn: "Indicates the media type of the resource or the data.",
    descriptionJa: "リソースまたはデータのメディアタイプを示します。",
    exampleValue: "application/json; charset=utf-8",
    direction: "both",
    mdnPath: "Web/HTTP/Headers/Content-Type",
  },
  {
    header: "Content-Length",
    nameEn: "Content Length",
    nameJa: "コンテンツ長",
    category: "request_general",
    descriptionEn: "Indicates the size of the message body in bytes.",
    descriptionJa: "メッセージボディのサイズをバイト単位で示します。",
    exampleValue: "348",
    direction: "both",
    mdnPath: "Web/HTTP/Headers/Content-Length",
  },

  // レスポンス全般 (response_general)
  {
    header: "Set-Cookie",
    nameEn: "Set Cookie",
    nameJa: "クッキー設定",
    category: "response_general",
    descriptionEn: "Send cookies from the server to the user agent.",
    descriptionJa: "サーバーからユーザーエージェントにクッキーを送信します。",
    exampleValue: "id=abc; Path=/; HttpOnly; Secure",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/Set-Cookie",
  },
  {
    header: "Location",
    nameEn: "Location",
    nameJa: "リダイレクト先",
    category: "response_general",
    descriptionEn: "Indicates the URL to redirect a page to. Used with 3xx and 201 responses.",
    descriptionJa: "ページのリダイレクト先URLを示します。3xx および 201 レスポンスで使用されます。",
    exampleValue: "https://example.com/new-page",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/Location",
  },
  {
    header: "Server",
    nameEn: "Server",
    nameJa: "サーバー",
    category: "response_general",
    descriptionEn: "Contains information about the software used by the origin server to handle the request.",
    descriptionJa: "オリジンサーバーがリクエストを処理するために使用したソフトウェアの情報を含みます。",
    exampleValue: "nginx/1.25.3",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/Server",
  },
  {
    header: "Retry-After",
    nameEn: "Retry After",
    nameJa: "リトライ待機",
    category: "response_general",
    descriptionEn: "Indicates how long the user agent should wait before making a follow-up request.",
    descriptionJa: "ユーザーエージェントがフォローアップリクエストを行うまでの待機時間を示します。",
    exampleValue: "120",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/Retry-After",
  },

  // キャッシュ (caching)
  {
    header: "Cache-Control",
    nameEn: "Cache Control",
    nameJa: "キャッシュ制御",
    category: "caching",
    descriptionEn: "Directives for caching mechanisms in both requests and responses.",
    descriptionJa: "リクエストとレスポンスの両方のキャッシュメカニズムに対するディレクティブ。",
    exampleValue: "max-age=3600, public",
    direction: "both",
    mdnPath: "Web/HTTP/Headers/Cache-Control",
  },
  {
    header: "ETag",
    nameEn: "ETag",
    nameJa: "エンティティタグ",
    category: "caching",
    descriptionEn: "An identifier for a specific version of a resource. Allows caches to be more efficient.",
    descriptionJa: "リソースの特定バージョンの識別子。キャッシュの効率を向上させます。",
    exampleValue: '"33a64df5"',
    direction: "response",
    mdnPath: "Web/HTTP/Headers/ETag",
  },
  {
    header: "If-None-Match",
    nameEn: "If None Match",
    nameJa: "条件付きリクエスト（ETag）",
    category: "caching",
    descriptionEn: "Makes the request conditional. The server returns 304 if the ETag matches.",
    descriptionJa: "リクエストを条件付きにします。ETagが一致する場合、サーバーは304を返します。",
    exampleValue: '"33a64df5"',
    direction: "request",
    mdnPath: "Web/HTTP/Headers/If-None-Match",
  },
  {
    header: "If-Modified-Since",
    nameEn: "If Modified Since",
    nameJa: "条件付きリクエスト（日時）",
    category: "caching",
    descriptionEn: "Makes the request conditional. The server returns 304 if the resource hasn't been modified since the given date.",
    descriptionJa: "リクエストを条件付きにします。指定日時以降にリソースが変更されていなければ304を返します。",
    exampleValue: "Wed, 21 Oct 2024 07:28:00 GMT",
    direction: "request",
    mdnPath: "Web/HTTP/Headers/If-Modified-Since",
  },
  {
    header: "Last-Modified",
    nameEn: "Last Modified",
    nameJa: "最終更新日時",
    category: "caching",
    descriptionEn: "Contains the date and time at which the origin server believes the resource was last modified.",
    descriptionJa: "オリジンサーバーがリソースが最後に変更されたと考える日時を含みます。",
    exampleValue: "Thu, 01 Jan 2025 00:00:00 GMT",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/Last-Modified",
  },
  {
    header: "Expires",
    nameEn: "Expires",
    nameJa: "有効期限",
    category: "caching",
    descriptionEn: "Contains the date/time after which the response is considered stale.",
    descriptionJa: "レスポンスが古くなったとみなされる日時を含みます。",
    exampleValue: "Thu, 01 Dec 2025 16:00:00 GMT",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/Expires",
  },

  // セキュリティ (security)
  {
    header: "Strict-Transport-Security",
    nameEn: "HSTS",
    nameJa: "HSTS",
    category: "security",
    descriptionEn: "Tells browsers to only access the site using HTTPS.",
    descriptionJa: "ブラウザにHTTPSのみでサイトにアクセスするよう指示します。",
    exampleValue: "max-age=31536000; includeSubDomains",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/Strict-Transport-Security",
  },
  {
    header: "Content-Security-Policy",
    nameEn: "CSP",
    nameJa: "コンテンツセキュリティポリシー",
    category: "security",
    descriptionEn: "Controls resources the user agent is allowed to load for a given page.",
    descriptionJa: "ユーザーエージェントが特定のページで読み込むことが許可されるリソースを制御します。",
    exampleValue: "default-src 'self'; script-src 'self'",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/Content-Security-Policy",
  },
  {
    header: "X-Content-Type-Options",
    nameEn: "X-Content-Type-Options",
    nameJa: "MIMEスニッフィング防止",
    category: "security",
    descriptionEn: "Prevents MIME type sniffing. Only defined value is 'nosniff'.",
    descriptionJa: "MIMEタイプのスニッフィングを防止します。定義されている値は 'nosniff' のみです。",
    exampleValue: "nosniff",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/X-Content-Type-Options",
  },
  {
    header: "X-Frame-Options",
    nameEn: "X-Frame-Options",
    nameJa: "フレーム埋め込み制御",
    category: "security",
    descriptionEn: "Indicates whether a browser should be allowed to render a page in a frame, iframe, embed, or object.",
    descriptionJa: "ブラウザがページを frame、iframe、embed、object でレンダリングすることを許可するかどうかを示します。",
    exampleValue: "DENY",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/X-Frame-Options",
  },
  {
    header: "Referrer-Policy",
    nameEn: "Referrer Policy",
    nameJa: "リファラーポリシー",
    category: "security",
    descriptionEn: "Controls how much referrer information should be included with requests.",
    descriptionJa: "リクエストに含めるリファラー情報の量を制御します。",
    exampleValue: "strict-origin-when-cross-origin",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/Referrer-Policy",
  },
  {
    header: "Permissions-Policy",
    nameEn: "Permissions Policy",
    nameJa: "パーミッションポリシー",
    category: "security",
    descriptionEn: "Controls which browser features and APIs can be used in the document.",
    descriptionJa: "ドキュメント内で使用できるブラウザ機能とAPIを制御します。",
    exampleValue: "camera=(), microphone=(), geolocation=()",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/Permissions-Policy",
  },

  // CORS (cors)
  {
    header: "Access-Control-Allow-Origin",
    nameEn: "CORS Allow Origin",
    nameJa: "CORSオリジン許可",
    category: "cors",
    descriptionEn: "Indicates whether the response can be shared with requesting code from the given origin.",
    descriptionJa: "指定されたオリジンからのリクエストコードとレスポンスを共有できるかどうかを示します。",
    exampleValue: "https://example.com",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/Access-Control-Allow-Origin",
  },
  {
    header: "Access-Control-Allow-Methods",
    nameEn: "CORS Allow Methods",
    nameJa: "CORSメソッド許可",
    category: "cors",
    descriptionEn: "Specifies the methods allowed when accessing the resource in response to a preflight request.",
    descriptionJa: "プリフライトリクエストへのレスポンスで、リソースへのアクセス時に許可されるメソッドを指定します。",
    exampleValue: "GET, POST, PUT, DELETE",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/Access-Control-Allow-Methods",
  },
  {
    header: "Access-Control-Allow-Headers",
    nameEn: "CORS Allow Headers",
    nameJa: "CORSヘッダー許可",
    category: "cors",
    descriptionEn: "Used in response to a preflight request to indicate which HTTP headers can be used during the actual request.",
    descriptionJa: "プリフライトリクエストへのレスポンスで、実際のリクエスト時に使用できるHTTPヘッダーを示します。",
    exampleValue: "Content-Type, Authorization",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/Access-Control-Allow-Headers",
  },
  {
    header: "Access-Control-Allow-Credentials",
    nameEn: "CORS Allow Credentials",
    nameJa: "CORS資格情報許可",
    category: "cors",
    descriptionEn: "Indicates whether the response to the request can be exposed when the credentials flag is true.",
    descriptionJa: "資格情報フラグがtrueの場合、リクエストへのレスポンスを公開できるかどうかを示します。",
    exampleValue: "true",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/Access-Control-Allow-Credentials",
  },
  {
    header: "Origin",
    nameEn: "Origin",
    nameJa: "オリジン",
    category: "cors",
    descriptionEn: "Indicates the origin of the request. Sent with CORS requests and POST requests.",
    descriptionJa: "リクエストのオリジンを示します。CORSリクエストおよびPOSTリクエストで送信されます。",
    exampleValue: "https://example.com",
    direction: "request",
    mdnPath: "Web/HTTP/Headers/Origin",
  },

  // コンテンツネゴシエーション (content_negotiation)
  {
    header: "Accept",
    nameEn: "Accept",
    nameJa: "受入可能メディアタイプ",
    category: "content_negotiation",
    descriptionEn: "Informs the server about the types of data that can be sent back.",
    descriptionJa: "サーバーに返送可能なデータの種類を通知します。",
    exampleValue: "text/html, application/json",
    direction: "request",
    mdnPath: "Web/HTTP/Headers/Accept",
  },
  {
    header: "Accept-Language",
    nameEn: "Accept Language",
    nameJa: "受入可能言語",
    category: "content_negotiation",
    descriptionEn: "Advertises which languages the client is able to understand.",
    descriptionJa: "クライアントが理解可能な言語をサーバーに通知します。",
    exampleValue: "ja, en-US;q=0.9, en;q=0.8",
    direction: "request",
    mdnPath: "Web/HTTP/Headers/Accept-Language",
  },
  {
    header: "Accept-Encoding",
    nameEn: "Accept Encoding",
    nameJa: "受入可能エンコーディング",
    category: "content_negotiation",
    descriptionEn: "Advertises which content encoding the client is able to understand.",
    descriptionJa: "クライアントが理解可能なコンテンツエンコーディングをサーバーに通知します。",
    exampleValue: "gzip, deflate, br",
    direction: "request",
    mdnPath: "Web/HTTP/Headers/Accept-Encoding",
  },
  {
    header: "Content-Encoding",
    nameEn: "Content Encoding",
    nameJa: "コンテンツエンコーディング",
    category: "content_negotiation",
    descriptionEn: "Lists any encodings that have been applied to the representation.",
    descriptionJa: "表現に適用されたエンコーディングのリスト。",
    exampleValue: "gzip",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/Content-Encoding",
  },

  // 認証 (authentication)
  {
    header: "Authorization",
    nameEn: "Authorization",
    nameJa: "認証",
    category: "authentication",
    descriptionEn: "Contains the credentials to authenticate a user agent with a server.",
    descriptionJa: "ユーザーエージェントをサーバーで認証するための資格情報を含みます。",
    exampleValue: "Bearer eyJhbGciOiJIUzI1NiIs...",
    direction: "request",
    mdnPath: "Web/HTTP/Headers/Authorization",
  },
  {
    header: "WWW-Authenticate",
    nameEn: "WWW-Authenticate",
    nameJa: "認証要求",
    category: "authentication",
    descriptionEn: "Defines the authentication method that should be used to gain access to a resource.",
    descriptionJa: "リソースへのアクセスに使用すべき認証方法を定義します。",
    exampleValue: "Bearer realm=\"example\"",
    direction: "response",
    mdnPath: "Web/HTTP/Headers/WWW-Authenticate",
  },
  {
    header: "Proxy-Authorization",
    nameEn: "Proxy Authorization",
    nameJa: "プロキシ認証",
    category: "authentication",
    descriptionEn: "Contains the credentials to authenticate a user agent with a proxy server.",
    descriptionJa: "ユーザーエージェントをプロキシサーバーで認証するための資格情報を含みます。",
    exampleValue: "Basic dXNlcjpwYXNz",
    direction: "request",
    mdnPath: "Web/HTTP/Headers/Proxy-Authorization",
  },
];

// カテゴリごとにグループ化
export function getHttpHeadersByCategory(): Map<HttpHeaderCategory, HttpHeader[]> {
  const grouped = new Map<HttpHeaderCategory, HttpHeader[]>();

  for (const category of HTTP_HEADER_CATEGORY_ORDER) {
    grouped.set(category, []);
  }

  for (const header of HTTP_HEADERS) {
    const list = grouped.get(header.category);
    if (list) {
      list.push(header);
    }
  }

  return grouped;
}
