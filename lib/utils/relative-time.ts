// 相対時刻フォーマット
// Intl.RelativeTimeFormat を使用して「2分前」のような相対時刻を返す
export function formatRelativeTime(date: Date, locale?: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale || "en", {
    numeric: "auto",
  });

  if (diffSeconds < 60) {
    return rtf.format(-diffSeconds, "second");
  } else if (diffMinutes < 60) {
    return rtf.format(-diffMinutes, "minute");
  } else if (diffHours < 24) {
    return rtf.format(-diffHours, "hour");
  } else {
    return rtf.format(-diffDays, "day");
  }
}
