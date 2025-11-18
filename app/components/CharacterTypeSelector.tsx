"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CharacterTypeSelectorOption {
  value: string;
  label: string;
}

interface CharacterTypeSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  options: CharacterTypeSelectorOption[];
  title?: string;
}

export function CharacterTypeSelector({
  value,
  onValueChange,
  options,
  title = "Character Type",
}: CharacterTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <RadioGroup value={value} onValueChange={onValueChange}>
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={option.value} />
            <Label htmlFor={option.value}>{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
