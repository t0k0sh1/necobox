"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AttendanceHeader } from "@/app/components/attendance/AttendanceHeader";
import { AttendanceTable } from "@/app/components/attendance/AttendanceTable";
import { MonthSettingsDialog } from "@/app/components/attendance/MonthSettingsDialog";
import {
  loadAttendanceData,
  saveAttendanceData,
  getOrCreateMonth,
  calcMonthlyTotal,
  collectTaskSuggestions,
  getDefaultSettings,
  getDaysInMonth,
  type AttendanceData,
  type MonthSettings,
  type MonthlyAttendance,
} from "@/lib/utils/attendance";

// 勤怠管理ページ
export default function AttendancePage() {
  const t = useTranslations("attendanceTracker");

  interface PageState {
    data: AttendanceData;
    year: number;
    month: number;
    loaded: boolean;
  }
  const [state, setState] = useState<PageState>({
    data: { months: {} },
    year: 2000,
    month: 1,
    loaded: false,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isInitialLoad = useRef(true);

  const { data, year, month, loaded } = state;
  const setData = useCallback(
    (updater: AttendanceData | ((prev: AttendanceData) => AttendanceData)) => {
      setState((prev) => ({
        ...prev,
        data: typeof updater === "function" ? updater(prev.data) : updater,
      }));
    },
    []
  );

  // クライアントサイドでのみ LocalStorage 読み込みと日付初期化
  useEffect(() => {
    const now = new Date();
    const stored = loadAttendanceData() ?? { months: {} };
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    // 初期表示月のデータを確実に生成
    const ym = `${y}-${String(m).padStart(2, "0")}`;
    getOrCreateMonth(stored, ym);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回マウント時のみの初期化で意図的に使用
    setState({ data: stored, year: y, month: m, loaded: true });
  }, []);

  // データ変更時に保存（初回ロード完了後のみ）
  useEffect(() => {
    if (!loaded) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    saveAttendanceData(data);
  }, [data, loaded]);

  // 現在月のキー
  const yearMonth = `${year}-${String(month).padStart(2, "0")}`;

  // 月データを useMemo で導出（存在しない月はデフォルト値を返す）
  const currentMonth: MonthlyAttendance = useMemo(() => {
    if (data.months[yearMonth]) return data.months[yearMonth];
    return {
      yearMonth,
      settings: getDefaultSettings(),
      days: getDaysInMonth(year, month),
    };
  }, [data, yearMonth, year, month]);

  // 月切り替え時に月データを確保するヘルパー
  const ensureMonthExists = useCallback(
    (targetYearMonth: string) => {
      setData((prev) => {
        if (prev.months[targetYearMonth]) return prev;
        const newData: AttendanceData = { months: { ...prev.months } };
        getOrCreateMonth(newData, targetYearMonth);
        return newData;
      });
    },
    [setData]
  );

  // 月データを確保してから更新するヘルパー
  const updateMonthData = useCallback(
    (updater: (monthData: MonthlyAttendance) => MonthlyAttendance) => {
      setData((prev) => {
        let ensured = prev;
        if (!ensured.months[yearMonth]) {
          ensured = { months: { ...ensured.months } };
          getOrCreateMonth(ensured, yearMonth);
        }
        const monthData = ensured.months[yearMonth];
        return {
          months: {
            ...ensured.months,
            [yearMonth]: updater(monthData),
          },
        };
      });
    },
    [setData, yearMonth]
  );

  // オートコンプリート候補を全月データから収集
  const taskSuggestions = useMemo(() => collectTaskSuggestions(data), [data]);

  const summary = useMemo(
    () => calcMonthlyTotal(currentMonth.days, currentMonth.settings),
    [currentMonth]
  );

  if (!loaded) return null;

  // 月切り替え
  const handlePrevMonth = () => {
    const newMonth = month === 1 ? 12 : month - 1;
    const newYear = month === 1 ? year - 1 : year;
    const ym = `${newYear}-${String(newMonth).padStart(2, "0")}`;
    setState((prev) => ({ ...prev, year: newYear, month: newMonth }));
    ensureMonthExists(ym);
  };

  const handleNextMonth = () => {
    const newMonth = month === 12 ? 1 : month + 1;
    const newYear = month === 12 ? year + 1 : year;
    const ym = `${newYear}-${String(newMonth).padStart(2, "0")}`;
    setState((prev) => ({ ...prev, year: newYear, month: newMonth }));
    ensureMonthExists(ym);
  };

  // 日データ更新（時刻・休憩フィールド）
  const handleUpdateDay = (
    date: string,
    field: "startTime" | "endTime" | "breakMinutes",
    value: string | number | null
  ) => {
    updateMonthData((monthData) => ({
      ...monthData,
      days: monthData.days.map((d) =>
        d.date === date ? { ...d, [field]: value } : d
      ),
    }));
  };

  // タスク一覧更新
  const handleUpdateTasks = (date: string, tasks: string[]) => {
    updateMonthData((monthData) => ({
      ...monthData,
      days: monthData.days.map((d) =>
        d.date === date ? { ...d, tasks } : d
      ),
    }));
  };

  // 設定保存
  const handleSaveSettings = (settings: MonthSettings) => {
    updateMonthData((monthData) => ({ ...monthData, settings }));
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-64px-48px)]">
      <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
      <div className="container mx-auto px-4">
        <AttendanceHeader
          year={year}
          month={month}
          summary={summary}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-auto container mx-auto px-4">
        <AttendanceTable
          days={currentMonth.days}
          settings={currentMonth.settings}
          year={year}
          month={month}
          taskSuggestions={taskSuggestions}
          onUpdateDay={handleUpdateDay}
          onUpdateTasks={handleUpdateTasks}
        />
      </div>
      <MonthSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={currentMonth.settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
