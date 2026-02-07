"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/app/components/CopyButton";
import { PasswordStrengthPanel } from "@/app/components/PasswordStrengthPanel";
import { evaluatePasswordStrength, evaluateNistCompliance } from "@/lib/utils/password-strength";
import type { PasswordStrengthResult, NistComplianceResult } from "@/lib/utils/password-strength";
import { checkPasswordBreach } from "@/lib/utils/hibp";
import type { HibpResult } from "@/lib/utils/hibp";
import { Info, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export default function RandomPasswordPage() {
  const t = useTranslations("passwordGenerator");
  const tCommon = useTranslations("common");

  // タブ状態
  const [activeTab, setActiveTab] = useState<"generate" | "check">("generate");

  // 生成タブ状態
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(false);
  const [spaces, setSpaces] = useState(false);
  const [unicode, setUnicode] = useState(false);
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

  // チェッカータブ状態
  const [checkPassword, setCheckPassword] = useState("");

  // 強度判定状態（両タブ共通）
  const [strengthResult, setStrengthResult] = useState<PasswordStrengthResult | null>(null);
  const [nistResult, setNistResult] = useState<NistComplianceResult | null>(null);
  const [hibpResult, setHibpResult] = useState<HibpResult | null>(null);
  const [isStrengthLoading, setIsStrengthLoading] = useState(false);
  const [isBreachChecking, setIsBreachChecking] = useState(false);

  // デバウンス用ref
  const strengthTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 現在評価対象のパスワード
  const currentPassword = activeTab === "generate" ? generatedPassword : checkPassword;

  // パスワード強度評価（zxcvbn + NIST + HIBP）
  const evaluatePassword = useCallback(async (password: string) => {
    if (!password) {
      setStrengthResult(null);
      setNistResult(null);
      setHibpResult(null);
      return;
    }

    // NIST判定は同期
    setNistResult(evaluateNistCompliance(password));

    // zxcvbn評価（非同期）
    setIsStrengthLoading(true);
    try {
      const result = await evaluatePasswordStrength(password);
      setStrengthResult(result);
    } finally {
      setIsStrengthLoading(false);
    }

    // HIBP漏洩チェック（並行実行）
    setIsBreachChecking(true);
    setHibpResult(null);
    try {
      const result = await checkPasswordBreach(password);
      setHibpResult(result);
    } finally {
      setIsBreachChecking(false);
    }
  }, []);

  // noRepeat利用可否チェック
  const isNoRepeatAvailable = () => {
    if (length > 8) return false;

    const charTypeCount = [uppercase, lowercase, numbers, symbols].filter(
      Boolean
    ).length;

    if (charTypeCount === 1) {
      return (
        (uppercase && !lowercase && !numbers && !symbols) ||
        (!uppercase && lowercase && !numbers && !symbols) ||
        (!uppercase && !lowercase && numbers && !symbols)
      );
    }

    if (charTypeCount === 2 && numbers) {
      return (
        (uppercase && !lowercase && numbers && !symbols) ||
        (!uppercase && lowercase && numbers && !symbols)
      );
    }

    return false;
  };

  // パスワード生成
  const generatePassword = async () => {
    try {
      const settings = {
        uppercase,
        lowercase,
        numbers,
        symbols,
        symbolsSelection: symbols ? symbolsSelection : undefined,
        spaces,
        unicode,
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

  // noRepeat自動無効化
  useEffect(() => {
    if (!isNoRepeatAvailable() && noRepeat) {
      setNoRepeat(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, uppercase, lowercase, numbers, symbols, noRepeat]);

  // 長さデバウンス
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLength(length);
    }, 500);
    return () => clearTimeout(timer);
  }, [length]);

  // 生成タブ: 設定変更時にパスワード生成
  useEffect(() => {
    generatePassword();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    uppercase,
    lowercase,
    numbers,
    symbols,
    spaces,
    unicode,
    excludeSimilar,
    noRepeat,
    debouncedLength,
  ]);

  // 生成タブ: パスワード変更時に強度評価
  useEffect(() => {
    if (activeTab === "generate" && generatedPassword) {
      evaluatePassword(generatedPassword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedPassword, activeTab]);

  // チェッカータブ: 入力デバウンス後に強度評価
  useEffect(() => {
    if (activeTab !== "check") return;

    if (strengthTimerRef.current) {
      clearTimeout(strengthTimerRef.current);
    }

    if (!checkPassword) {
      setStrengthResult(null);
      setNistResult(null);
      setHibpResult(null);
      return;
    }

    strengthTimerRef.current = setTimeout(() => {
      evaluatePassword(checkPassword);
    }, 300);

    return () => {
      if (strengthTimerRef.current) {
        clearTimeout(strengthTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkPassword, activeTab]);

  // タブ切替時に評価結果をリセットして再評価
  useEffect(() => {
    setStrengthResult(null);
    setNistResult(null);
    setHibpResult(null);

    if (activeTab === "generate" && generatedPassword) {
      evaluatePassword(generatedPassword);
    } else if (activeTab === "check" && checkPassword) {
      evaluatePassword(checkPassword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="flex h-full items-start justify-center py-4 px-4">
      <div className="w-full max-w-2xl">
        <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
        <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border mt-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("description")}
            </p>
          </div>

          {/* タブ: 生成 / チェック */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "generate" | "check")}
          >
            <TabsList className="w-full">
              <TabsTrigger value="generate" className="flex-1">
                {t("tabs.generate")}
              </TabsTrigger>
              <TabsTrigger value="check" className="flex-1">
                {t("tabs.check")}
              </TabsTrigger>
            </TabsList>

            {/* 生成タブ */}
            <TabsContent value="generate" className="space-y-6">
              {/* 生成パスワード表示 */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md border overflow-hidden">
                <div className="p-4 min-h-[60px] flex items-center">
                  {generatedPassword ? (
                    <div className="flex items-center gap-3 w-full">
                      <span className="font-mono text-lg flex-1 break-all">
                        {generatedPassword}
                      </span>
                      <CopyButton text={generatedPassword} />
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
                      {t("generatedPasswordPlaceholder")}
                    </span>
                  )}
                </div>
              </div>

              {/* 強度パネル */}
              {(strengthResult || isStrengthLoading || currentPassword) && (
                <PasswordStrengthPanel
                  strengthResult={strengthResult}
                  nistResult={nistResult}
                  hibpResult={hibpResult}
                  isStrengthLoading={isStrengthLoading}
                  isBreachChecking={isBreachChecking}
                />
              )}

              {/* パスワード長 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">{t("passwordLength")}</h2>
                  <span className="text-lg font-medium">
                    {length} {tCommon("chars")}
                  </span>
                </div>
                <Slider
                  value={[length]}
                  onValueChange={(value) => setLength(value[0])}
                  min={1}
                  max={128}
                  step={1}
                />
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>1</span>
                  <span>128</span>
                </div>
              </div>

              {/* 文字オプション */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={uppercase}
                    onCheckedChange={(checked) =>
                      setUppercase(checked as boolean)
                    }
                  />
                  <span>{t("includeUppercase")}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={lowercase}
                    onCheckedChange={(checked) =>
                      setLowercase(checked as boolean)
                    }
                  />
                  <span>{t("includeLowercase")}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={numbers}
                    onCheckedChange={(checked) =>
                      setNumbers(checked as boolean)
                    }
                  />
                  <span>{t("includeNumbers")}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={symbols}
                    onCheckedChange={(checked) =>
                      setSymbols(checked as boolean)
                    }
                  />
                  <span>{t("includeSymbols")}</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={spaces}
                    onCheckedChange={(checked) =>
                      setSpaces(checked as boolean)
                    }
                  />
                  <span>{t("includeSpaces")}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={unicode}
                    onCheckedChange={(checked) =>
                      setUnicode(checked as boolean)
                    }
                  />
                  <span>{t("includeUnicode")}</span>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute left-0 top-6 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                      {t("includeUnicodeTooltip")}
                    </div>
                  </div>
                </label>

                {/* 記号選択 */}
                {symbols && (
                  <div className="ml-7 space-y-2 border-l pl-4">
                    <div className="text-sm font-medium mb-2">
                      {t("selectSymbols")}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries({
                        exclamation: "!",
                        at: "@",
                        hash: "#",
                        dollar: "$",
                        percent: "%",
                        caret: "^",
                        ampersand: "&",
                        asterisk: "*",
                        parenthesis: "()",
                        underscore: "_",
                        plus: "+",
                        minus: "-",
                        equals: "=",
                        bracket: "[]",
                        brace: "{}",
                        pipe: "|",
                        semicolon: ";",
                        colon: ":",
                        comma: ",",
                        period: ".",
                        less: "<",
                        greater: ">",
                        question: "?",
                      }).map(([key, char]) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={symbolsSelection[key]}
                            onCheckedChange={(checked) =>
                              setSymbolsSelection({
                                ...symbolsSelection,
                                [key]: checked as boolean,
                              })
                            }
                          />
                          <span>{char}</span>
                        </label>
                      ))}
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
                  <span>{t("excludeSimilar")}</span>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute left-0 top-6 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                      <div className="font-semibold mb-2">
                        {t("excludeSimilarTooltip.title")}
                      </div>
                      <div className="space-y-1">
                        <div>{t("excludeSimilarTooltip.letters")}</div>
                        <div>{t("excludeSimilarTooltip.numbers")}</div>
                        <div>{t("excludeSimilarTooltip.symbols")}</div>
                      </div>
                    </div>
                  </div>
                </label>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={noRepeat}
                    onCheckedChange={(checked) =>
                      setNoRepeat(checked as boolean)
                    }
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
                    {t("noRepeat")}
                  </span>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute left-0 top-6 w-96 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                      <div className="font-semibold mb-2">
                        {t("noRepeatTooltip.title")}
                      </div>
                      <div className="space-y-2">
                        <div>{t("noRepeatTooltip.condition1")}</div>
                        <div>{t("noRepeatTooltip.condition2")}</div>
                        <div className="ml-4 space-y-1 text-[11px]">
                          <div>{t("noRepeatTooltip.uppercaseOnly")}</div>
                          <div>{t("noRepeatTooltip.lowercaseOnly")}</div>
                          <div>{t("noRepeatTooltip.numbersOnly")}</div>
                          <div>{t("noRepeatTooltip.uppercaseNumbers")}</div>
                          <div>{t("noRepeatTooltip.lowercaseNumbers")}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* チェッカータブ */}
            <TabsContent value="check" className="space-y-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("checker.description")}
              </p>

              {/* パスワード入力 */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md border overflow-hidden">
                <div className="p-4">
                  <input
                    type="text"
                    value={checkPassword}
                    onChange={(e) => setCheckPassword(e.target.value)}
                    placeholder={t("checker.placeholder")}
                    className="w-full bg-transparent font-mono text-lg outline-none placeholder:text-gray-400"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* 強度パネル */}
              {(strengthResult || isStrengthLoading || checkPassword) && (
                <PasswordStrengthPanel
                  strengthResult={strengthResult}
                  nistResult={nistResult}
                  hibpResult={hibpResult}
                  isStrengthLoading={isStrengthLoading}
                  isBreachChecking={isBreachChecking}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
