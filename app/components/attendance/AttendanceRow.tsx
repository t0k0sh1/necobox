"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  calcWorkMinutes,
  formatWorkTime,
  type DailyAttendance,
} from "@/lib/utils/attendance";

// 曜日キーの配列（0=日 ~ 6=土）
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

interface AttendanceRowProps {
  day: DailyAttendance;
  dayOfWeek: number;
  isNonBusinessDay: boolean;
  isHoliday: boolean;
  defaultWorkMinutes: number;
  taskSlotCount: number;
  onUpdate: (
    date: string,
    field: "startTime" | "endTime" | "breakMinutes",
    value: string | number | null
  ) => void;
  onUpdateTasks: (date: string, tasks: string[]) => void;
}

// 行の背景色を返す
function getRowBgClass(dayOfWeek: number, isHoliday: boolean): string {
  if (dayOfWeek === 0 || isHoliday) return "bg-red-50/60 dark:bg-red-950/20";
  if (dayOfWeek === 6) return "bg-blue-50/60 dark:bg-blue-950/20";
  return "";
}

// sticky列の背景色
function getStickyBgClass(dayOfWeek: number, isHoliday: boolean): string {
  if (dayOfWeek === 0 || isHoliday) return "bg-red-50 dark:bg-red-950/30";
  if (dayOfWeek === 6) return "bg-blue-50 dark:bg-blue-950/30";
  return "bg-background";
}

// 文字色を返す
function getTextColorClass(dayOfWeek: number, isHoliday: boolean): string {
  if (dayOfWeek === 0 || isHoliday) return "text-red-500";
  if (dayOfWeek === 6) return "text-blue-500";
  return "";
}

// 1日分の勤怠行コンポーネント
export function AttendanceRow({
  day,
  dayOfWeek,
  isNonBusinessDay,
  isHoliday,
  defaultWorkMinutes,
  taskSlotCount,
  onUpdate,
  onUpdateTasks,
}: AttendanceRowProps) {
  const t = useTranslations("attendanceTracker");

  const dayNum = parseInt(day.date.split("-")[2], 10);
  const dayOfWeekLabel = t(DAY_KEYS[dayOfWeek]);

  // 勤務時間の計算
  const hasEntry = day.startTime !== null && day.endTime !== null;
  let workTimeDisplay: string;
  let isDefault = false;

  if (hasEntry) {
    const minutes = calcWorkMinutes(day.startTime!, day.endTime!, day.breakMinutes);
    workTimeDisplay = formatWorkTime(minutes);
  } else if (!isNonBusinessDay) {
    workTimeDisplay = formatWorkTime(defaultWorkMinutes);
    isDefault = true;
  } else {
    workTimeDisplay = "";
  }

  const rowBg = getRowBgClass(dayOfWeek, isHoliday);
  const stickyBg = getStickyBgClass(dayOfWeek, isHoliday);
  const textColor = getTextColorClass(dayOfWeek, isHoliday);

  // タスクスロットの更新
  const handleTaskChange = (index: number, value: string) => {
    const newTasks = [...day.tasks];
    // スロットが足りなければ埋める
    while (newTasks.length <= index) {
      newTasks.push("");
    }
    newTasks[index] = value;
    // 末尾の空エントリを削除
    while (newTasks.length > 0 && !newTasks[newTasks.length - 1]) {
      newTasks.pop();
    }
    onUpdateTasks(day.date, newTasks);
  };

  return (
    <tr className={cn("h-7 text-xs border-b", rowBg)}>
      {/* 日 */}
      <td className={cn(
        "sticky left-0 z-10 w-7 px-1 py-0.5 text-center whitespace-nowrap border-r",
        stickyBg, textColor
      )}>
        {dayNum}
      </td>
      {/* 曜日 */}
      <td className={cn(
        "sticky left-7 z-10 w-7 px-1 py-0.5 text-center whitespace-nowrap border-r",
        stickyBg, textColor
      )}>
        {dayOfWeekLabel}
      </td>
      {/* 開始時刻 */}
      <td className="px-0.5 py-0.5 text-center">
        <input
          type="time"
          className="h-5 w-[4.5rem] text-xs border rounded px-0.5 bg-background"
          value={day.startTime ?? ""}
          onChange={(e) =>
            onUpdate(day.date, "startTime", e.target.value === "" ? null : e.target.value)
          }
        />
      </td>
      {/* 終了時刻 */}
      <td className="px-0.5 py-0.5 text-center">
        <input
          type="time"
          className="h-5 w-[4.5rem] text-xs border rounded px-0.5 bg-background"
          value={day.endTime ?? ""}
          onChange={(e) =>
            onUpdate(day.date, "endTime", e.target.value === "" ? null : e.target.value)
          }
        />
      </td>
      {/* 休憩 */}
      <td className="px-0.5 py-0.5 text-center">
        <input
          type="number"
          className="h-5 w-11 text-xs border rounded px-0.5 bg-background text-center"
          min={0}
          step={15}
          value={day.breakMinutes}
          onChange={(e) =>
            onUpdate(day.date, "breakMinutes", Number(e.target.value))
          }
        />
      </td>
      {/* 勤務時間 */}
      <td className="px-1 py-0.5 text-center whitespace-nowrap">
        <span className={cn(isDefault && "italic text-muted-foreground")}>
          {workTimeDisplay}
        </span>
      </td>
      {/* タスクスロット */}
      {Array.from({ length: taskSlotCount }, (_, i) => (
        <td key={`task-${i}`} className="px-0.5 py-0.5">
          <input
            type="text"
            list="task-suggestions"
            className="h-5 w-56 text-xs border rounded px-1 bg-background"
            placeholder={t("taskPlaceholder")}
            value={day.tasks[i] ?? ""}
            onChange={(e) => handleTaskChange(i, e.target.value)}
          />
        </td>
      ))}
    </tr>
  );
}
