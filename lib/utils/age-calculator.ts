/**
 * 年齢計算ユーティリティ
 * 生年月日から現在の年齢、今年の誕生日を迎えた時の年齢を計算
 * 西暦・和暦の両方に対応
 */

import { ERAS, getEraByName, isValidDate, type Era } from "./wareki-converter";

/**
 * 月の英語名（共有定数）
 */
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

/**
 * 日付から時刻成分を除去して正規化（日付のみの比較用）
 */
function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// 年齢計算結果
export interface AgeCalculationResult {
  success: boolean;
  errorKey?: string;
  errorParams?: Record<string, string | number>;
  // 計算結果
  birthDate?: {
    year: number;
    month: number;
    day: number;
    // 和暦
    wareki?: {
      era: Era;
      year: number;
      formatted: string;
      formattedEn: string;
    };
  };
  // 今日時点の年齢
  currentAge?: {
    years: number;
    months: number;
    days: number;
  };
  // 今年の誕生日を迎えた時の年齢
  ageThisYear?: number;
  // 今年の誕生日
  birthdayThisYear?: {
    date: Date;
    isPast: boolean;
  };
  // 次の誕生日までの日数
  daysUntilNextBirthday?: number;
}

/**
 * 2つの日付間の年齢を計算（年、月、日）
 */
export function calculateAgeDetails(
  birthDate: Date,
  targetDate: Date
): { years: number; months: number; days: number } {
  let years = targetDate.getFullYear() - birthDate.getFullYear();
  let months = targetDate.getMonth() - birthDate.getMonth();
  let days = targetDate.getDate() - birthDate.getDate();

  // 日がマイナスの場合、前月の日数を加算
  if (days < 0) {
    months--;
    const prevMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
    days += prevMonth.getDate();
  }

  // 月がマイナスの場合、年から1引く
  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
}

/**
 * 次の誕生日までの日数を計算
 */
