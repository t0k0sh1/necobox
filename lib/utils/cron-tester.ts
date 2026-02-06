/**
 * Cron式テスター ユーティリティ
 */

import { CronExpressionParser } from "cron-parser";

export type CronFormat = "standard" | "aws";

export interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

export interface AwsCronParts extends CronParts {
  year: string;
}

export interface CronFieldError {
  field: string;
  message: string;
}

export interface CronPreset {
  label: string;
  expression: string;
  i18nKey: string;
}

export const CRON_PRESETS: CronPreset[] = [
  { label: "Every Minute", expression: "* * * * *", i18nKey: "everyMinute" },
  { label: "Every Hour", expression: "0 * * * *", i18nKey: "everyHour" },
  {
    label: "Every Day at Midnight",
    expression: "0 0 * * *",
    i18nKey: "everyDay",
  },
  {
    label: "Every Monday at 9:00",
    expression: "0 9 * * 1",
    i18nKey: "everyWeekMonday",
  },
  {
    label: "1st of Every Month",
    expression: "0 0 1 * *",
    i18nKey: "everyMonth",
  },
  {
    label: "Weekdays at 9:00",
    expression: "0 9 * * 1-5",
    i18nKey: "everyWeekday",
  },
];

export const AWS_CRON_PRESETS: CronPreset[] = [
  { label: "Every Minute", expression: "* * * * ? *", i18nKey: "everyMinute" },
  { label: "Every Hour", expression: "0 * * * ? *", i18nKey: "everyHour" },
  {
    label: "Every Day at Midnight",
    expression: "0 0 * * ? *",
    i18nKey: "everyDay",
  },
  {
    label: "Every Monday at 9:00",
    expression: "0 9 ? * MON *",
    i18nKey: "everyWeekMonday",
  },
  {
    label: "1st of Every Month",
    expression: "0 0 1 * ? *",
    i18nKey: "everyMonth",
  },
  {
    label: "Weekdays at 9:00",
    expression: "0 9 ? * MON-FRI *",
    i18nKey: "everyWeekday",
  },
];

// AWS曜日名 → 数値のマッピング
const AWS_DAY_NAMES: Record<string, string> = {
  SUN: "0", MON: "1", TUE: "2", WED: "3", THU: "4", FRI: "5", SAT: "6",
};

/**
 * 標準Cron式（5フィールド）をパースする
 */
export function parseCron(expression: string): CronParts | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4],
  };
}

/**
 * AWS Cron式（6フィールド）をパースする
 */
export function parseAwsCron(expression: string): AwsCronParts | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 6) return null;

  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4],
    year: parts[5],
  };
}

/**
 * AWS Cron式を標準5フィールド形式に変換する（cron-parser に渡すため）
 * - `?` → `*` に変換
 * - 曜日名（MON, TUE 等）→ 数値に変換
 * - 年フィールドを除去
 */
function awsToStandard(expression: string): string {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 6) return expression;

  // 年フィールドを除去して5フィールドにする
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // ? → * に変換
  const normDom = dayOfMonth === "?" ? "*" : dayOfMonth;
  let normDow = dayOfWeek === "?" ? "*" : dayOfWeek;

  // AWS数値曜日（1=SUN...7=SAT）→ 標準数値曜日（0=SUN...6=SAT）に変換（名前変換より先に実行）
  normDow = normDow.replace(/\b([1-7])\b/g, (_, d) => String(parseInt(d) - 1));

  // 曜日名を数値に変換（範囲やリストにも対応）
  normDow = normDow.replace(/\b(SUN|MON|TUE|WED|THU|FRI|SAT)\b/g, (m) => AWS_DAY_NAMES[m] || m);

  return `${minute} ${hour} ${normDom} ${month} ${normDow}`;
}

/**
 * AWS Cron式のバリデーション固有ルール
 */
function validateAwsSpecific(expression: string): CronFieldError[] {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 6) {
    return [{ field: "minute", message: "AWS cron expression must have exactly 6 fields" }];
  }

  const errors: CronFieldError[] = [];
  const [, , dayOfMonth, , dayOfWeek] = parts;

  // 日と曜日のどちらか一方に ? が必要
  const domHasQ = dayOfMonth === "?";
  const dowHasQ = dayOfWeek === "?";

  if (!domHasQ && !dowHasQ) {
    errors.push({
      field: "dayOfMonth",
      message: "Either day-of-month or day-of-week must be '?'",
    });
  }
  if (domHasQ && dowHasQ) {
    errors.push({
      field: "dayOfMonth",
      message: "Only one of day-of-month or day-of-week can be '?'",
    });
  }

  return errors;
}

/**
 * Cron式をバリデーションする（フォーマット指定対応）
 */
