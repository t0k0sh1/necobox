"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface NoteEditorProps {
  initialText: string;
  position: { x: number; y: number; width: number; height: number };
  onCommit: (text: string) => void;
  onCancel: () => void;
}

export function NoteEditor({
  initialText,
  position,
  onCommit,
  onCancel,
}: NoteEditorProps) {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.focus();
      ta.select();
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // IME変換中はキー操作を無視
      if (e.nativeEvent.isComposing) return;

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onCommit(text);
      } else if (e.key === "Escape") {
        onCancel();
      }
      // キーイベントがキャンバスに伝播しないようにする
      e.stopPropagation();
    },
    [text, onCommit, onCancel]
  );

  return (
    <div
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${Math.max(position.width, 140)}px`,
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onCommit(text)}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="w-full min-h-[50px] p-2 text-xs border-2 border-blue-500 rounded shadow-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none outline-none"
        rows={3}
      />
    </div>
  );
}
