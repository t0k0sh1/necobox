"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttendanceRow } from "./AttendanceRow";
import {
  calcWorkMinutes,
  isWeekend,
  isHoliday,
  getMaxTaskCount,
  type DailyAttendance,
  type MonthSettings,
} from "@/lib/utils/attendance";

interface AttendanceTableProps {
  days: DailyAttendance[];
  settings: MonthSettings;
  year: number;
  month: number;
  taskSuggestions: string[];
  checkboxLabel: string;
  onUpdateCheckboxLabel: (label: string) => void;
  onUpdateChecked: (date: string, checked: boolean) => void;
  onUpdateDay: (
    date: string,
    field: "startTime" | "endTime" | "breakMinutes",
    value: string | number | null
  ) => void;
  onUpdateTasks: (date: string, tasks: string[]) => void;
}

// 勤怠テーブル本体
export function AttendanceTable({
  days,
  settings,
  year,
  month,
  taskSuggestions,
  checkboxLabel,
  onUpdateCheckboxLabel,
  onUpdateChecked,
  onUpdateDay,
  onUpdateTasks,
}: AttendanceTableProps) {
  const t = useTranslations("attendanceTracker");

  const defaultWorkMinutes = calcWorkMinutes(
    settings.defaultStartTime,
    settings.defaultEndTime,
    settings.defaultBreakMinutes
  );

  // データ内の最大タスク数（最低5）を初期値にし、+ボタンで増やせる
  const dataMax = Math.max(3, getMaxTaskCount(days));
  const [taskSlotCount, setTaskSlotCount] = useState(dataMax);
  // データが増えたら自動追従
  const effectiveSlotCount = Math.max(taskSlotCount, dataMax);

  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <datalist id="task-suggestions">
        {taskSuggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <table className="border-collapse text-xs">
        <thead>
          <tr className="h-7 border-b bg-muted/50 text-xs font-medium">
            <th className="sticky left-0 z-10 bg-muted/50 w-7 px-1 py-0.5 text-center whitespace-nowrap border-r">
              {t("day")}
            </th>
            <th className="sticky left-7 z-10 bg-muted/50 w-7 px-1 py-0.5 text-center whitespace-nowrap border-r">
              {t("dayOfWeek")}
            </th>
            <th className="px-0.5 py-0.5 text-center whitespace-nowrap">
              {t("startTime")}
            </th>
            <th className="px-0.5 py-0.5 text-center whitespace-nowrap">
              {t("endTime")}
            </th>
            <th className="px-0.5 py-0.5 text-center whitespace-nowrap">
              {t("breakMinutes")}
            </th>
            <th className="px-1 py-0.5 text-center whitespace-nowrap">
              {t("workTime")}
            </th>
            <th className="px-0.5 py-0.5 text-center whitespace-nowrap">
              <input
                type="text"
                className="h-5 w-16 text-xs border rounded px-0.5 bg-background text-center"
                placeholder={t("checkboxLabel")}
                value={checkboxLabel}
                onChange={(e) => onUpdateCheckboxLabel(e.target.value)}
              />
            </th>
            {Array.from({ length: effectiveSlotCount }, (_, i) => (
              <th key={`task-header-${i}`} className="px-0.5 py-0.5 text-center whitespace-nowrap">
                <span className="text-muted-foreground">{t("taskName")}{i + 1}</span>
              </th>
            ))}
            <th className="px-0.5 py-0.5 text-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => setTaskSlotCount((c) => c + 1)}
                aria-label={t("addTaskColumn")}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const date = new Date(year, month - 1, parseInt(day.date.split("-")[2], 10));
            const dayOfWeek = date.getDay();
            const holiday = isHoliday(date);
            const nonBusinessDay = isWeekend(date) || holiday;
            return (
              <AttendanceRow
                key={day.date}
                day={day}
                dayOfWeek={dayOfWeek}
                isNonBusinessDay={nonBusinessDay}
                isHoliday={holiday}
                defaultWorkMinutes={defaultWorkMinutes}
                taskSlotCount={effectiveSlotCount}
                onUpdate={onUpdateDay}
                onUpdateChecked={onUpdateChecked}
                onUpdateTasks={onUpdateTasks}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
