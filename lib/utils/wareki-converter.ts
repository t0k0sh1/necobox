/**
 * 西暦・和暦変換ユーティリティ
 * 明治元年(1868年1月25日)以降の日付を対応
 */

// 元号定義
export interface Era {
  name: string; // 明治, 大正, 昭和, 平成, 令和
  nameEn: string; // Meiji, Taisho, Showa, Heisei, Reiwa
  abbr: string; // M, T, S, H, R
  startDate: Date; // 元号開始日
  endDate: Date | null; // 元号終了日 (現在の元号はnull)
}

// 変換結果
export interface ConversionResult {
  success: boolean;
  errorKey?: string; // 国際化用エラーキー
  errorParams?: Record<string, string | number>; // エラーメッセージのパラメータ
  // 西暦情報
  gregorian?: {
    year: number;
    month: number;
    day: number;
    weekday: number; // 0=日曜日, 1=月曜日, ...
  };
  // 和暦情報
  wareki?: {
    era: Era;
    year: number; // 元号の年
    month: number;
    day: number;
    formatted: string; // 例: "令和7年2月5日"
    formattedEn: string; // 例: "Reiwa 7, February 5"
  };
}

// 月の英語名
export const MONTH_NAMES_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

// 月の英語名を取得
export function getMonthNameEn(month: number): string {
  if (month < 1 || month > 12) {
    return "";
  }
  return MONTH_NAMES_EN[month - 1];
}

// 元号データ (新しい順)
export const ERAS: Era[] = [
  {
    name: "令和",
    nameEn: "Reiwa",
    abbr: "R",
    startDate: new Date(2019, 4, 1), // 2019年5月1日
    endDate: null,
  },
  {
    name: "平成",
    nameEn: "Heisei",
    abbr: "H",
    startDate: new Date(1989, 0, 8), // 1989年1月8日
    endDate: new Date(2019, 3, 30), // 2019年4月30日
  },
  {
    name: "昭和",
    nameEn: "Showa",
    abbr: "S",
    startDate: new Date(1926, 11, 25), // 1926年12月25日
    endDate: new Date(1989, 0, 7), // 1989年1月7日
  },
  {
    name: "大正",
    nameEn: "Taisho",
    abbr: "T",
    startDate: new Date(1912, 6, 30), // 1912年7月30日
    endDate: new Date(1926, 11, 24), // 1926年12月24日
  },
  {
    name: "明治",
    nameEn: "Meiji",
    abbr: "M",
    startDate: new Date(1868, 0, 25), // 1868年1月25日
    endDate: new Date(1912, 6, 29), // 1912年7月29日
  },
];

/**
 * 元号一覧を取得
 */
export function getEras(): Era[] {
  return ERAS;
}

/**
 * 元号名から元号を取得
 */
export function getEraByName(name: string): Era | undefined {
  return ERAS.find(
    (era) =>
      era.name === name ||
      era.nameEn.toLowerCase() === name.toLowerCase() ||
      era.abbr.toLowerCase() === name.toLowerCase()
  );
}

/**
 * 日付が有効かどうかをチェック
 */
export function isValidDate(year: number, month: number, day: number): boolean {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }
  if (month < 1 || month > 12) {
    return false;
  }
  if (day < 1 || day > 31) {
    return false;
  }

  // 月の日数チェック
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) {
    return false;
  }

  return true;
}

/**
 * 和暦の日付が有効かどうかをチェック
 */
