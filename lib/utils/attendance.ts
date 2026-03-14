/**
 * 勤怠管理 ビジネスロジック
 */

import JapaneseHolidays from "japanese-holidays";

// 日次勤怠データ
export interface DailyAttendance {
  date: string; // "YYYY-MM-DD"
  startTime: string | null; // "HH:mm" (null = 未入力)
  endTime: string | null; // "HH:mm"
  breakMinutes: number; // 休憩（分）、デフォルト60
  tasks: string[]; // 作業タスク名一覧
}

// 月の設定
export interface MonthSettings {
  defaultStartTime: string; // "09:00"
  defaultEndTime: string; // "18:00"
  defaultBreakMinutes: number; // 60
}

// 月次勤怠データ
export interface MonthlyAttendance {
  yearMonth: string; // "YYYY-MM"
  settings: MonthSettings;
  days: DailyAttendance[];
}

// 全体データ
export interface AttendanceData {
  months: Record<string, MonthlyAttendance>;
}

const STORAGE_KEY = "necobox-attendance";

/**
 * 旧データ（note フィールド）からの移行
 */
export function migrateDailyAttendance(day: Record<string, unknown>): DailyAttendance {
  if (Array.isArray(day.tasks)) {
    // TaskEntry 形式（{ task, status }）または string[] からの移行
    const tasks = (day.tasks as unknown[]).map((t) =>
      typeof t === "string" ? t : (t as { task?: string }).task ?? ""
    ).filter(Boolean);
    return {
      date: day.date as string,
      startTime: (day.startTime as string | null) ?? null,
      endTime: (day.endTime as string | null) ?? null,
      breakMinutes: typeof day.breakMinutes === "number" ? day.breakMinutes : 60,
      tasks,
    };
  }
  // 旧形式: note フィールドを tasks に変換
  const note = typeof day.note === "string" ? day.note : "";
  return {
    date: day.date as string,
    startTime: (day.startTime as string | null) ?? null,
    endTime: (day.endTime as string | null) ?? null,
    breakMinutes: typeof day.breakMinutes === "number" ? day.breakMinutes : 60,
    tasks: note ? [note] : [],
  };
}

/**
 * LocalStorageから勤怠データを読み込み（旧形式からの移行対応）
 */
export function loadAttendanceData(): AttendanceData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { months: Record<string, { yearMonth: string; settings: MonthSettings; days: Record<string, unknown>[] }> };
    // 各日のデータを移行
    for (const key of Object.keys(parsed.months)) {
      const month = parsed.months[key];
      month.days = month.days.map(migrateDailyAttendance) as unknown as Record<string, unknown>[];
    }
    return parsed as unknown as AttendanceData;
  } catch {
    return null;
  }
}

/**
 * LocalStorageに勤怠データを保存
 */
export function saveAttendanceData(data: AttendanceData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // LocalStorage容量超過等のエラーは握りつぶす（ブラウザ環境での制約）
  }
}

/**
 * 勤務時間を分単位で計算
 * 日跨ぎ対応: 終了時刻 < 開始時刻 なら +24h
 */
export function calcWorkMinutes(
  startTime: string,
  endTime: string,
  breakMinutes: number
): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startTotal = sh * 60 + sm;
  let endTotal = eh * 60 + em;
  if (endTotal < startTotal) {
    endTotal += 24 * 60;
  }
  const work = endTotal - startTotal - breakMinutes;
  return Math.max(0, work);
}

/**
 * 分を "H:mm" 形式にフォーマット
 */
export function formatWorkTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

/**
 * デフォルト設定を返す
 */
export function getDefaultSettings(): MonthSettings {
  return {
    defaultStartTime: "09:00",
    defaultEndTime: "18:00",
    defaultBreakMinutes: 60,
  };
}

/**
 * 土日判定
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * 日本の祝日判定（japanese-holidays ライブラリを使用）
 * 振替休日・国民の休日・春分/秋分の日を含む正確な判定
 */
