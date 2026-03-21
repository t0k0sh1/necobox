"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/app/components/CopyButton";
import {
  aggregateTaskCounts,
  getDailyTaskList,
  getTaskPeriods,
  type DailyAttendance,
} from "@/lib/utils/attendance";

interface TaskSummaryProps {
  days: DailyAttendance[];
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function formatPeriodDate(dateStr: string): string {
  const parts = dateStr.split("-");
  return `${Number(parts[1])}/${Number(parts[2])}`;
}

export function TaskSummary({ days }: TaskSummaryProps) {
  const t = useTranslations("attendanceTracker");
  const [activeTab, setActiveTab] = useState("count");

  const formatDateWithDay = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const dow = t(DAY_KEYS[date.getDay()]);
    return `${m}/${d} (${dow})`;
  };

  const taskCounts = useMemo(() => aggregateTaskCounts(days), [days]);
  const dailyTasks = useMemo(() => getDailyTaskList(days), [days]);
  const taskPeriods = useMemo(() => getTaskPeriods(days), [days]);

  const hasAnyTask = taskCounts.length > 0;

  const copyText = useMemo((): string => {
    if (activeTab === "count") {
      const header = `${t("taskSummaryTask")}\t${t("taskSummaryDays")}`;
      const rows = taskCounts.map((item) => `${item.task}\t${item.days}`);
      return [header, ...rows].join("\n");
    }
    if (activeTab === "daily") {
      const header = `${t("taskSummaryDate")}\t${t("taskSummaryTask")}`;
      const rows = dailyTasks.map(
        (item) => `${formatDateWithDay(item.date)}\t${item.tasks.join(", ")}`
      );
      return [header, ...rows].join("\n");
    }
    // period
    const header = `${t("taskSummaryTask")}\t${t("taskSummaryPeriodRange")}\t${t("taskSummaryDays")}`;
    const rows = taskPeriods.map((item) => {
      const period =
        item.startDate === item.endDate
          ? formatPeriodDate(item.startDate)
          : `${formatPeriodDate(item.startDate)} 〜 ${formatPeriodDate(item.endDate)}`;
      return `${item.task}\t${period}\t${item.days}`;
    });
    return [header, ...rows].join("\n");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, taskCounts, dailyTasks, taskPeriods, t]);

  return (
    <div className="container mx-auto px-4 py-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-semibold shrink-0">{t("taskSummary")}</h2>
          <TabsList className="h-8">
            <TabsTrigger value="count" className="text-xs px-3 h-7">
              {t("taskSummaryCount")}
            </TabsTrigger>
            <TabsTrigger value="daily" className="text-xs px-3 h-7">
              {t("taskSummaryDaily")}
            </TabsTrigger>
            <TabsTrigger value="period" className="text-xs px-3 h-7">
              {t("taskSummaryPeriod")}
            </TabsTrigger>
          </TabsList>
          {hasAnyTask && (
            <CopyButton
              text={copyText}
              label={t("taskSummaryCopy")}
              copiedLabel={t("taskSummaryCopied")}
              className="h-7 text-xs"
            />
          )}
        </div>

        {!hasAnyTask ? (
          <p className="text-sm text-muted-foreground">{t("taskSummaryEmpty")}</p>
        ) : (
          <>
            <TabsContent value="count" className="mt-0">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-1.5 px-2 font-medium">{t("taskSummaryTask")}</th>
                      <th className="py-1.5 px-2 font-medium w-20 text-right">{t("taskSummaryDays")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskCounts.map((item) => (
                      <tr key={item.task} className="border-b border-border/50">
                        <td className="py-1.5 px-2">{item.task}</td>
                        <td className="py-1.5 px-2 text-right tabular-nums">{item.days}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="daily" className="mt-0">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-1.5 px-2 font-medium w-28">{t("taskSummaryDate")}</th>
                      <th className="py-1.5 px-2 font-medium">{t("taskSummaryTask")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyTasks.map((item) => (
                      <tr key={item.date} className="border-b border-border/50">
                        <td className="py-1.5 px-2 tabular-nums whitespace-nowrap">
                          {formatDateWithDay(item.date)}
                        </td>
                        <td className="py-1.5 px-2">{item.tasks.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="period" className="mt-0">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-1.5 px-2 font-medium">{t("taskSummaryTask")}</th>
                      <th className="py-1.5 px-2 font-medium">{t("taskSummaryPeriodRange")}</th>
                      <th className="py-1.5 px-2 font-medium w-20 text-right">{t("taskSummaryDays")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskPeriods.map((item) => (
                      <tr key={item.task} className="border-b border-border/50">
                        <td className="py-1.5 px-2">{item.task}</td>
                        <td className="py-1.5 px-2 tabular-nums whitespace-nowrap">
                          {item.startDate === item.endDate
                            ? formatPeriodDate(item.startDate)
                            : `${formatPeriodDate(item.startDate)} 〜 ${formatPeriodDate(item.endDate)}`}
                        </td>
                        <td className="py-1.5 px-2 text-right tabular-nums">{item.days}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