export function isValidWarekiDate(
  eraName: string,
  year: number,
  month: number,
  day: number
): { valid: boolean; errorKey?: string; errorParams?: Record<string, string | number> } {
  const era = getEraByName(eraName);
  if (!era) {
    return { valid: false, errorKey: "invalidEra" };
  }

  if (year < 1) {
    return {
      valid: false,
      errorKey: "eraYearOutOfRange",
      errorParams: { era: era.name, year },
    };
  }

  // 元号の年から西暦を計算
  const startYear = era.startDate.getFullYear();
  const gregorianYear = startYear + year - 1;

  // 日付が有効かチェック
  if (!isValidDate(gregorianYear, month, day)) {
    return { valid: false, errorKey: "invalidDate" };
  }

  // 日付オブジェクトを作成
  const date = new Date(gregorianYear, month - 1, day);

  // 元号の範囲内かチェック
  if (date < era.startDate) {
    return {
      valid: false,
      errorKey: "eraYearOutOfRange",
      errorParams: { era: era.name, year },
    };
  }

  if (era.endDate && date > era.endDate) {
    return {
      valid: false,
      errorKey: "eraYearOutOfRange",
      errorParams: { era: era.name, year },
    };
  }

  return { valid: true };
}

/**
 * 日付から元号を特定
 */
function getEraForDate(date: Date): Era | undefined {
  for (const era of ERAS) {
    if (date >= era.startDate && (era.endDate === null || date <= era.endDate)) {
      return era;
    }
  }
  return undefined;
}

/**
 * 西暦から和暦に変換
 */
export function gregorianToWareki(
  year: number,
  month: number,
  day: number
): ConversionResult {
  // 日付の妥当性チェック
  if (!isValidDate(year, month, day)) {
    return {
      success: false,
      errorKey: "invalidDate",
    };
  }

  const date = new Date(year, month - 1, day);

  // 明治元年以前はエラー
  const meijiStart = ERAS[ERAS.length - 1].startDate;
  if (date < meijiStart) {
    return {
      success: false,
      errorKey: "dateOutOfRange",
    };
  }

  // 元号を特定
  const era = getEraForDate(date);
  if (!era) {
    return {
      success: false,
      errorKey: "dateOutOfRange",
    };
  }

  // 和暦の年を計算
  const warekiYear = year - era.startDate.getFullYear() + 1;

  return {
    success: true,
    gregorian: {
      year,
      month,
      day,
      weekday: date.getDay(),
    },
    wareki: {
      era,
      year: warekiYear,
      month,
      day,
      formatted: `${era.name}${warekiYear}年${month}月${day}日`,
      formattedEn: `${era.nameEn} ${warekiYear}, ${getMonthNameEn(month)} ${day}`,
    },
  };
}

/**
 * 和暦から西暦に変換
 */
export function warekiToGregorian(
  eraName: string,
  year: number,
  month: number,
  day: number
): ConversionResult {
  // 和暦日付の妥当性チェック
  const validation = isValidWarekiDate(eraName, year, month, day);
  if (!validation.valid) {
    return {
      success: false,
      errorKey: validation.errorKey,
      errorParams: validation.errorParams,
    };
  }

  const era = getEraByName(eraName)!;

  // 西暦年を計算
  const gregorianYear = era.startDate.getFullYear() + year - 1;
  const date = new Date(gregorianYear, month - 1, day);

  return {
    success: true,
    gregorian: {
      year: gregorianYear,
      month,
      day,
      weekday: date.getDay(),
    },
    wareki: {
      era,
      year,
      month,
      day,
      formatted: `${era.name}${year}年${month}月${day}日`,
      formattedEn: `${era.nameEn} ${year}, ${getMonthNameEn(month)} ${day}`,
    },
  };
}

/**
 * 曜日の日本語名を取得
 */
export function getWeekdayNameJa(weekday: number): string {
  const weekdayNames = ["日", "月", "火", "水", "木", "金", "土"];
  // 防御的な範囲チェック
  if (weekday < 0 || weekday > 6) {
    return "";
  }
  return weekdayNames[weekday];
}

/**
 * 曜日の英語名を取得
 */
export function getWeekdayNameEn(weekday: number): string {
  const weekdayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  // 防御的な範囲チェック
  if (weekday < 0 || weekday > 6) {
    return "";
  }
  return weekdayNames[weekday];
}
