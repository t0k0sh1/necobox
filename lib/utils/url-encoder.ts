/**
 * URLエンコード/デコード ユーティリティ
 */

export type EncodeMode = "component" | "uri";

/**
 * テキストをURLエンコードする
 */
export function urlEncode(text: string, mode: EncodeMode): string {
  if (mode === "component") {
    return encodeURIComponent(text);
  }
  return encodeURI(text);
}

/**
 * URLエンコード済みテキストをデコードする
 */
export function urlDecode(encoded: string): {
  result: string;
  error: string | null;
} {
  try {
    return { result: decodeURIComponent(encoded), error: null };
  } catch {
    return { result: "", error: "Invalid URL encoding" };
  }
}

/**
 * URLからクエリパラメータを解析する
 */
export function parseQueryParams(
  url: string
): { key: string; value: string }[] {
  try {
    const queryString = url.includes("?") ? url.split("?")[1] : url;
    if (!queryString || queryString.trim() === "") return [];

    // フラグメントを除去
    const cleanQuery = queryString.split("#")[0];
    if (!cleanQuery) return [];

    const params: { key: string; value: string }[] = [];
    const pairs = cleanQuery.split("&");

    for (const pair of pairs) {
      if (!pair) continue;
      const eqIndex = pair.indexOf("=");
      if (eqIndex === -1) {
        params.push({
          key: decodeURIComponent(pair),
          value: "",
        });
      } else {
        params.push({
          key: decodeURIComponent(pair.substring(0, eqIndex)),
          value: decodeURIComponent(pair.substring(eqIndex + 1)),
        });
      }
    }

    return params;
  } catch {
    return [];
  }
}

/**
 * クエリパラメータからクエリ文字列を構築する
 */
export function buildQueryString(
  params: { key: string; value: string }[]
): string {
  if (params.length === 0) return "";

  return params
    .filter((p) => p.key.trim() !== "")
    .map(
      (p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`
    )
    .join("&");
}
