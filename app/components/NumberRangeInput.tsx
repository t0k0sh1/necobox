"use client";

interface NumberRangeInputProps {
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onMinBlur?: () => void;
  onMaxBlur?: () => void;
  minLabel?: string;
  maxLabel?: string;
}

export function NumberRangeInput({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  onMinBlur,
  onMaxBlur,
  minLabel = "Minimum Value",
  maxLabel = "Maximum Value",
}: NumberRangeInputProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor="min-value" className="block text-sm font-medium mb-2">{minLabel}</label>
        <input
          id="min-value"
          type="number"
          value={minValue}
          onChange={(e) => onMinChange(e.target.value)}
          onBlur={onMinBlur}
          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900 dark:border-gray-700"
        />
      </div>
      <div>
        <label htmlFor="max-value" className="block text-sm font-medium mb-2">{maxLabel}</label>
        <input
          id="max-value"
          type="number"
          value={maxValue}
          onChange={(e) => onMaxChange(e.target.value)}
          onBlur={onMaxBlur}
          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900 dark:border-gray-700"
        />
      </div>
    </div>
  );
}