export function isHoliday(date: Date): boolean {
  return JapaneseHolidays.isHoliday(date) !== undefined;
}

/**
 * 非営業日判定（土日 or 祝日）
 */
export function isNonBusinessDay(date: Date): boolean {
  return isWeekend(date) || isHoliday(date);
}

/**
 * 月の日数分の初期データを生成
 */
export function getDaysInMonth(
  year: number,
  month: number
): DailyAttendance[] {
  const daysCount = new Date(year, month, 0).getDate();
  const days: DailyAttendance[] = [];
  for (let d = 1; d <= daysCount; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({
      date: dateStr,
      startTime: null,
      endTime: null,
      breakMinutes: 60,
      tasks: [],
    });
  }
  return days;
}

// エクスポートデータ型
export interface AttendanceExportData {
  version: 1;
  exportedAt: string;
  data: AttendanceData;
}

const MAX_IMPORT_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * エクスポートデータのバリデーション
 */
export function validateAttendanceExportData(data: unknown): data is AttendanceExportData {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (obj.version !== 1) return false;
  if (typeof obj.exportedAt !== "string") return false;
  if (typeof obj.data !== "object" || obj.data === null) return false;
  const inner = obj.data as Record<string, unknown>;
  if (typeof inner.months !== "object" || inner.months === null) return false;
  const months = inner.months as Record<string, unknown>;
  for (const key of Object.keys(months)) {
    const month = months[key] as Record<string, unknown>;
    if (typeof month !== "object" || month === null) return false;
    if (typeof month.yearMonth !== "string") return false;
    if (typeof month.settings !== "object" || month.settings === null) return false;
    const s = month.settings as Record<string, unknown>;
    if (typeof s.defaultStartTime !== "string") return false;
    if (typeof s.defaultEndTime !== "string") return false;
    if (typeof s.defaultBreakMinutes !== "number") return false;
    if (!Array.isArray(month.days)) return false;
    for (const day of month.days as unknown[]) {
      if (typeof day !== "object" || day === null) return false;
      const d = day as Record<string, unknown>;
      if (typeof d.date !== "string") return false;
      if (d.startTime !== null && typeof d.startTime !== "string") return false;
      if (d.endTime !== null && typeof d.endTime !== "string") return false;
      // breakMinutes: number が望ましいが、旧形式では欠落しうるのでマイグレーションに任せる
      if (d.breakMinutes !== undefined && typeof d.breakMinutes !== "number") return false;
      // tasks: 旧形式（note, TaskEntry[]）もマイグレーションで対応するため、配列またはundefinedを許容
      if (d.tasks !== undefined && !Array.isArray(d.tasks)) return false;
    }
  }
  return true;
}

/**
 * 勤怠データをJSON文字列にエクスポート
 */
export function exportAttendanceData(data: AttendanceData): string {
  const exportData: AttendanceExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * 勤怠データをJSONファイルとしてダウンロード
 */
export function downloadAttendanceJson(data: AttendanceData): void {
  const json = exportAttendanceData(data);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * JSONファイルから勤怠データをインポート
 * 失敗時は null を返す
 */
export async function importAttendanceJson(file: File): Promise<AttendanceData | null> {
  if (file.size > MAX_IMPORT_SIZE) return null;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!validateAttendanceExportData(parsed)) return null;
    // 各日のデータをマイグレーション（旧形式対応）
    const importedData = parsed.data;
    for (const key of Object.keys(importedData.months)) {
      const month = importedData.months[key];
      month.days = (month.days as unknown as Record<string, unknown>[]).map(migrateDailyAttendance);
    }
    return importedData;
  } catch {
    return null;
  }
}

/**
 * 月合計を計算
 * - 入力済み日: 実際の値で計算
 * - 未入力の平日: 標準勤務時間で計算
 * - 土日祝: 入力がある場合のみ加算（未入力は0）
 */
