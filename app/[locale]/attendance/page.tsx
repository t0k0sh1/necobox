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
  type AttendanceData,
  type MonthSettings,
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
    const stored = loadAttendanceData();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回マウント時のみの初期化で意図的に使用
    setState({
      data: stored ?? { months: {} },
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      loaded: true,
    });
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

  // 月データを確実に取得する
  const ensureMonthData = useCallback(
    (targetYearMonth: string): AttendanceData => {
      if (data.months[targetYearMonth]) return data;
      const newData: AttendanceData = { months: { ...data.months } };
      getOrCreateMonth(newData, targetYearMonth);
      return newData;
    },
    [data]
  );

  if (loaded) {
    const dataWithMonth = ensureMonthData(yearMonth);
    if (dataWithMonth !== data) {
      setData(dataWithMonth);
    }
  }

  // オートコンプリート候補を全月データから収集
  const taskSuggestions = useMemo(() => collectTaskSuggestions(data), [data]);

  if (!loaded) return null;

  const currentMonth = data.months[yearMonth]!;

  // 月切り替え
  const handlePrevMonth = () => {
    setState((prev) =>
      prev.month === 1
        ? { ...prev, year: prev.year - 1, month: 12 }
        : { ...prev, month: prev.month - 1 }
    );
  };

  const handleNextMonth = () => {
    setState((prev) =>
      prev.month === 12
        ? { ...prev, year: prev.year + 1, month: 1 }
        : { ...prev, month: prev.month + 1 }
    );
  };

  // 日データ更新（時刻・休憩フィールド）
  const handleUpdateDay = (
    date: string,
    field: "startTime" | "endTime" | "breakMinutes",
    value: string | number | null
  ) => {
    setData((prev) => {
      const monthData = prev.months[yearMonth];
      if (!monthData) return prev;
      const newDays = monthData.days.map((d) =>
        d.date === date ? { ...d, [field]: value } : d
      );
      return {
        months: {
          ...prev.months,
          [yearMonth]: { ...monthData, days: newDays },
        },
      };
    });
  };

  // タスク一覧更新
  const handleUpdateTasks = (date: string, tasks: string[]) => {
    setData((prev) => {
      const monthData = prev.months[yearMonth];
      if (!monthData) return prev;
      const newDays = monthData.days.map((d) =>
        d.date === date ? { ...d, tasks } : d
      );
      return {
        months: {
          ...prev.months,
          [yearMonth]: { ...monthData, days: newDays },
        },
      };
    });
  };

  // 設定保存
  const handleSaveSettings = (settings: MonthSettings) => {
    setData((prev) => {
      const monthData = prev.months[yearMonth];
      if (!monthData) return prev;
      return {
        months: {
          ...prev.months,
          [yearMonth]: { ...monthData, settings },
        },
      };
    });
  };

  const summary = calcMonthlyTotal(currentMonth.days, currentMonth.settings);

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
