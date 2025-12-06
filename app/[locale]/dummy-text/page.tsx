"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CopyButton } from "@/app/components/CopyButton";
import { Check, Copy } from "lucide-react";
import {
  countLength,
  generateDummyTexts,
  type TextType,
} from "@/lib/utils/dummy-text";
import { useState } from "react";
import { useTranslations } from 'next-intl';

export default function DummyTextPage() {
  const t = useTranslations('dummyText');
  const tCommon = useTranslations('common');

  const [textType, setTextType] = useState<TextType>("alphanumeric");
  const [lengthMode, setLengthMode] = useState<"single" | "range">("single");
  const [singleLength, setSingleLength] = useState<string>("10");
  const [minLength, setMinLength] = useState<string>("5");
  const [maxLength, setMaxLength] = useState<string>("15");
  const [numberOfTexts, setNumberOfTexts] = useState<string>("1");
  const [generatedTexts, setGeneratedTexts] = useState<string[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);

  const generateDummyText = () => {
    const count = parseInt(numberOfTexts);
    if (count < 1 || count > 100) {
      return;
    }

    const lengthSpec = lengthMode === "single"
      ? { mode: "single" as const, single: parseInt(singleLength) }
      : { mode: "range" as const, min: parseInt(minLength), max: parseInt(maxLength) };

    const texts = generateDummyTexts(textType, "character", lengthSpec, count);
    setGeneratedTexts(texts);
  };

  const handleCopyAll = () => {
    const text = generatedTexts.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="flex h-full items-start justify-center py-4 px-4">
      <div className="w-full max-w-4xl">
        <Breadcrumbs items={[{ label: t('breadcrumb') }]} />
        <div className="mt-6">
          <div className="bg-white dark:bg-black rounded-lg p-6 border">
            <h1 className="text-3xl font-semibold mb-6">
              {t('title')}
            </h1>

            {/* Character Type */}
            <div className="space-y-4 mb-6">
              <h2 className="text-xl font-semibold">{t('characterType')}</h2>
              <RadioGroup
                value={textType}
                onValueChange={(value) => setTextType(value as TextType)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="alphanumeric" id="alphanumeric" />
                  <Label htmlFor="alphanumeric">{t('alphanumericOnly')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="japanese-full" id="japanese-full" />
                  <Label htmlFor="japanese-full">
                    {t('japaneseFull')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mixed" id="mixed" />
                  <Label htmlFor="mixed">{t('mixed')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lorem" id="lorem" />
                  <Label htmlFor="lorem">{t('lorem')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="natural-japanese"
                    id="natural-japanese"
                  />
                  <Label htmlFor="natural-japanese">
                    {t('naturalJapanese')}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Length Mode */}
            <div className="space-y-4 mb-6">
              <h2 className="text-xl font-semibold">{t('lengthMode')}</h2>
              <RadioGroup
                value={lengthMode}
                onValueChange={(value) => setLengthMode(value as "single" | "range")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single-length" />
                  <Label htmlFor="single-length">{t('singleLength')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="range" id="range-length" />
                  <Label htmlFor="range-length">{t('rangeLength')}</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Length Input */}
            <div className="space-y-4 mb-6">
              <h2 className="text-xl font-semibold">{t('length')}</h2>
              {lengthMode === "single" ? (
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="1"
                    max="4000"
                    value={singleLength}
                    onChange={(e) => setSingleLength(e.target.value)}
                    className="w-32"
                  />
                  <span>{t('characters')}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="min-length" className="w-32">{t('minLength')}</Label>
                    <Input
                      id="min-length"
                      type="number"
                      min="1"
                      max="4000"
                      value={minLength}
                      onChange={(e) => setMinLength(e.target.value)}
                      className="w-32"
                    />
                    <span>{t('characters')}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Label htmlFor="max-length" className="w-32">{t('maxLength')}</Label>
                    <Input
                      id="max-length"
                      type="number"
                      min="1"
                      max="4000"
                      value={maxLength}
                      onChange={(e) => setMaxLength(e.target.value)}
                      className="w-32"
                    />
                    <span>{t('characters')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Number of Texts */}
            <div className="space-y-4 mb-6">
              <h2 className="text-xl font-semibold">{t('numberOfTexts')}</h2>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={numberOfTexts}
                  onChange={(e) => setNumberOfTexts(e.target.value)}
                  className="w-32"
                />
                <span>{tCommon('generate')}</span>
              </div>
            </div>

            {/* Generate Button */}
            <Button onClick={generateDummyText} size="lg" className="w-full">
              {tCommon('generate')}
            </Button>
          </div>

          {/* Generated Texts */}
          {generatedTexts.length > 0 && (
            <div className="mt-6 bg-white dark:bg-black rounded-lg p-6 border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t('generatedTexts')}</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAll}
                  className={
                    copiedAll
                      ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                      : ""
                  }
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {tCommon('copiedAll')}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      {tCommon('copyAll')}
                    </>
                  )}
                </Button>
              </div>
              <div className="space-y-6">
                {generatedTexts.map((text, index) => (
                  <div key={index} className="relative pt-4">
                    <span className="absolute top-0 right-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap bg-white dark:bg-black px-1">
                      {countLength(text, "character")} {tCommon('chars')}
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

