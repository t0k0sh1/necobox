"use client";

import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import type { ExampleMappingRule } from "@/lib/utils/event-storming";
import { EXAMPLE_MAPPING_COLORS } from "@/lib/utils/event-storming";
import { BmcStickyNote } from "./BmcStickyNote";

interface ExampleMappingRuleColumnProps {
  rule: ExampleMappingRule;
  onEditRule: (domRect: DOMRect) => void;
  onDeleteRule: () => void;
  onAddExample: () => void;
  onEditExample: (exampleId: string, domRect: DOMRect) => void;
  onDeleteExample: (exampleId: string) => void;
  onDragStartExample: (exampleId: string) => void;
  onDragOverExample: (e: React.DragEvent, exampleId: string) => void;
  onDropOnColumn: () => void;
  onDragEnd: () => void;
  dragOverExampleId: string | null;
  autoEditExampleId: string | null;
}

/** 実例マッピング - ルール列（青ヘッダー + 緑の具体例リスト） */
export function ExampleMappingRuleColumn({
  rule,
  onEditRule,
  onDeleteRule,
  onAddExample,
  onEditExample,
  onDeleteExample,
  onDragStartExample,
  onDragOverExample,
  onDropOnColumn,
  onDragEnd,
  dragOverExampleId,
  autoEditExampleId,
}: ExampleMappingRuleColumnProps) {
  const t = useTranslations("eventStorming.exampleMapping");
  const ruleColors = EXAMPLE_MAPPING_COLORS.rule;
  const exampleColors = EXAMPLE_MAPPING_COLORS.example;

  const handleRuleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    onEditRule(rect);
  };

  const handleRuleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      onEditRule(rect);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDropOnColumn();
  };

  return (
    <div
      className="min-w-[200px] max-w-[280px] flex flex-col rounded-lg border shadow-sm overflow-hidden"
      style={{
        backgroundColor: `${ruleColors.bg}60`,
        borderColor: `${ruleColors.header}30`,
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* ルールヘッダー（青） */}
      <div
        role="button"
        tabIndex={0}
        data-rule-id={rule.id}
        className="relative px-2 py-1.5 text-xs font-semibold text-white cursor-pointer select-none group"
        style={{ backgroundColor: ruleColors.header }}
        onDoubleClick={handleRuleDoubleClick}
        onKeyDown={handleRuleKeyDown}
      >
        <span className="line-clamp-2">{rule.text || "\u00A0"}</span>
        <button
          type="button"
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white items-center justify-center hover:bg-red-600 transition-colors shadow-sm hidden group-hover:flex"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteRule();
          }}
          aria-label={t("deleteRule")}
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* 具体例リスト（緑） */}
      <div className="flex-1 p-1.5 flex flex-col gap-1 min-h-[40px]">
        {rule.examples.map((example) => (
          <BmcStickyNote
            key={example.id}
            noteId={example.id}
            text={example.text}
            bgColor={exampleColors.bg}
            onDoubleClick={(rect) => onEditExample(example.id, rect)}
            onDelete={() => onDeleteExample(example.id)}
            onDragStart={(nid) => onDragStartExample(nid)}
            onDragOver={(e, nid) => onDragOverExample(e, nid)}
            onDragEnd={onDragEnd}
            isDragOver={dragOverExampleId === example.id}
            autoEdit={autoEditExampleId === example.id}
          />
        ))}
      </div>

      {/* 具体例追加ボタン */}
      <button
        type="button"
        className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:bg-black/5 transition-colors"
        onClick={onAddExample}
      >
        <Plus className="w-3 h-3" />
        {t("addExample")}
      </button>
    </div>
  );
}
