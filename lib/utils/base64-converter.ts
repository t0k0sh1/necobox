/**
 * Base64エンコード/デコード ユーティリティ
 */

/**
 * テキストをBase64エンコードする（UTF-8対応）
 */
export function encodeBase64(text: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Base64テキストをデコードする
 */
export function decodeBase64(base64: string): {
  result: string;
  error: string | null;
} {
  try {
    // Data URI プレフィックスを除去
    const cleanBase64 = base64.includes(",")
      ? base64.split(",")[1]
      : base64;

    // パディング修正
    const padded = cleanBase64 + "=".repeat((4 - (cleanBase64.length % 4)) % 4);

    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    return { result: decoder.decode(bytes), error: null };
  } catch {
    return { result: "", error: "Invalid Base64 string" };
  }
}

/**
 * ファイルをBase64に変換する
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Data URIからBase64部分を抽出
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Base64をData URI形式に変換する
 */
export function toDataUri(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

/**
 * 文字列が有効なBase64かどうかを検証する
 */
export function isValidBase64(str: string): boolean {
  if (str.length === 0) return false;
  try {
    // Data URIの場合はBase64部分のみチェック
    const base64Part = str.includes(",") ? str.split(",")[1] : str;
    if (!base64Part) return false;
    atob(base64Part);
    return true;
  } catch {
    return false;
  }
}

/**
 * ファイルサイズをフォーマットする
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
