"use client";

import { useTranslations } from "next-intl";
import { EXAMPLE_MAPPING_COLORS } from "@/lib/utils/domain-modeling";

interface ExampleMappingStoryCardProps {
  text: string;
  onDoubleClick: (domRect: DOMRect) => void;
}

/** 実例マッピング - ストーリーカード（黄色、常に1枚、削除不可） */
export function ExampleMappingStoryCard({
  text,
  onDoubleClick,
}: ExampleMappingStoryCardProps) {
  const t = useTranslations("domainModeling.exampleMapping");
  const colors = EXAMPLE_MAPPING_COLORS.story;

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    onDoubleClick(rect);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      onDoubleClick(rect);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="w-full max-w-lg mx-auto rounded-lg shadow-sm border cursor-pointer select-none transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400"
      style={{
        backgroundColor: colors.bg,
        borderColor: `${colors.header}40`,
      }}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
    >
      {/* ヘッダー */}
      <div
        className="px-3 py-1.5 text-sm font-semibold text-white rounded-t-lg"
        style={{ backgroundColor: colors.header }}
      >
        {t("storyLabel")}
      </div>
      {/* テキスト */}
      <div className="px-3 py-2 min-h-[40px] text-sm text-gray-800">
        {text || (
          <span className="text-gray-400 italic">{t("storyPlaceholder")}</span>
        )}
      </div>
    </div>
  );
}
