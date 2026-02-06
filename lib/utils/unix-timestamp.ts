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
export function formatDate(date: Date, locale?: string): FormattedDate {
  if (isNaN(date.getTime())) {
    return { local: "Invalid Date", utc: "Invalid Date", iso8601: "Invalid Date", relative: "Invalid Date" };
  }

  const displayLocale = locale || "ja-JP";

  const local = date.toLocaleString(displayLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const utc = date.toLocaleString(displayLocale, {
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
  const relative = getRelativeTime(date, locale);

  return { local, utc, iso8601, relative };
}

/**
 * 相対時間文字列を取得する
 */
function getRelativeTime(date: Date, locale?: string): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const absDiff = Math.abs(diff);
  const isPast = diff > 0;

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);

  let value: number;
  let unit: Intl.RelativeTimeFormatUnit;

  if (seconds < 60) {
    value = seconds;
    unit = "second";
  } else if (minutes < 60) {
    value = minutes;
    unit = "minute";
  } else if (hours < 24) {
    value = hours;
    unit = "hour";
  } else if (days < 365) {
    value = days;
    unit = "day";
  } else {
    value = years;
    unit = "year";
  }

  const rtf = new Intl.RelativeTimeFormat(locale || undefined, { numeric: "always" });
  const signedValue = isPast ? -value : value;
  return rtf.format(signedValue, unit);
}

/**
 * タイムスタンプの妥当性と単位を判定する
 */
export function isValidTimestamp(value: string): {
  valid: boolean;
  unit: TimestampUnit | null;
} {
  const num = Number(value);
  const trimmed = value.trim();
  if (isNaN(num) || trimmed === "") {
    return { valid: false, unit: null };
  }

  // 桁数で秒/ミリ秒を推定（12桁以上ならミリ秒）
  const normalized = trimmed.replace(/^[-+]/, "");
  const digitsOnly = normalized.replace(/\D/g, "");

  if (digitsOnly.length >= 12) {
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