export function calculateDaysUntilNextBirthday(
  birthMonth: number,
  birthDay: number,
  today: Date = new Date()
): number {
  // 日付のみで比較するため時刻成分を除去
  const todayNormalized = normalizeDate(today);
  const thisYear = todayNormalized.getFullYear();
  
  // 今年の誕生日
  let nextBirthday = new Date(thisYear, birthMonth - 1, birthDay);
  
  // 誕生日が2月29日の場合は、閏年でなければ3月1日とする
  if (birthMonth === 2 && birthDay === 29) {
    const daysInFeb = new Date(thisYear, 2, 0).getDate();
    if (daysInFeb < 29) {
      nextBirthday = new Date(thisYear, 2, 1); // 3月1日
    }
  }
  
  // 今年の誕生日がすでに過ぎている場合は来年の誕生日を計算
  if (nextBirthday.getTime() < todayNormalized.getTime()) {
    nextBirthday = new Date(thisYear + 1, birthMonth - 1, birthDay);
    // 来年の誕生日が2月29日の場合も閏年チェック
    if (birthMonth === 2 && birthDay === 29) {
      const daysInFebNextYear = new Date(thisYear + 1, 2, 0).getDate();
      if (daysInFebNextYear < 29) {
        nextBirthday = new Date(thisYear + 1, 2, 1); // 3月1日
      }
    }
  }
  
  // 日数を計算
  const diffTime = nextBirthday.getTime() - todayNormalized.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
 * 月の英語名を取得
 */
export function getMonthNameEn(month: number): string {
  if (month < 1 || month > 12) {
    return "";
  }
  return MONTH_NAMES_EN[month - 1];
}

/**
 * 西暦の生年月日から年齢を計算
 */
export function calculateAgeFromGregorian(
  year: number,
  month: number,
  day: number,
  today: Date = new Date()
): AgeCalculationResult {
  // 日付の妥当性チェック
  if (!isValidDate(year, month, day)) {
    return {
      success: false,
      errorKey: "invalidDate",
    };
  }

  const birthDate = new Date(year, month - 1, day);
  
  // 明治元年以前はエラー
  const meijiStart = ERAS[ERAS.length - 1].startDate;
  if (birthDate < meijiStart) {
    return {
      success: false,
      errorKey: "dateOutOfRange",
    };
  }

  // 未来の日付はエラー
  if (birthDate > today) {
    return {
      success: false,
      errorKey: "futureDateError",
    };
  }

  // 和暦を計算
  const era = getEraForDate(birthDate);
  let warekiInfo:
    | {
        era: Era;
        year: number;
        formatted: string;
        formattedEn: string;
      }
    | undefined;

  if (era) {
    const warekiYear = year - era.startDate.getFullYear() + 1;
    warekiInfo = {
      era,
      year: warekiYear,
      formatted: `${era.name}${warekiYear}年${month}月${day}日`,
      formattedEn: `${era.nameEn} ${warekiYear}, ${getMonthNameEn(month)} ${day}`,
    };
  }

  // 現在の年齢を計算
  const currentAge = calculateAgeDetails(birthDate, today);

  // 今年の誕生日
  const thisYear = today.getFullYear();
  let birthdayThisYear = new Date(thisYear, month - 1, day);
  
  // 2月29日生まれで閏年でない場合は3月1日
  if (month === 2 && day === 29) {
    const daysInFeb = new Date(thisYear, 2, 0).getDate();
    if (daysInFeb < 29) {
      birthdayThisYear = new Date(thisYear, 2, 1);
    }
  }
  
  // 「過去かどうか」の判定は日付のみを比較する（時刻成分は無視）
  const todayDateOnly = normalizeDate(today);
  const isPast = birthdayThisYear.getTime() < todayDateOnly.getTime();

  // 今年の誕生日を迎えた時の年齢
  const ageThisYear = thisYear - year;

  // 次の誕生日までの日数
  const daysUntilNextBirthday = calculateDaysUntilNextBirthday(month, day, today);

  return {
    success: true,
    birthDate: {
      year,
      month,
      day,
      wareki: warekiInfo,
    },
    currentAge,
    ageThisYear,
    birthdayThisYear: {
      date: birthdayThisYear,
      isPast,
    },
    daysUntilNextBirthday,
  };
}

/**
 * 和暦の生年月日から年齢を計算
 */
export function calculateAgeFromWareki(
  eraName: string,
  year: number,
  month: number,
  day: number,
  today: Date = new Date()
): AgeCalculationResult {
  const era = getEraByName(eraName);
  if (!era) {
    return {
      success: false,
      errorKey: "invalidEra",
    };
  }

  if (year < 1) {
    return {
      success: false,
      errorKey: "eraYearOutOfRange",
      errorParams: { era: era.name, year },
    };
  }

  // 西暦年を計算
  const gregorianYear = era.startDate.getFullYear() + year - 1;

  // 日付の妥当性チェック
  if (!isValidDate(gregorianYear, month, day)) {
    return {
      success: false,
      errorKey: "invalidDate",
    };
  }

  const birthDate = new Date(gregorianYear, month - 1, day);

  // 元号の範囲内かチェック
  if (birthDate < era.startDate) {
    return {
      success: false,
      errorKey: "eraYearOutOfRange",
      errorParams: { era: era.name, year },
    };
  }

  if (era.endDate && birthDate > era.endDate) {
    return {
      success: false,
      errorKey: "eraYearOutOfRange",
      errorParams: { era: era.name, year },
    };
  }

  // 未来の日付はエラー
  if (birthDate > today) {
    return {
      success: false,
      errorKey: "futureDateError",
    };
  }

  // 現在の年齢を計算
  const currentAge = calculateAgeDetails(birthDate, today);

  // 今年の誕生日
  const thisYear = today.getFullYear();
  let birthdayThisYear = new Date(thisYear, month - 1, day);
  
  // 2月29日生まれで閏年でない場合は3月1日
  if (month === 2 && day === 29) {
    const daysInFeb = new Date(thisYear, 2, 0).getDate();
    if (daysInFeb < 29) {
      birthdayThisYear = new Date(thisYear, 2, 1);
    }
  }
  
  // 「過去かどうか」の判定は日付のみを比較する（時刻成分は無視）
  const todayDateOnly = normalizeDate(today);
  const isPast = birthdayThisYear.getTime() < todayDateOnly.getTime();

  // 今年の誕生日を迎えた時の年齢
  const ageThisYear = thisYear - gregorianYear;

  // 次の誕生日までの日数
  const daysUntilNextBirthday = calculateDaysUntilNextBirthday(month, day, today);

  return {
    success: true,
    birthDate: {
      year: gregorianYear,
      month,
      day,
      wareki: {
        era,
        year,
        formatted: `${era.name}${year}年${month}月${day}日`,
        formattedEn: `${era.nameEn} ${year}, ${getMonthNameEn(month)} ${day}`,
      },
    },
    currentAge,
    ageThisYear,
    birthdayThisYear: {
      date: birthdayThisYear,
      isPast,
    },
    daysUntilNextBirthday,
  };
}
