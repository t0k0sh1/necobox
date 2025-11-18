"use client";

import { CopyButton } from "./CopyButton";

interface DecodedSectionProps {
  title: string;
  content: string;
  codeStyle?: boolean;
  onCopy?: () => void;
}

export function DecodedSection({
  title,
  content,
  codeStyle = true,
  onCopy,
}: DecodedSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium">{title}</h3>
        <CopyButton text={content} onCopy={onCopy} />
      </div>
      <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md border overflow-x-auto">
        <code className={`text-sm ${codeStyle ? "" : "break-all"}`}>
          {content}
        </code>
      </pre>
    </div>
  );
}
