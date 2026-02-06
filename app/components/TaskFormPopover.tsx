"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Task } from "@/lib/utils/matrix-todo";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";

interface TaskFormPopoverProps {
  /** 編集対象のタスク（新規作成時はnull） */
  task: Task | null;
  /** 既存のカテゴリ一覧（サジェスト用） */
  existingCategories: string[];
  /** トリガー要素 */
  trigger: React.ReactNode;
  /** 保存時のコールバック */
  onSave: (data: { title: string; description: string | null; category: string; deadline: string | null }) => void;
  /** 削除時のコールバック */
  onDelete?: () => void;
  /** ポップオーバーの開閉状態 */
  open: boolean;
  /** 開閉状態変更 */
  onOpenChange: (open: boolean) => void;
}

function TaskForm({
  task,
  existingCategories,
  onSave,
  onDelete,
  onOpenChange,
}: {
  task: Task | null;
  existingCategories: string[];
  onSave: TaskFormPopoverProps["onSave"];
  onDelete?: TaskFormPopoverProps["onDelete"];
  onOpenChange: TaskFormPopoverProps["onOpenChange"];
}) {
  const t = useTranslations("matrixTodo.task");

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [category, setCategory] = useState(task?.category ?? "");
  const [deadline, setDeadline] = useState(task?.deadline ?? "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const filteredCategories = existingCategories.filter(
    (c) => c && c.toLowerCase().includes(category.toLowerCase()) && c !== category
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      onSave({
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim(),
        deadline: deadline || null,
      });
      onOpenChange(false);
    },
    [title, description, category, deadline, onSave, onOpenChange]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* タイトル */}
      <div className="space-y-1">
        <Label htmlFor="task-title" className="text-xs">
          {t("title")}
        </Label>
        <Input
          ref={titleInputRef}
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          className="h-8 text-sm"
          autoFocus
          autoComplete="off"
        />
      </div>

      {/* カテゴリ */}
      <div className="space-y-1 relative">
        <Label htmlFor="task-category" className="text-xs">
          {t("category")}
        </Label>
        <Input
          id="task-category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={t("categoryPlaceholder")}
          className="h-8 text-sm"
          autoComplete="off"
        />
        {showSuggestions && filteredCategories.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-32 overflow-y-auto">
            {filteredCategories.map((c) => (
              <button
                key={c}
                type="button"
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setCategory(c);
                  setShowSuggestions(false);
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 説明 */}
      <div className="space-y-1">
        <Label htmlFor="task-description" className="text-xs">
          {t("description")}
        </Label>
        <Textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("descriptionPlaceholder")}
          className="text-sm min-h-[3.5rem] resize-none"
          rows={2}
        />
      </div>

      {/* 期限 */}
      <div className="space-y-1">
        <Label htmlFor="task-deadline" className="text-xs">
          {t("deadline")}
        </Label>
        <Input
          id="task-deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* ボタン */}
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="flex-1" disabled={!title.trim()}>
          {task ? t("save") : t("add")}
        </Button>
        {task && onDelete && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              onDelete();
              onOpenChange(false);
            }}
          >
            {t("delete")}
          </Button>
        )}
      </div>
    </form>
  );
}

export function TaskFormPopover({
  task,
  existingCategories,
  trigger,
  onSave,
  onDelete,
  open,
  onOpenChange,
}: TaskFormPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-72" align="start" sideOffset={8} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
        {/* key を使って open 時にフォームをリマウントし、初期値をリセット */}
        {open && (
          <TaskForm
            key={task?.id ?? "new"}
            task={task}
            existingCategories={existingCategories}
            onSave={onSave}
            onDelete={onDelete}
            onOpenChange={onOpenChange}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
