"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateAgeFromGregorian,
  calculateAgeFromWareki,
  type AgeCalculationResult,
} from "@/lib/utils/age-calculator";
import { getEras, type Era } from "@/lib/utils/wareki-converter";
import { Copy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useMemo } from "react";

export default function AgeCalculatorPage() {
  const t = useTranslations("ageCalculator");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  // タブ状態
  const [activeTab, setActiveTab] = useState<"gregorian" | "wareki">(
    "gregorian"
  );

  // 西暦入力
  const [gYear, setGYear] = useState<string>("");
  const [gMonth, setGMonth] = useState<string>("");
  const [gDay, setGDay] = useState<string>("");

  // 和暦入力
  const [selectedEra, setSelectedEra] = useState<string>("令和");
  const [wYear, setWYear] = useState<string>("");
  const [wMonth, setWMonth] = useState<string>("");
  const [wDay, setWDay] = useState<string>("");

  // 元号一覧
  const [eras] = useState<Era[]>(getEras());

  // 結果・エラー
  const [copied, setCopied] = useState(false);

  // 西暦から年齢を計算（useMemo で派生状態として計算）
  const gregorianResult = useMemo<AgeCalculationResult | null>(() => {
    if (!gYear || !gMonth || !gDay) return null;

    const year = parseInt(gYear);
    const month = parseInt(gMonth);
    const day = parseInt(gDay);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return { success: false, errorKey: "invalidDate" };
    }

    return calculateAgeFromGregorian(year, month, day);
  }, [gYear, gMonth, gDay]);

  // 和暦から年齢を計算（useMemo で派生状態として計算）
  const warekiResult = useMemo<AgeCalculationResult | null>(() => {
    if (!wYear || !wMonth || !wDay) return null;

    const year = parseInt(wYear);
    const month = parseInt(wMonth);
    const day = parseInt(wDay);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return { success: false, errorKey: "invalidDate" };
    }

    return calculateAgeFromWareki(selectedEra, year, month, day);
  }, [selectedEra, wYear, wMonth, wDay]);

  // アクティブなタブに応じた結果を取得
  const result = activeTab === "gregorian" ? gregorianResult : warekiResult;

  // コピー
  const handleCopy = async () => {
    if (!result?.success || !result.currentAge) return;

    const text =
      locale === "ja"
        ? `${result.currentAge.years}歳${result.currentAge.months}ヶ月${result.currentAge.days}日`
        : `${result.currentAge.years} years, ${result.currentAge.months} months, ${result.currentAge.days} days`;

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // エラーメッセージを取得
  const getErrorMessage = (
    errorKey?: string,
    errorParams?: Record<string, string | number>
  ): string => {
    if (!errorKey) return "";
    return t(`error.${errorKey}` as Parameters<typeof t>[0], errorParams);
  };

  // タブ変更時
  const handleTabChange = (value: string) => {
    setActiveTab(value as "gregorian" | "wareki");
  };

  // 誕生日の表示フォーマット
  const formatBirthday = (date: Date): string => {
    if (locale === "ja") {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

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

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gregorian">
                {t("tabs.gregorian")}
              </TabsTrigger>
              <TabsTrigger value="wareki">{t("tabs.wareki")}</TabsTrigger>
            </TabsList>

            {/* 西暦入力 */}
            <TabsContent value="gregorian" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="g-year">{t("input.year")}</Label>
                  <Input
                    id="g-year"
                    type="number"
                    placeholder="1990"
                    value={gYear}
                    onChange={(e) => setGYear(e.target.value)}
                    min="1868"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="g-month">{t("input.month")}</Label>
                  <Input
                    id="g-month"
                    type="number"
                    placeholder="1"
                    value={gMonth}
                    onChange={(e) => setGMonth(e.target.value)}
                    min="1"
                    max="12"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="g-day">{t("input.day")}</Label>
                  <Input
                    id="g-day"
                    type="number"
                    placeholder="1"
                    value={gDay}
                    onChange={(e) => setGDay(e.target.value)}
                    min="1"
                    max="31"
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>

            {/* 和暦入力 */}
            <TabsContent value="wareki" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="era-select">{t("input.era")}</Label>
                <select
                  id="era-select"
                  value={selectedEra}
                  onChange={(e) => setSelectedEra(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-white dark:bg-black text-gray-900 dark:text-gray-100"
                >
                  {eras.map((era) => (
                    <option key={era.abbr} value={era.name}>
                      {locale === "ja" ? era.name : era.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="w-year">{t("input.year")}</Label>
                  <Input
                    id="w-year"
                    type="number"
                    placeholder="1"
                    value={wYear}
                    onChange={(e) => setWYear(e.target.value)}
                    min="1"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="w-month">{t("input.month")}</Label>
                  <Input
                    id="w-month"
                    type="number"
                    placeholder="1"
                    value={wMonth}
                    onChange={(e) => setWMonth(e.target.value)}
                    min="1"
                    max="12"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="w-day">{t("input.day")}</Label>
                  <Input
                    id="w-day"
                    type="number"
                    placeholder="1"
                    value={wDay}
                    onChange={(e) => setWDay(e.target.value)}
                    min="1"
                    max="31"
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* エラー表示 */}
          {result && !result.success && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">
                {getErrorMessage(result.errorKey, result.errorParams)}
              </p>
            </div>
          )}

          {/* 結果表示 */}
          {result?.success && (
            <div className="space-y-4">
              {/* 生年月日 */}
              <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {t("result.birthDate")}
                </p>
                <div className="space-y-1">
                  <p className="text-lg font-semibold">
                    {result.birthDate?.year}/{result.birthDate?.month}/
                    {result.birthDate?.day}
                  </p>
                  {result.birthDate?.wareki && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {locale === "ja"
                        ? result.birthDate.wareki.formatted
                        : result.birthDate.wareki.formattedEn}
                    </p>
                  )}
                </div>
              </div>

              {/* 現在の年齢 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                  {t("result.currentAge")}
                </p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {locale === "ja"
                    ? `${result.currentAge?.years}歳`
                    : `${result.currentAge?.years} years old`}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  {locale === "ja"
                    ? `${result.currentAge?.years}歳${result.currentAge?.months}ヶ月${result.currentAge?.days}日`
                    : `${result.currentAge?.years} years, ${result.currentAge?.months} months, ${result.currentAge?.days} days`}
                </p>
              </div>

              {/* 今年の誕生日を迎えた時の年齢 */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                  {t("result.ageThisYear")}
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {locale === "ja"
                    ? `${result.ageThisYear}歳`
                    : `${result.ageThisYear} years old`}
                </p>
                {result.birthdayThisYear && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    {formatBirthday(result.birthdayThisYear.date)}
                    {result.birthdayThisYear.isPast
                      ? ` (${t("result.birthdayPassed")})`
                      : ` (${t("result.birthdayUpcoming")})`}
                  </p>
                )}
              </div>

              {/* 次の誕生日までの日数 */}
              {result.daysUntilNextBirthday !== undefined && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md p-4">
                  <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                    {t("result.daysUntilBirthday")}
                  </p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {locale === "ja"
                      ? `${result.daysUntilNextBirthday}日`
                      : `${result.daysUntilNextBirthday} days`}
                  </p>
                </div>
              )}

              <Button
                onClick={handleCopy}
                variant="outline"
                className="w-full gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? tCommon("copied") + "!" : tCommon("copy")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
