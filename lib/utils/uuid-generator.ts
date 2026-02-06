/**
 * UUID/ULID ジェネレーター ユーティリティ
 */

import { ulid } from "ulid";
import { nanoid } from "nanoid";

export type IdType = "uuidV4" | "uuidV7" | "ulid" | "nanoid";

/**
 * UUID v4 を生成する
 */
export function generateUUIDv4(): string {
  return crypto.randomUUID();
}

/**
 * UUID v7 を生成する（RFC 9562 準拠）
 */
export function generateUUIDv7(): string {
  const timestamp = Date.now();

  // 48ビットのタイムスタンプを設定
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // タイムスタンプを上位48ビットに設定
  bytes[0] = (timestamp / 2 ** 40) & 0xff;
  bytes[1] = (timestamp / 2 ** 32) & 0xff;
  bytes[2] = (timestamp / 2 ** 24) & 0xff;
  bytes[3] = (timestamp / 2 ** 16) & 0xff;
  bytes[4] = (timestamp / 2 ** 8) & 0xff;
  bytes[5] = timestamp & 0xff;

  // バージョン 7 を設定 (上位4ビット = 0111)
  bytes[6] = (bytes[6] & 0x0f) | 0x70;

  // バリアント 10xx を設定
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // 16進文字列に変換
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * ULID を生成する
 */
export function generateULID(): string {
  return ulid();
}

/**
 * Nanoid を生成する
 */
export function generateNanoid(length: number = 21): string {
  return nanoid(length);
}

/**
 * バッチ生成
 */
export function batchGenerate(
  type: IdType,
  count: number,
  options?: { nanoidLength?: number }
): string[] {
  const results: string[] = [];
  const generators: Record<IdType, () => string> = {
    uuidV4: generateUUIDv4,
    uuidV7: generateUUIDv7,
    ulid: generateULID,
    nanoid: () => generateNanoid(options?.nanoidLength ?? 21),
  };

  const generator = generators[type];
  for (let i = 0; i < count; i++) {
    results.push(generator());
  }

  return results;
}