export function validateCron(
  expression: string,
  format: CronFormat = "standard"
): {
  valid: boolean;
  errors: CronFieldError[];
} {
  if (format === "aws") {
    // AWS固有のバリデーション
    const awsErrors = validateAwsSpecific(expression);
    if (awsErrors.length > 0) {
      return { valid: false, errors: awsErrors };
    }

    // 標準形式に変換してcron-parserで検証
    const standard = awsToStandard(expression);
    try {
      CronExpressionParser.parse(standard);
      return { valid: true, errors: [] };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid cron expression";
      return { valid: false, errors: [{ field: "minute", message }] };
    }
  }

  // 標準形式
  const parts = parseCron(expression);
  if (!parts) {
    return {
      valid: false,
      errors: [{ field: "minute", message: "Cron expression must have exactly 5 fields" }],
    };
  }

  try {
    CronExpressionParser.parse(expression);
    return { valid: true, errors: [] };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid cron expression";
    return { valid: false, errors: [{ field: "minute", message }] };
  }
}

/**
 * 次回実行時刻を取得する（フォーマット指定対応）
 */
export function getNextExecutions(
  expression: string,
  count: number,
  from?: Date,
  format: CronFormat = "standard"
): Date[] {
  try {
    const expr = format === "aws" ? awsToStandard(expression) : expression;
    const options = from ? { currentDate: from } : {};
    const interval = CronExpressionParser.parse(expr, options);
    const dates: Date[] = [];

    for (let i = 0; i < count; i++) {
      const next = interval.next();
      dates.push(next.toDate());
    }

    return dates;
  } catch {
    return [];
  }
}

/**
 * Cron式を人間が読める説明文に変換する
 */
export function describeCron(
  parts: CronParts,
  locale: "en" | "ja"
): string {
  // ? を * として扱う（AWS形式対応）
  const normalize = (v: string) => (v === "?" ? "*" : v);
  const minute = normalize(parts.minute);
  const hour = normalize(parts.hour);
  const dayOfMonth = normalize(parts.dayOfMonth);
  const month = normalize(parts.month);
  let dayOfWeek = normalize(parts.dayOfWeek);

  // 曜日名を数値に変換
  dayOfWeek = dayOfWeek.replace(
    /\b(SUN|MON|TUE|WED|THU|FRI|SAT)\b/g,
    (m) => AWS_DAY_NAMES[m] || m
  );

  if (locale === "ja") {
    return describeCronJa(minute, hour, dayOfMonth, month, dayOfWeek);
  }
  return describeCronEn(minute, hour, dayOfMonth, month, dayOfWeek);
}

function describeCronEn(
  minute: string,
  hour: string,
  dayOfMonth: string,
  month: string,
  dayOfWeek: string
): string {
  const parts: string[] = [];

  // 毎分
  if (minute === "*" && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return "Every minute";
  }

  // 毎時
  if (minute !== "*" && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return `At minute ${minute} of every hour`;
  }

  // 時間指定
  if (hour !== "*" && minute !== "*") {
    parts.push(`At ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`);
  } else if (hour !== "*") {
    parts.push(`At hour ${hour}`);
  }

  // 曜日指定
  if (dayOfWeek !== "*") {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayStr = dayOfWeek.replace(/\d/g, (d) => days[parseInt(d) % 7] || d);
    parts.push(`on ${dayStr}`);
  }

  // 日指定
  if (dayOfMonth !== "*") {
    parts.push(`on day ${dayOfMonth} of the month`);
  }

  // 月指定
  if (month !== "*") {
    const months = ["", "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const monthStr = month.replace(/\d+/g, (m) => months[parseInt(m)] || m);
    parts.push(`in ${monthStr}`);
  }

  return parts.length > 0 ? parts.join(" ") : "Every minute";
}

function describeCronJa(
  minute: string,
  hour: string,
  dayOfMonth: string,
  month: string,
  dayOfWeek: string
): string {
  const parts: string[] = [];

  // 毎分
  if (minute === "*" && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return "毎分";
  }

  // 毎時
  if (minute !== "*" && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return `毎時${minute}分`;
  }

  // 月指定
  if (month !== "*") {
    const months = ["", "1月", "2月", "3月", "4月", "5月", "6月",
      "7月", "8月", "9月", "10月", "11月", "12月"];
    const monthStr = month.replace(/\d+/g, (m) => months[parseInt(m)] || m);
    parts.push(monthStr);
  }

  // 曜日指定
  if (dayOfWeek !== "*") {
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    const dayStr = dayOfWeek.replace(/\d/g, (d) => days[parseInt(d) % 7] || d);
    parts.push(`${dayStr}曜日`);
  }

  // 日指定
  if (dayOfMonth !== "*") {
    parts.push(`${dayOfMonth}日`);
  }

  // 時間指定
  if (hour !== "*") {
    parts.push(`${hour}時`);
  }

  if (minute !== "*") {
    parts.push(`${minute}分`);
  }

  if (parts.length === 0) return "毎分";

  return parts.join(" ") + "に実行";
}
