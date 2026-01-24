"use client";

import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps {
  /** コピー対象のテキスト */
  text: string;
  /** コピー成功時に呼ばれるコールバック */
  onCopy?: () => void;
  /** クリックイベントハンドラ（コピー処理の前に呼ばれる、stopPropagation等に使用） */
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  label?: string;
  copiedLabel?: string;
}

export function CopyButton({
  text,
  onCopy,
  onClick,
  className = "",
  label,
  copiedLabel,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    // onClick はコピー前に呼び出し（イベント伝播制御等に使用）
    onClick?.(e);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      // onCopy はコピー成功後に呼び出し
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const copiedStyles =
    "bg-green-50 border-green-200 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={`${copied ? copiedStyles : ""} ${className}`}
      onClick={handleCopy}
      aria-label={!label ? (copied ? (copiedLabel || "Copied") : "Copy") : undefined}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          {copiedLabel && <span className="ml-2">{copiedLabel}</span>}
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          {label && <span className="ml-2">{label}</span>}
        </>
      )}
    </Button>
  );
}
