"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { MonthSettings } from "@/lib/utils/attendance";

interface MonthSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: MonthSettings;
  onSave: (settings: MonthSettings) => void;
}

// 月の標準勤務設定ダイアログ
export function MonthSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
}: MonthSettingsDialogProps) {
  const t = useTranslations("attendanceTracker");

  // ローカル状態は settings の値で初期化（handleOpenChange でリセット）
  const [startTime, setStartTime] = useState(settings.defaultStartTime);
  const [endTime, setEndTime] = useState(settings.defaultEndTime);
  const [breakMinutes, setBreakMinutes] = useState(settings.defaultBreakMinutes);

  // ダイアログの開閉時に値をリセット
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setStartTime(settings.defaultStartTime);
      setEndTime(settings.defaultEndTime);
      setBreakMinutes(settings.defaultBreakMinutes);
    }
    onOpenChange(newOpen);
  };

  const handleSave = () => {
    onSave({
      defaultStartTime: startTime,
      defaultEndTime: endTime,
      defaultBreakMinutes: breakMinutes,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("settingsTitle")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start-time" className="text-right text-sm">
              {t("defaultStartTime")}
            </Label>
            <input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="col-span-3 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end-time" className="text-right text-sm">
              {t("defaultEndTime")}
            </Label>
            <input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="col-span-3 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="break-minutes" className="text-right text-sm">
              {t("defaultBreakMinutes")}
            </Label>
            <input
              id="break-minutes"
              type="number"
              min={0}
              step={15}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              className="col-span-3 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
