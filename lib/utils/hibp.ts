export interface HibpResult {
  /** 漏洩が見つかったか */
  breached: boolean;
  /** 漏洩件数（0の場合は安全） */
  count: number;
  /** エラーが発生した場合 */
  error?: string;
}

/**
 * Web Crypto API で SHA-1 ハッシュを計算
 */
export async function sha1Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/**
 * Have I Been Pwned API による漏洩チェック（k-Anonymity方式）
 * SHA-1ハッシュのプレフィックス5文字をサーバーProxy経由で送信し、
 * サフィックスを照合して漏洩件数を返す
 */
export async function checkPasswordBreach(
  password: string
): Promise<HibpResult> {
  try {
    const hash = await sha1Hash(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const response = await fetch(`/api/v1/hibp?prefix=${prefix}`);

    if (!response.ok) {
      return { breached: false, count: 0, error: "API request failed" };
    }

    const text = await response.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(":");
      if (hashSuffix?.trim().toUpperCase() === suffix) {
        const count = parseInt(countStr?.trim() ?? "0", 10);
        return { breached: count > 0, count };
      }
    }

    return { breached: false, count: 0 };
  } catch {
    return { breached: false, count: 0, error: "Failed to check breach status" };
  }
}
