"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CopyButton } from "@/app/components/CopyButton";
import {
  countLength,
  generateDummyTexts,
  type TextType,
} from "@/lib/utils/dummy-text";
import { useState } from "react";

export default function DummyTextPage() {
  const [textType, setTextType] = useState<TextType>("alphanumeric");
  const [length, setLength] = useState<string>("10");
  const [generatedTexts, setGeneratedTexts] = useState<string[]>([]);

  const generateDummyText = () => {
    const texts = generateDummyTexts(textType, "character", length);
    setGeneratedTexts(texts);
  };

  return (
    <div className="flex h-full items-start justify-center py-4 px-4">
      <div className="w-full max-w-4xl">
        <Breadcrumbs items={[{ label: "Dummy Text Generator" }]} />
        <div className="mt-6">
          <div className="bg-white dark:bg-black rounded-lg p-6 border">
            <h1 className="text-3xl font-semibold mb-6">
              Dummy Text Generator
            </h1>

            {/* 生成する文字種 */}
            <div className="space-y-4 mb-6">
              <h2 className="text-xl font-semibold">Character Type</h2>
              <RadioGroup
                value={textType}
                onValueChange={(value) => setTextType(value as TextType)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="alphanumeric" id="alphanumeric" />
                  <Label htmlFor="alphanumeric">Alphanumeric Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="japanese-full" id="japanese-full" />
                  <Label htmlFor="japanese-full">
                    Full-width Hiragana, Katakana, Kanji
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mixed" id="mixed" />
                  <Label htmlFor="mixed">Mixed Full/Half-width</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lorem" id="lorem" />
                  <Label htmlFor="lorem">Natural Text (Lorem ipsum)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="natural-japanese"
                    id="natural-japanese"
                  />
                  <Label htmlFor="natural-japanese">
                    Natural Text (これはダミーテキストです。)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 生成する文字数 */}
            <div className="space-y-4 mb-6">
              <h2 className="text-xl font-semibold">Length</h2>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="1"
                  max="4000"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-32"
                />
                <span>characters</span>
              </div>
            </div>

            {/* 生成ボタン */}
            <Button onClick={generateDummyText} size="lg" className="w-full">
              Generate
            </Button>
          </div>

          {/* 生成結果 */}
          {generatedTexts.length > 0 && (
            <div className="mt-6 bg-white dark:bg-black rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-4">Generated Texts</h2>
              <div className="space-y-6">
                {generatedTexts.map((text, index) => (
                  <div key={index} className="relative pt-4">
                    <span className="absolute top-0 right-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap bg-white dark:bg-black px-1">
                      {countLength(text, "character")} chars
                    </span>
                    <div className="flex gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                      <p className="font-mono text-sm break-all flex-1">
                        {text}
                      </p>
                      <CopyButton text={text} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
