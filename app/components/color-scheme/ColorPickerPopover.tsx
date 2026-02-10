"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { SchemeColor } from "@/lib/utils/color-scheme-designer";
import { hexToRgb, rgbToHex } from "@/lib/utils/color-converter";
import { HexColorPicker } from "react-colorful";

interface ColorPickerPopoverProps {
  color: SchemeColor;
  onUpdate: (updates: Partial<SchemeColor>) => void;
}

export function ColorPickerPopover({ color, onUpdate }: ColorPickerPopoverProps) {
  const rgb = hexToRgb(color.hex);

  const handleHexInput = (v: string) => {
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      onUpdate({ hex: v.toLowerCase() });
    }
  };

  const handleRgb = (ch: "r" | "g" | "b", value: number) => {
    if (!rgb) return;
    const clamped = Math.max(0, Math.min(255, value));
    onUpdate({ hex: rgbToHex({ ...rgb, [ch]: clamped }) });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-8 h-8 rounded border shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-shadow"
          style={{ backgroundColor: color.hex }}
          aria-label={color.name}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-3 space-y-2" align="start">
        <HexColorPicker
          color={color.hex}
          onChange={(hex) => onUpdate({ hex })}
          style={{ width: "100%" }}
        />
        <div>
          <Label className="text-[9px] text-gray-400">HEX</Label>
          <Input
            key={color.hex}
            defaultValue={color.hex}
            onChange={(e) => handleHexInput(e.target.value)}
            className="h-7 text-xs font-mono"
            maxLength={7}
          />
        </div>
        {rgb && (
          <div className="grid grid-cols-3 gap-1.5">
            {(["r", "g", "b"] as const).map((ch) => (
              <div key={ch}>
                <Label className="text-[9px] text-gray-400 uppercase">
                  {ch}
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb[ch]}
                  onChange={(e) =>
                    handleRgb(ch, parseInt(e.target.value) || 0)
                  }
                  className="h-7 text-xs font-mono px-1.5"
                />
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
