"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import type { ExampleMappingBoard } from "@/lib/utils/domain-modeling";
import {
  EXAMPLE_MAPPING_COLORS,
  createExampleMappingNote,
  createExampleMappingRule,
} from "@/lib/utils/domain-modeling";
import { ExampleMappingStoryCard } from "./ExampleMappingStoryCard";
import { ExampleMappingRuleColumn } from "./ExampleMappingRuleColumn";
import { BmcStickyNote } from "./BmcStickyNote";
import { NoteEditor } from "./NoteEditor";

interface ExampleMappingProps {
  board: ExampleMappingBoard;
  onBoardChange: (board: ExampleMappingBoard) => void;
}

/** 編集対象の種別 */
type EditTarget =
  | { type: "story" }
  | { type: "rule"; ruleId: string }
  | { type: "example"; ruleId: string; exampleId: string }
  | { type: "question"; questionId: string };

interface EditingState {
  target: EditTarget;
  text: string;
  position: { x: number; y: number; width: number; height: number };
}

/** ドラッグ元の情報 */
interface DragState {
  /** ドラッグ中の具体例のID */
  exampleId: string;
  /** 元のルール列ID */
  sourceRuleId: string;
}

/** 実例マッピングメインコンポーネント */
export function ExampleMapping({ board, onBoardChange }: ExampleMappingProps) {
  const t = useTranslations("domainModeling.exampleMapping");
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [autoEditId, setAutoEditId] = useState<string | null>(null);
  const [dragOverExampleId, setDragOverExampleId] = useState<string | null>(null);
  const [dragOverRuleId, setDragOverRuleId] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  // 不明点のドラッグ用
  const [questionDragOverId, setQuestionDragOverId] = useState<string | null>(null);
  const questionDragRef = useRef<{ questionId: string } | null>(null);

  // --- ストーリー ---
  const handleEditStory = useCallback(
    (domRect: DOMRect) => {
      setEditing({
        target: { type: "story" },
        text: board.story.text,
        position: { x: domRect.left, y: domRect.top, width: domRect.width, height: domRect.height },
      });
    },
    [board.story.text]
  );

  // --- ルール ---
  const handleAddRule = useCallback(() => {
    const rule = createExampleMappingRule();
    onBoardChange({ ...board, rules: [...board.rules, rule] });
    setAutoEditId(rule.id);
  }, [board, onBoardChange]);

  const handleEditRule = useCallback(
    (ruleId: string, domRect: DOMRect) => {
      const rule = board.rules.find((r) => r.id === ruleId);
      if (!rule) return;
      setAutoEditId(null);
      setEditing({
        target: { type: "rule", ruleId },
        text: rule.text,
        position: { x: domRect.left, y: domRect.top, width: domRect.width, height: domRect.height },
      });
    },
    [board.rules]
  );

  const handleDeleteRule = useCallback(
    (ruleId: string) => {
      onBoardChange({ ...board, rules: board.rules.filter((r) => r.id !== ruleId) });
    },
    [board, onBoardChange]
  );

  // --- 具体例 ---
  const handleAddExample = useCallback(
    (ruleId: string) => {
      const note = createExampleMappingNote();
      const rules = board.rules.map((r) =>
        r.id === ruleId ? { ...r, examples: [...r.examples, note] } : r
      );
      onBoardChange({ ...board, rules });
      setAutoEditId(note.id);
    },
    [board, onBoardChange]
  );

  const handleEditExample = useCallback(
    (ruleId: string, exampleId: string, domRect: DOMRect) => {
      const rule = board.rules.find((r) => r.id === ruleId);
      const example = rule?.examples.find((e) => e.id === exampleId);
      if (!example) return;
      setAutoEditId(null);
      setEditing({
        target: { type: "example", ruleId, exampleId },
        text: example.text,
        position: { x: domRect.left, y: domRect.top, width: domRect.width, height: domRect.height },
      });
    },
    [board.rules]
  );

  const handleDeleteExample = useCallback(
    (ruleId: string, exampleId: string) => {
      const rules = board.rules.map((r) =>
        r.id === ruleId
          ? { ...r, examples: r.examples.filter((e) => e.id !== exampleId) }
          : r
      );
      onBoardChange({ ...board, rules });
    },
    [board, onBoardChange]
  );

  // --- 不明点 ---
  const handleAddQuestion = useCallback(() => {
    const note = createExampleMappingNote();
    onBoardChange({ ...board, questions: [...board.questions, note] });
    setAutoEditId(note.id);
  }, [board, onBoardChange]);

  const handleEditQuestion = useCallback(
    (questionId: string, domRect: DOMRect) => {
      const question = board.questions.find((q) => q.id === questionId);
      if (!question) return;
      setAutoEditId(null);
      setEditing({
        target: { type: "question", questionId },
        text: question.text,
        position: { x: domRect.left, y: domRect.top, width: domRect.width, height: domRect.height },
      });
    },
    [board.questions]
  );

  const handleDeleteQuestion = useCallback(
    (questionId: string) => {
      onBoardChange({
        ...board,
        questions: board.questions.filter((q) => q.id !== questionId),
      });
    },
    [board, onBoardChange]
  );

  // --- 編集コミット ---
  const handleEditCommit = useCallback(
    (text: string) => {
      if (!editing) return;
      const { target } = editing;

      if (target.type === "story") {
        onBoardChange({ ...board, story: { ...board.story, text } });
      } else if (target.type === "rule") {
        const rules = board.rules.map((r) =>
          r.id === target.ruleId ? { ...r, text } : r
        );
        onBoardChange({ ...board, rules });
      } else if (target.type === "example") {
        const rules = board.rules.map((r) =>
          r.id === target.ruleId
            ? {
                ...r,
                examples: r.examples.map((e) =>
                  e.id === target.exampleId ? { ...e, text } : e
                ),
              }
            : r
        );
        onBoardChange({ ...board, rules });
      } else if (target.type === "question") {
        const questions = board.questions.map((q) =>
          q.id === target.questionId ? { ...q, text } : q
        );
        onBoardChange({ ...board, questions });
      }

      setEditing(null);
    },
    [editing, board, onBoardChange]
  );

  const handleEditCancel = useCallback(() => {
    setEditing(null);
  }, []);

  // --- 具体例のドラッグ&ドロップ ---
  const handleDragStartExample = useCallback(
    (ruleId: string, exampleId: string) => {
      dragRef.current = { exampleId, sourceRuleId: ruleId };
    },
    []
  );

  const handleDragOverExample = useCallback(
    (_e: React.DragEvent, exampleId: string, ruleId: string) => {
      setDragOverExampleId(exampleId);
      setDragOverRuleId(ruleId);
    },
    []
  );

  const handleDropOnColumn = useCallback(
    (targetRuleId: string) => {
      const drag = dragRef.current;
      if (!drag) return;

      const { sourceRuleId, exampleId } = drag;
      const sourceRule = board.rules.find((r) => r.id === sourceRuleId);
      const sourceNote = sourceRule?.examples.find((e) => e.id === exampleId);
      if (!sourceNote) return;

      let newRules = [...board.rules];

      if (sourceRuleId === targetRuleId) {
        // 同一列内の並び替え
        if (dragOverExampleId && dragOverExampleId !== exampleId) {
          newRules = newRules.map((r) => {
            if (r.id !== sourceRuleId) return r;
            const list = [...r.examples];
            const fromIdx = list.findIndex((e) => e.id === exampleId);
            const toIdx = list.findIndex((e) => e.id === dragOverExampleId);
            if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
              list.splice(fromIdx, 1);
              list.splice(toIdx, 0, sourceNote);
            }
            return { ...r, examples: list };
          });
        }
      } else {
        // 別の列へ移動
        newRules = newRules.map((r) => {
          if (r.id === sourceRuleId) {
            return { ...r, examples: r.examples.filter((e) => e.id !== exampleId) };
          }
          if (r.id === targetRuleId) {
            const targetList = [...r.examples];
            if (dragOverExampleId) {
              const toIdx = targetList.findIndex((e) => e.id === dragOverExampleId);
              if (toIdx !== -1) {
                targetList.splice(toIdx, 0, sourceNote);
              } else {
                targetList.push(sourceNote);
              }
            } else {
              targetList.push(sourceNote);
            }
            return { ...r, examples: targetList };
          }
          return r;
        });
      }

      onBoardChange({ ...board, rules: newRules });
      dragRef.current = null;
      setDragOverExampleId(null);
      setDragOverRuleId(null);
    },
    [board, onBoardChange, dragOverExampleId]
  );

  const handleDragEndExample = useCallback(() => {
    dragRef.current = null;
    setDragOverExampleId(null);
    setDragOverRuleId(null);
  }, []);

  // --- 不明点のドラッグ&ドロップ ---
  const handleDragStartQuestion = useCallback((questionId: string) => {
    questionDragRef.current = { questionId };
  }, []);

  const handleDragOverQuestion = useCallback(
    (_e: React.DragEvent, questionId: string) => {
      setQuestionDragOverId(questionId);
    },
    []
  );

  const handleDropOnQuestions = useCallback(() => {
    const drag = questionDragRef.current;
    if (!drag) return;

    const { questionId } = drag;
    if (questionDragOverId && questionDragOverId !== questionId) {
      const list = [...board.questions];
      const fromIdx = list.findIndex((q) => q.id === questionId);
      const toIdx = list.findIndex((q) => q.id === questionDragOverId);
      if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
        const [moved] = list.splice(fromIdx, 1);
        list.splice(toIdx, 0, moved);
        onBoardChange({ ...board, questions: list });
      }
    }
    questionDragRef.current = null;
    setQuestionDragOverId(null);
  }, [board, onBoardChange, questionDragOverId]);

  const handleDragEndQuestion = useCallback(() => {
    questionDragRef.current = null;
    setQuestionDragOverId(null);
  }, []);

  // ウィンドウ外でドラッグがキャンセルされた場合のクリーンアップ
  useEffect(() => {
    const cleanup = () => {
      dragRef.current = null;
      setDragOverExampleId(null);
      setDragOverRuleId(null);
      questionDragRef.current = null;
      setQuestionDragOverId(null);
    };
    window.addEventListener("dragend", cleanup);
    return () => window.removeEventListener("dragend", cleanup);
  }, []);

  // ルールカードのautoEdit対応（ルール追加直後にエディタを開く）
  useEffect(() => {
    if (!autoEditId) return;
    const rule = board.rules.find((r) => r.id === autoEditId);
    if (!rule) return;
    // DOMが更新されてからrectを取得する
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-rule-id="${autoEditId}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setAutoEditId(null);
        setEditing({
          target: { type: "rule", ruleId: autoEditId },
          text: rule.text,
          position: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
        });
      }
    });
  }, [autoEditId, board.rules]);

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-auto">
      {/* ストーリーカード */}
      <ExampleMappingStoryCard
        text={board.story.text}
        onDoubleClick={handleEditStory}
      />

      {/* ルールセクション */}
      <div>
        <h3
          className="text-xs font-semibold mb-2 px-1"
          style={{ color: EXAMPLE_MAPPING_COLORS.rule.header }}
        >
          {t("rulesSection")}
        </h3>
        <div className="flex flex-row gap-3 overflow-x-auto pb-2">
          {board.rules.map((rule) => (
            <ExampleMappingRuleColumn
              key={rule.id}
              rule={rule}
              onEditRule={(rect) => handleEditRule(rule.id, rect)}
              onDeleteRule={() => handleDeleteRule(rule.id)}
              onAddExample={() => handleAddExample(rule.id)}
              onEditExample={(exId, rect) => handleEditExample(rule.id, exId, rect)}
              onDeleteExample={(exId) => handleDeleteExample(rule.id, exId)}
              onDragStartExample={(exId) => handleDragStartExample(rule.id, exId)}
              onDragOverExample={(e, exId) => handleDragOverExample(e, exId, rule.id)}
              onDropOnColumn={() => handleDropOnColumn(rule.id)}
              onDragEnd={handleDragEndExample}
              dragOverExampleId={dragOverRuleId === rule.id ? dragOverExampleId : null}
              autoEditExampleId={autoEditId}
            />
          ))}
          {/* ルール追加ボタン */}
          <button
            type="button"
            className="min-w-[48px] h-[48px] rounded-lg border-2 border-dashed flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors shrink-0 self-start"
            style={{ borderColor: `${EXAMPLE_MAPPING_COLORS.rule.header}40` }}
            onClick={handleAddRule}
            aria-label={t("addRule")}
          >
            <Plus className="w-5 h-5" style={{ color: EXAMPLE_MAPPING_COLORS.rule.header }} />
          </button>
        </div>
      </div>

      {/* 不明点セクション */}
      <div>
        <h3
          className="text-xs font-semibold mb-2 px-1"
          style={{ color: EXAMPLE_MAPPING_COLORS.question.header }}
        >
          {t("questionsSection")}
        </h3>
        <div
          className="flex flex-row flex-wrap gap-2"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleDropOnQuestions();
          }}
        >
          {board.questions.map((question) => (
            <div key={question.id} className="w-[180px]">
              <BmcStickyNote
                noteId={question.id}
                text={question.text}
                bgColor={EXAMPLE_MAPPING_COLORS.question.bg}
                onDoubleClick={(rect) => handleEditQuestion(question.id, rect)}
                onDelete={() => handleDeleteQuestion(question.id)}
                onDragStart={(nid) => handleDragStartQuestion(nid)}
                onDragOver={(e, nid) => handleDragOverQuestion(e, nid)}
                onDragEnd={handleDragEndQuestion}
                isDragOver={questionDragOverId === question.id}
                autoEdit={autoEditId === question.id}
              />
            </div>
          ))}
          {/* 不明点追加ボタン */}
          <button
            type="button"
            className="w-[180px] h-[32px] rounded border-2 border-dashed flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:bg-pink-50 dark:hover:bg-pink-950 transition-colors"
            style={{ borderColor: `${EXAMPLE_MAPPING_COLORS.question.header}40` }}
            onClick={handleAddQuestion}
          >
            <Plus className="w-3 h-3" />
            {t("addQuestion")}
          </button>
        </div>
      </div>

      {/* ノートエディタ */}
      {editing && (
        <NoteEditor
          initialText={editing.text}
          position={editing.position}
          onCommit={handleEditCommit}
          onCancel={handleEditCancel}
        />
      )}
    </div>
  );
}
