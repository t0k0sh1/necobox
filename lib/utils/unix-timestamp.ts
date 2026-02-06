/**
 * Unixタイムスタンプ変換 ユーティリティ
 */

export type TimestampUnit = "seconds" | "milliseconds";

export interface FormattedDate {
  local: string;
  utc: string;
  iso8601: string;
  relative: string;
}

/**
 * タイムスタンプをDateオブジェクトに変換する
 */
export function timestampToDate(
  timestamp: number,
  unit: TimestampUnit
): Date {
  const ms = unit === "seconds" ? timestamp * 1000 : timestamp;
  return new Date(ms);
}

/**
 * Dateオブジェクトをタイムスタンプに変換する
 */
export function dateToTimestamp(date: Date, unit: TimestampUnit): number {
  const ms = date.getTime();
  return unit === "seconds" ? Math.floor(ms / 1000) : ms;
}

/**
 * 日付をフォーマットする
 */
export function formatDate(date: Date): FormattedDate {
  if (isNaN(date.getTime())) {
    return { local: "Invalid Date", utc: "Invalid Date", iso8601: "Invalid Date", relative: "Invalid Date" };
  }

  const local = date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const utc = date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

  const iso8601 = date.toISOString();
  const relative = getRelativeTime(date);

  return { local, utc, iso8601, relative };
}

/**
 * 相対時間文字列を取得する
 */
function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const absDiff = Math.abs(diff);
  const isPast = diff > 0;

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);

  let text: string;
  if (seconds < 60) text = `${seconds}秒`;
  else if (minutes < 60) text = `${minutes}分`;
  else if (hours < 24) text = `${hours}時間`;
  else if (days < 365) text = `${days}日`;
  else text = `${years}年`;

  return isPast ? `${text}前` : `${text}後`;
}

/**
 * タイムスタンプの妥当性と単位を判定する
 */
export function isValidTimestamp(value: string): {
  valid: boolean;
  unit: TimestampUnit | null;
} {
  const num = Number(value);
  if (isNaN(num) || value.trim() === "") {
    return { valid: false, unit: null };
  }

  // ミリ秒の典型的範囲: 1e12以上（2001年以降）
  if (Math.abs(num) > 1e12) {
    return { valid: true, unit: "milliseconds" };
  }

  return { valid: true, unit: "seconds" };
}

/**
 * 現在のタイムスタンプを取得する
 */
export function getCurrentTimestamp(unit: TimestampUnit): number {
  const now = Date.now();
  return unit === "seconds" ? Math.floor(now / 1000) : now;
}
