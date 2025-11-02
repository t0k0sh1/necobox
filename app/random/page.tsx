"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Check, Copy, Info, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export default function RandomPasswordPage() {
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(false);
  const [symbolsSelection, setSymbolsSelection] = useState<
    Record<string, boolean>
  >({
    exclamation: true,
    at: true,
    hash: true,
    dollar: true,
    percent: true,
    caret: true,
    ampersand: true,
    asterisk: true,
    parenthesis: true,
    underscore: true,
    plus: true,
    minus: true,
    equals: true,
    bracket: true,
    brace: true,
    pipe: true,
    semicolon: true,
    colon: true,
    comma: true,
    period: true,
    less: true,
    greater: true,
    question: true,
  });
  const [length, setLength] = useState(16);
  const [debouncedLength, setDebouncedLength] = useState(16);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [noRepeat, setNoRepeat] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // 「同じ文字を2回以上使わない」が有効な条件をチェック
  const isNoRepeatAvailable = () => {
    // 条件1: 8文字以下
    if (length > 8) return false;

    // 条件2: 有効な文字種の組み合わせ
    const charTypeCount = [uppercase, lowercase, numbers, symbols].filter(
      Boolean
    ).length;

    // 英字大文字のみ、英字小文字のみ、数字のみのいずれか
    if (charTypeCount === 1) {
      return (
        (uppercase && !lowercase && !numbers && !symbols) ||
        (!uppercase && lowercase && !numbers && !symbols) ||
        (!uppercase && !lowercase && numbers && !symbols)
      );
    }

    // 英字大文字と英字小文字のいずれか一方 + 数字
    if (charTypeCount === 2 && numbers) {
      return (
        (uppercase && !lowercase && numbers && !symbols) ||
        (!uppercase && lowercase && numbers && !symbols)
      );
    }

    return false;
  };

  // パスワードの安全性を判定
  const getPasswordStrength = () => {
    if (!generatedPassword) return null;

    const characterTypes = [uppercase, lowercase, numbers, symbols].filter(
      Boolean
    ).length;
    const passwordLength = generatedPassword.length;

    if (passwordLength < 12 || characterTypes <= 2) {
      return {
        level: "Weak",
        description: "Too short or too simple. Easy to guess or crack.",
        textColor: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-900/20",
      };
    } else if (passwordLength >= 16 && characterTypes >= 3) {
      return {
        level: "Strong",
        description:
          "Long and complex enough to resist brute-force and guessing attacks.",
        textColor: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-900/20",
      };
    } else {
      return {
        level: "Moderate",
        description:
          "Reasonably secure but could be stronger. Add more length or variety.",
        textColor: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
      };
    }
  };

  // パスワード生成関数
  const generatePassword = async () => {
    try {
      const settings = {
        uppercase,
        lowercase,
        numbers,
        symbols,
        symbolsSelection: symbols ? symbolsSelection : undefined,
        length: debouncedLength,
        count: 1,
        excludeSimilar,
        noRepeat,
      };

      const response = await fetch("/api/v1/random", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      setGeneratedPassword(data.passwords[0]);
    } catch (error) {
      console.error("Error generating password:", error);
    }
  };

  // 条件を満たさない場合、noRepeatを自動的にオフ
  useEffect(() => {
    if (!isNoRepeatAvailable() && noRepeat) {
      setNoRepeat(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, uppercase, lowercase, numbers, symbols, noRepeat]);

  // length変更をdebounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLength(length);
    }, 500);

    return () => clearTimeout(timer);
  }, [length]);

  // 初期描画時と条件変更時にパスワードを生成
  useEffect(() => {
    generatePassword();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    uppercase,
    lowercase,
    numbers,
    symbols,
    excludeSimilar,
    noRepeat,
    debouncedLength,
  ]);

  return (
    <div className="flex h-full items-start justify-center py-4 px-4">
      <div className="w-full max-w-2xl">
        <Breadcrumbs items={[{ label: "Password Generator" }]} />
        <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border mt-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">Password Generator</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Generate strong unique passwords
            </p>
          </div>

          {/* Generated Password Display */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-md border overflow-hidden">
            <div className="p-4 min-h-[60px] flex items-center border-b border-gray-200 dark:border-gray-700">
              {generatedPassword ? (
                <div className="flex items-center gap-3 w-full">
                  <span className="font-mono text-lg flex-1 break-all">
                    {generatedPassword}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={
                      copied
                        ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
                        : ""
                    }
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassword);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generatePassword()}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <span className="text-gray-400 text-sm">
                  Generated password will appear here
                </span>
              )}
            </div>
            {generatedPassword && getPasswordStrength() && (
              <div
                className={`p-3 text-sm border-t ${
                  getPasswordStrength()?.bgColor
                } ${getPasswordStrength()?.textColor}`}
              >
                <span className="font-semibold">
                  {getPasswordStrength()?.level}:{" "}
                </span>
                <span>{getPasswordStrength()?.description}</span>
              </div>
            )}
          </div>

          {/* Password length */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Password length</h2>
              <span className="text-lg font-medium">{length} chars</span>
            </div>
            <Slider
              value={[length]}
              onValueChange={(value) => setLength(value[0])}
              min={1}
              max={64}
              step={1}
            />
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>1</span>
              <span>64</span>
            </div>
          </div>

          {/* Character options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={uppercase}
                onCheckedChange={(checked) => setUppercase(checked as boolean)}
              />
              <span>Include Uppercase Letters</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={lowercase}
                onCheckedChange={(checked) => setLowercase(checked as boolean)}
              />
              <span>Include Lowercase Letters</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={numbers}
                onCheckedChange={(checked) => setNumbers(checked as boolean)}
              />
              <span>Include Numbers</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={symbols}
                onCheckedChange={(checked) => setSymbols(checked as boolean)}
              />
              <span>Include Symbols</span>
            </label>

            {/* 記号の詳細選択 */}
            {symbols && (
              <div className="ml-7 space-y-2 border-l pl-4">
                <div className="text-sm font-medium mb-2">Select symbols</div>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.exclamation}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          exclamation: checked as boolean,
                        })
                      }
                    />
                    <span>!</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.at}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          at: checked as boolean,
                        })
                      }
                    />
                    <span>@</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.hash}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          hash: checked as boolean,
                        })
                      }
                    />
                    <span>#</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.dollar}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          dollar: checked as boolean,
                        })
                      }
                    />
                    <span>$</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.percent}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          percent: checked as boolean,
                        })
                      }
                    />
                    <span>%</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.caret}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          caret: checked as boolean,
                        })
                      }
                    />
                    <span>^</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.ampersand}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          ampersand: checked as boolean,
                        })
                      }
                    />
                    <span>&</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.asterisk}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          asterisk: checked as boolean,
                        })
                      }
                    />
                    <span>*</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.parenthesis}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          parenthesis: checked as boolean,
                        })
                      }
                    />
                    <span>()</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.underscore}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          underscore: checked as boolean,
                        })
                      }
                    />
                    <span>_</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.plus}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          plus: checked as boolean,
                        })
                      }
                    />
                    <span>+</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.minus}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          minus: checked as boolean,
                        })
                      }
                    />
                    <span>-</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.equals}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          equals: checked as boolean,
                        })
                      }
                    />
                    <span>=</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.bracket}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          bracket: checked as boolean,
                        })
                      }
                    />
                    <span>[]</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.brace}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          brace: checked as boolean,
                        })
                      }
                    />
                    <span>{}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.pipe}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          pipe: checked as boolean,
                        })
                      }
                    />
                    <span>|</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.semicolon}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          semicolon: checked as boolean,
                        })
                      }
                    />
                    <span>;</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.colon}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          colon: checked as boolean,
                        })
                      }
                    />
                    <span>:</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.comma}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          comma: checked as boolean,
                        })
                      }
                    />
                    <span>,</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.period}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          period: checked as boolean,
                        })
                      }
                    />
                    <span>.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.less}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          less: checked as boolean,
                        })
                      }
                    />
                    <span>{"<"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.greater}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          greater: checked as boolean,
                        })
                      }
                    />
                    <span>{">"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={symbolsSelection.question}
                      onCheckedChange={(checked) =>
                        setSymbolsSelection({
                          ...symbolsSelection,
                          question: checked as boolean,
                        })
                      }
                    />
                    <span>?</span>
                  </label>
                </div>
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={excludeSimilar}
                onCheckedChange={(checked) =>
                  setExcludeSimilar(checked as boolean)
                }
              />
              <span>Exclude similar characters</span>
              <div className="relative group">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-0 top-6 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                  <div className="font-semibold mb-2">Excluded characters:</div>
                  <div className="space-y-1">
                    <div>Letters: I, l, O, o</div>
                    <div>Numbers: 0, 1</div>
                    <div>Symbols: _, |</div>
                  </div>
                </div>
              </div>
            </label>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={noRepeat}
                onCheckedChange={(checked) => setNoRepeat(checked as boolean)}
                disabled={!isNoRepeatAvailable()}
                className={!isNoRepeatAvailable() ? "opacity-50" : ""}
              />
              <span
                className={
                  !isNoRepeatAvailable()
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }
              >
                No repeated characters
              </span>
              <div className="relative group">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-0 top-6 w-96 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                  <div className="font-semibold mb-2">
                    Available conditions:
                  </div>
                  <div className="space-y-2">
                    <div>• 8 characters or fewer</div>
                    <div>• One of the following character sets:</div>
                    <div className="ml-4 space-y-1 text-[11px]">
                      <div>- Uppercase only</div>
                      <div>- Lowercase only</div>
                      <div>- Numbers only</div>
                      <div>- Uppercase + Numbers</div>
                      <div>- Lowercase + Numbers</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