export function calcMonthlyTotal(
  days: DailyAttendance[],
  settings: MonthSettings
): { businessDays: number; enteredDays: number; totalMinutes: number } {
  let businessDays = 0;
  let enteredDays = 0;
  let totalMinutes = 0;

  const defaultMinutes = calcWorkMinutes(
    settings.defaultStartTime,
    settings.defaultEndTime,
    settings.defaultBreakMinutes
  );

  for (const day of days) {
    const date = new Date(day.date + "T00:00:00");
    const nonBusiness = isNonBusinessDay(date);
    const hasEntry = day.startTime !== null && day.endTime !== null;

    if (!nonBusiness) {
      businessDays++;
    }

    if (hasEntry) {
      enteredDays++;
      totalMinutes += calcWorkMinutes(
        day.startTime!,
        day.endTime!,
        day.breakMinutes
      );
    } else if (!nonBusiness) {
      totalMinutes += defaultMinutes;
    }
  }

  return { businessDays, enteredDays, totalMinutes };
}

/**
 * 全月データからタスク名の候補一覧を収集
 */
export function collectTaskSuggestions(data: AttendanceData): string[] {
  const set = new Set<string>();
  for (const month of Object.values(data.months)) {
    for (const day of month.days) {
      for (const task of day.tasks) {
        if (task) set.add(task);
      }
    }
  }
  return [...set].sort();
}

/**
 * タスク集計: タスク名ごとの作業日数（日数降順）
 */
export function aggregateTaskCounts(days: DailyAttendance[]): { task: string; days: number }[] {
  const map = new Map<string, number>();
  for (const day of days) {
    const seen = new Set<string>();
    for (const task of day.tasks) {
      if (task && !seen.has(task)) {
        seen.add(task);
        map.set(task, (map.get(task) ?? 0) + 1);
      }
    }
  }
  return [...map.entries()]
    .map(([task, count]) => ({ task, days: count }))
    .sort((a, b) => b.days - a.days);
}

/**
 * 日別一覧: タスクがある日のみ抽出
 */
export function getDailyTaskList(days: DailyAttendance[]): { date: string; tasks: string[] }[] {
  return days
    .filter((day) => day.tasks.length > 0)
    .map((day) => ({ date: day.date, tasks: [...day.tasks] }));
}

/**
 * タスク期間: タスクごとの開始日〜終了日・出現日数（開始日昇順）
 */
export function getTaskPeriods(days: DailyAttendance[]): { task: string; startDate: string; endDate: string; days: number }[] {
  const map = new Map<string, { startDate: string; endDate: string; days: number }>();
  for (const day of days) {
    const seen = new Set<string>();
    for (const task of day.tasks) {
      if (!task || seen.has(task)) continue;
      seen.add(task);
      const existing = map.get(task);
      if (existing) {
        if (day.date < existing.startDate) existing.startDate = day.date;
        if (day.date > existing.endDate) existing.endDate = day.date;
        existing.days++;
      } else {
        map.set(task, { startDate: day.date, endDate: day.date, days: 1 });
      }
    }
  }
  return [...map.entries()]
    .map(([task, v]) => ({ task, ...v }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/**
 * 月内の最大タスク数を返す（最低1）
 */
export function getMaxTaskCount(days: DailyAttendance[]): number {
  let max = 0;
  for (const day of days) {
    if (day.tasks.length > max) max = day.tasks.length;
  }
  return Math.max(1, max);
}

/**
 * 月データを取得、なければ前月設定を引き継いで生成
 */
export function getOrCreateMonth(
  data: AttendanceData,
  yearMonth: string
): MonthlyAttendance {
  if (data.months[yearMonth]) {
    return data.months[yearMonth];
  }

  const [year, month] = yearMonth.split("-").map(Number);

  // 前月の設定を探す
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevKey = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
  const prevSettings = data.months[prevKey]?.settings ?? getDefaultSettings();

  const newMonth: MonthlyAttendance = {
    yearMonth,
    settings: { ...prevSettings },
    days: getDaysInMonth(year, month),
  };

  data.months[yearMonth] = newMonth;
  return newMonth;
}
