"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { STORY_MAPPING_COLORS } from "@/lib/utils/domain-modeling";

interface StoryMappingReleaseLineProps {
  name: string;
  onDoubleClick: (domRect: DOMRect) => void;
  onDelete: () => void;
}

/** リリース区切り線コンポーネント */
export function StoryMappingReleaseLine({
  name,
  onDoubleClick,
  onDelete,
}: StoryMappingReleaseLineProps) {
  const t = useTranslations("storyMapping");
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex items-center gap-2 py-1 my-1 cursor-pointer select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(e.currentTarget.getBoundingClientRect());
      }}
    >
      <div
        className="flex-1 border-t-2 border-dashed"
        style={{ borderColor: STORY_MAPPING_COLORS.release.border }}
      />
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded whitespace-nowrap"
        style={{
          backgroundColor: STORY_MAPPING_COLORS.release.bg,
          color: STORY_MAPPING_COLORS.release.border,
        }}
      >
        {name || "\u00A0"}
      </span>
      <div
        className="flex-1 border-t-2 border-dashed"
        style={{ borderColor: STORY_MAPPING_COLORS.release.border }}
      />
      {hovered && (
        <button
          type="button"
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={t("deleteRelease")}
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}
