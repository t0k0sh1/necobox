"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Info } from "lucide-react";

interface CharacterOptionCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  tooltip?: {
    title: string;
    items: string[];
  };
}

export function CharacterOptionCheckbox({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  tooltip,
}: CharacterOptionCheckboxProps) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox
        checked={checked}
        onCheckedChange={(checked) => onCheckedChange(checked as boolean)}
        disabled={disabled}
        className={disabled ? "opacity-50" : ""}
      />
      <span
        className={
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }
      >
        {label}
      </span>
      {tooltip && (
        <div className="relative group">
          <Info className="w-4 h-4 text-gray-400 cursor-help" />
          <div className="absolute left-0 top-6 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
            <div className="font-semibold mb-2">{tooltip.title}</div>
            <div className="space-y-1">
              {tooltip.items.map((item, index) => (
                <div key={index}>{item}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
