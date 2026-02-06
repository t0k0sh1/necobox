/**
 * ハッシュ計算 ユーティリティ
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const md5 = require("js-md5") as (message: string | ArrayBuffer | Uint8Array) => string;

export type HashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-512";

export const HASH_ALGORITHMS: HashAlgorithm[] = [
  "MD5",
  "SHA-1",
  "SHA-256",
  "SHA-512",
];

/**
 * テキストからハッシュを計算する
 */
export async function hashText(
  text: string,
  algorithm: HashAlgorithm
): Promise<string> {
  if (algorithm === "MD5") {
    return md5(text);
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  return bufferToHex(hashBuffer);
}

/**
 * ファイルからハッシュを計算する
 */
export async function hashFile(
  file: File,
  algorithm: HashAlgorithm
): Promise<string> {
  const buffer = await file.arrayBuffer();

  if (algorithm === "MD5") {
    return md5(new Uint8Array(buffer));
  }

  const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
  return bufferToHex(hashBuffer);
}

/**
 * ハッシュ値を比較する（大文字小文字を無視）
 */
export function compareHash(hash1: string, hash2: string): boolean {
  return hash1.toLowerCase().trim() === hash2.toLowerCase().trim();
}

/**
 * ArrayBufferを16進文字列に変換する
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
