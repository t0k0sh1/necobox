"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import {
  Popover,
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
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative", className)}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
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
        <PopoverTrigger asChild disabled={disabled}>
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
            disabled={disabled}
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-1 max-h-60 overflow-y-auto"
        align="start"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={cn(
              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
              "hover:bg-accent hover:text-accent-foreground",
              "focus:bg-accent focus:text-accent-foreground",
              value === option.value && "bg-accent text-accent-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
