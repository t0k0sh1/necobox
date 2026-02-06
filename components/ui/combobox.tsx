"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  id?: string;
  type?: "text" | "number";
  min?: string | number;
  max?: string | number;
  /** ドロップダウンボタンのaria-label */
  ariaLabel?: string;
}

/**
 * 手入力とドロップダウンの両方に対応したコンボボックスコンポーネント
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  className,
  inputClassName,
  disabled = false,
  id,
  type = "text",
  min,
  max,
  ariaLabel = "Open dropdown",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const optionRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setHighlightedIndex(-1);
  };

  // キーボードナビゲーションハンドラ
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // ハイライトされたオプションをビューにスクロール
  React.useEffect(() => {
    if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [highlightedIndex]);

  // ポップオーバーが閉じたらハイライトをリセット
  React.useEffect(() => {
    if (!open) {
      setHighlightedIndex(-1);
    }
  }, [open]);

  const hasOptions = options.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn("relative", className)} onKeyDown={handleKeyDown}>
          <input
            id={id}
            data-slot="combobox-input"
            type={type}
            role="combobox"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={open ? `${id}-listbox` : undefined}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-8 text-base shadow-xs transition-[color,box-shadow] outline-none",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
              "placeholder:text-muted-foreground",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "md:text-sm",
              inputClassName
            )}
          />
          <PopoverTrigger asChild disabled={disabled || !hasOptions}>
            <button
              type="button"
              aria-label={ariaLabel}
              className="absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
              disabled={disabled || !hasOptions}
            >
              <ChevronDownIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      {hasOptions && (
        <PopoverContent
          id={id ? `${id}-listbox` : undefined}
          className="w-[var(--radix-popover-anchor-width)] p-1 max-h-60 overflow-y-auto"
          align="start"
          role="listbox"
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              type="button"
              role="option"
              aria-selected={value === option.value}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:bg-accent focus:text-accent-foreground",
                value === option.value && "bg-accent text-accent-foreground",
                highlightedIndex === index && "bg-accent text-accent-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </PopoverContent>
      )}
    </Popover>
  );
}
