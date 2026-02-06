"use client";

import * as React from "react";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { getEras, type Era } from "@/lib/utils/wareki-converter";

// 年の範囲（西暦）
const MIN_GREGORIAN_YEAR = 1868;
const MAX_GREGORIAN_YEAR = 2050;

/**
 * 現在の元号に対して、何年先まで選択可能にするかのバッファ。
 *
 * 注意:
 * - この値は「現在の元号が少なくともこの年数は続く」と仮定して UI 上の選択範囲を広げるためのものです。
 * - 将来、元号がこのバッファ年数よりも早く切り替わった場合、
 *   実際には存在しない「元号＋年」の組み合わせが UI 上で選択できてしまう可能性があります。
 * - 厳密な元号の有効範囲チェックは、別途バリデーション（例: サーバーサイドや保存時の検証）で行ってください。
 * - 新しい元号が告示された際や要件が変わった際には、この値と関連ロジックの見直しが必要です。
 */
const FUTURE_YEARS_BUFFER = 30;

// 月の範囲
const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

/**
 * 指定された年月の日数を取得
 */
function getDaysInMonth(year: number, month: number): number {
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    // 無効な入力時は保守的なデフォルト値を返し、存在しない日付（例: 2月31日）の選択を防ぐ
    return 28;
  }
  return new Date(year, month, 0).getDate();
}

/**
 * 西暦年のオプションを生成
 */
function generateGregorianYearOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let y = MAX_GREGORIAN_YEAR; y >= MIN_GREGORIAN_YEAR; y--) {
    options.push({ value: String(y), label: String(y) });
  }
  return options;
}

/**
 * 日のオプションを生成
 */
function generateDayOptions(
  maxDays: number
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let d = 1; d <= maxDays; d++) {
    options.push({ value: String(d), label: String(d) });
  }
  return options;
}

/**
 * 和暦年のオプションを生成（元号の有効範囲内）
 */
function generateWarekiYearOptions(
  era: Era | undefined,
  currentYear: number
): { value: string; label: string }[] {
  if (!era) return [];

  const startYear = era.startDate.getFullYear();
  const endYear = era.endDate
    ? era.endDate.getFullYear()
    : currentYear + FUTURE_YEARS_BUFFER; // 現在の元号は未来も含める

  const maxWarekiYear = endYear - startYear + 1;
  const options: { value: string; label: string }[] = [];
  for (let y = 1; y <= maxWarekiYear; y++) {
    options.push({ value: String(y), label: String(y) });
  }
  return options;
}

interface GregorianDateInputProps {
  year: string;
  month: string;
  day: string;
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onDayChange: (value: string) => void;
  yearLabel: string;
  monthLabel: string;
  dayLabel: string;
  yearId?: string;
  monthId?: string;
  dayId?: string;
}

/**
 * 西暦日付入力コンポーネント
 */
export function GregorianDateInput({
  year,
  month,
  day,
  onYearChange,
  onMonthChange,
  onDayChange,
  yearLabel,
  monthLabel,
  dayLabel,
  yearId = "g-year",
  monthId = "g-month",
  dayId = "g-day",
}: GregorianDateInputProps) {
  // 年と月から日数を計算
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  const daysInMonth = getDaysInMonth(yearNum, monthNum);

  // 日のオプション
  const dayOptions = React.useMemo(
    () => generateDayOptions(daysInMonth),
    [daysInMonth]
  );

  // 年のオプション（メモ化）
  const yearOptions = React.useMemo(() => generateGregorianYearOptions(), []);

  return (
    <div className="grid grid-cols-3 gap-2">
      <div>
        <Label htmlFor={yearId}>{yearLabel}</Label>
        <Combobox
          id={yearId}
          value={year}
          onChange={onYearChange}
          options={yearOptions}
          placeholder="2025"
          type="number"
          min={MIN_GREGORIAN_YEAR}
          max={MAX_GREGORIAN_YEAR}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={monthId}>{monthLabel}</Label>
        <Combobox
          id={monthId}
          value={month}
          onChange={onMonthChange}
          options={MONTHS}
          placeholder="1"
          type="number"
          min={1}
          max={12}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={dayId}>{dayLabel}</Label>
        <Combobox
          id={dayId}
          value={day}
          onChange={onDayChange}
          options={dayOptions}
          placeholder="1"
          type="number"
          min={1}
          max={daysInMonth}
          className="mt-1"
        />
      </div>
    </div>
  );
}

interface WarekiDateInputProps {
  selectedEra: string;
  year: string;
  month: string;
  day: string;
  onEraChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onDayChange: (value: string) => void;
  eraLabel: string;
  yearLabel: string;
  monthLabel: string;
  dayLabel: string;
  locale: string;
  eraId?: string;
  yearId?: string;
  monthId?: string;
  dayId?: string;
}

/**
 * 和暦日付入力コンポーネント
 */
export function WarekiDateInput({
  selectedEra,
  year,
  month,
  day,
  onEraChange,
  onYearChange,
  onMonthChange,
  onDayChange,
  eraLabel,
  yearLabel,
  monthLabel,
  dayLabel,
  locale,
  eraId = "era-select",
  yearId = "w-year",
  monthId = "w-month",
  dayId = "w-day",
}: WarekiDateInputProps) {
  // 元号一覧を取得
  const eras = React.useMemo(() => getEras(), []);

  // 選択中の元号を取得
  const currentEra = React.useMemo(
    () => eras.find((e) => e.name === selectedEra),
    [eras, selectedEra]
  );

  // 現在の年を一度だけ取得
  const currentYear = React.useMemo(() => new Date().getFullYear(), []);

  // 和暦年のオプション
  const warekiYearOptions = React.useMemo(
    () => generateWarekiYearOptions(currentEra, currentYear),
    [currentEra, currentYear]
  );

  // 元号のオプション
  const eraOptions = React.useMemo(
    () =>
      eras.map((era) => ({
        value: era.name,
        label: locale === "ja" ? era.name : era.nameEn,
      })),
    [eras, locale]
  );

  // 和暦年から西暦年を計算
  const yearNum = parseInt(year);
  const gregorianYear = currentEra
    ? currentEra.startDate.getFullYear() + yearNum - 1
    : NaN;
  const monthNum = parseInt(month);
  const daysInMonth = getDaysInMonth(gregorianYear, monthNum);

  // 日のオプション
  const dayOptions = React.useMemo(
    () => generateDayOptions(daysInMonth),
    [daysInMonth]
  );

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={eraId}>{eraLabel}</Label>
        <Combobox
          id={eraId}
          value={selectedEra}
          onChange={onEraChange}
          options={eraOptions}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label htmlFor={yearId}>{yearLabel}</Label>
          <Combobox
            id={yearId}
            value={year}
            onChange={onYearChange}
            options={warekiYearOptions}
            placeholder="1"
            type="number"
            min={1}
            max={
              warekiYearOptions.length > 0
                ? Number(warekiYearOptions[warekiYearOptions.length - 1].value)
                : undefined
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={monthId}>{monthLabel}</Label>
          <Combobox
            id={monthId}
            value={month}
            onChange={onMonthChange}
            options={MONTHS}
            placeholder="1"
            type="number"
            min={1}
            max={12}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={dayId}>{dayLabel}</Label>
          <Combobox
            id={dayId}
            value={day}
            onChange={onDayChange}
            options={dayOptions}
            placeholder="1"
            type="number"
            min={1}
            max={daysInMonth}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}
