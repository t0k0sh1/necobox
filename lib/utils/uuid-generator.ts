/**
 * UUID/ULID ジェネレーター ユーティリティ
 */

import { ulid } from "ulid";
import { nanoid } from "nanoid";

export type IdType = "uuidV4" | "uuidV7" | "ulid" | "nanoid";

/** タイムスタンプの解決方法（UUID v7 / ULID のみ使用） */
export type TimeSourceOption =
  | "now"
  | { mode: "range"; minMs: number; maxMs: number };

export type BatchGenerateOptions = {
  nanoidLength?: number;
  timeSource?: TimeSourceOption;
};

/** UUID v7 に埋め込める Unix 時刻（ミリ秒）の上限（48 ビット） */
const UUIDV7_TIMESTAMP_MAX = 2 ** 48 - 1;

/**
 * [minMs, maxMs]（両端含む）から暗号論的乱数で一様にミリ秒を選ぶ。
 */
export function pickRandomMsInRange(minMs: number, maxMs: number): number {
  if (!Number.isFinite(minMs) || !Number.isFinite(maxMs)) {
    throw new RangeError("時刻範囲は有限の数である必要があります");
  }
  const min = Math.floor(minMs);
  const max = Math.floor(maxMs);
  if (min > max) {
    throw new RangeError("時刻範囲の開始は終了以下である必要があります");
  }

  const span = max - min + 1;
  if (span <= 0) {
    throw new RangeError("無効な時刻範囲です");
  }

  const spanB = BigInt(span);
  const space = BigInt(1) << BigInt(53);
  const limit = (space / spanB) * spanB;
  const buf = new Uint8Array(8);

  let r: bigint;
  const eight = BigInt(8);
  const mask = space - BigInt(1);
  do {
    crypto.getRandomValues(buf);
    r = BigInt(0);
    for (let i = 0; i < 8; i++) {
      r = (r << eight) | BigInt(buf[i]);
    }
    r &= mask;
  } while (r >= limit);

  return min + Number(r % spanB);
}

function resolveTimestampMsForV7(source: TimeSourceOption | undefined): number {
  const ts =
    source === undefined || source === "now"
      ? Date.now()
      : pickRandomMsInRange(source.minMs, source.maxMs);

  if (ts < 0 || ts > UUIDV7_TIMESTAMP_MAX) {
    throw new RangeError(
      `UUID v7 のタイムスタンプは 0 以上 ${UUIDV7_TIMESTAMP_MAX} 以下である必要があります`
    );
  }
  return ts;
}

/**
 * UUID v7 用に先頭 6 バイトに 48 ビット Unix 時刻（ミリ秒・ビッグエンディアン）を書き込む。
 */
function writeUuidV7Timestamp(bytes: Uint8Array, timestampMs: number): void {
  const timestamp = Math.floor(timestampMs);
  bytes[0] = (timestamp / 2 ** 40) & 0xff;
  bytes[1] = (timestamp / 2 ** 32) & 0xff;
  bytes[2] = (timestamp / 2 ** 24) & 0xff;
  bytes[3] = (timestamp / 2 ** 16) & 0xff;
  bytes[4] = (timestamp / 2 ** 8) & 0xff;
  bytes[5] = timestamp & 0xff;
}

/**
 * UUID v4 を生成する
 */
export function generateUUIDv4(): string {
  return crypto.randomUUID();
}

/**
 * UUID v7 を生成する（RFC 9562）
 * @param timeSource 省略または "now" で現在時刻。期間指定時は期間内のミリ秒を一様ランダムに選ぶ。
 */
export function generateUUIDv7(timeSource?: TimeSourceOption): string {
  const timestamp = resolveTimestampMsForV7(timeSource);

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  writeUuidV7Timestamp(bytes, timestamp);

  // バージョン 7 を設定 (上位4ビット = 0111)
  bytes[6] = (bytes[6] & 0x0f) | 0x70;

  // バリアント 10xx を設定
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * ULID を生成する
 * @param timeSource 省略または "now" で生成時刻。期間指定時はその期間内のミリ秒を一様ランダムに選ぶ。
 */
export function generateULID(timeSource?: TimeSourceOption): string {
  if (timeSource === undefined || timeSource === "now") {
    return ulid();
  }
  const ms = pickRandomMsInRange(timeSource.minMs, timeSource.maxMs);
  return ulid(ms);
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
  options?: BatchGenerateOptions
): string[] {
  const results: string[] = [];
  const timeSource = options?.timeSource;

  const generators: Record<IdType, () => string> = {
    uuidV4: generateUUIDv4,
    uuidV7: () => generateUUIDv7(timeSource),
    ulid: () => generateULID(timeSource),
    nanoid: () => generateNanoid(options?.nanoidLength ?? 21),
  };

  const generator = generators[type];
  for (let i = 0; i < count; i++) {
    results.push(generator());
  }

  return results;
}
