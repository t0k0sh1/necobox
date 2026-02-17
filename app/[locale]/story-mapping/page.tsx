"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { UserStoryMapping } from "@/app/components/domain-modeling/UserStoryMapping";
import { useStoryMappingBoard } from "@/lib/hooks/useStoryMappingBoard";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

/** main 要素の min-height を 0 にしてページ全体のスクロールを抑止する */
function useOverrideMainMinHeight() {
  useEffect(() => {
    const main = document.querySelector("main");
    if (main) main.style.minHeight = "0";
    return () => {
      if (main) main.style.minHeight = "";
    };
  }, []);
}

export default function StoryMappingPage() {
  const t = useTranslations("storyMapping");
  useOverrideMainMinHeight();

  const { board, updateBoard, undo, redo } = useStoryMappingBoard();

  // キーボードショートカット（Undo/Redo）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
      <div className="flex-1 min-h-0">
        <UserStoryMapping board={board} onBoardChange={updateBoard} />
      </div>
    </div>
  );
}
