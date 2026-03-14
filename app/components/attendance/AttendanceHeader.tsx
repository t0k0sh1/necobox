"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWorkTime } from "@/lib/utils/attendance";

interface AttendanceHeaderProps {
  year: number;
  month: number;
  summary: { businessDays: number; enteredDays: number; totalMinutes: number };
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenSettings: () => void;
}

// 月ナビゲーション + サマリ表示
export function AttendanceHeader({
  year,
  month,
  summary,
  onPrevMonth,
  onNextMonth,
  onOpenSettings,
}: AttendanceHeaderProps) {
  const t = useTranslations("attendanceTracker");

  return (
    <div className="space-y-2 pb-2">
      {/* 月ナビゲーション + 設定 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrevMonth} aria-label={t("prevMonth")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {t("month", { year, month })}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNextMonth} aria-label={t("nextMonth")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenSettings} aria-label={t("settings")}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      {/* サマリ */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        <span>
          {t("businessDays")}: {summary.businessDays}
          {t("days")}
        </span>
        <span>
          {t("enteredDays")}: {summary.enteredDays}
          {t("days")}
        </span>
        <span>
          {t("totalHours")}: {formatWorkTime(summary.totalMinutes)}
          {t("hours")}
        </span>
      </div>
    </div>
  );
}
