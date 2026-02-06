"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GregorianDateInput,
  WarekiDateInput,
} from "@/components/date-input";
import {
  gregorianToWareki,
  warekiToGregorian,
  getWeekdayNameJa,
  getWeekdayNameEn,
  type ConversionResult,
} from "@/lib/utils/wareki-converter";
import { Copy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

// 初期値を取得するヘルパー関数
function getInitialDate() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  // gregorianToWareki を使用して動的に和暦年と元号を取得
  const conversionResult = gregorianToWareki(currentYear, currentMonth, currentDay);
  const warekiYear = conversionResult.success && conversionResult.wareki
    ? conversionResult.wareki.year
    : 1;
  const eraName = conversionResult.success && conversionResult.wareki
    ? conversionResult.wareki.era.name
    : "令和";

  return {
    year: String(currentYear),
    month: String(currentMonth),
    day: String(currentDay),
    warekiYear: String(warekiYear),
    eraName,
  };
}

export default function WarekiConverterPage() {
  const t = useTranslations("warekiConverter");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  // タブ状態
  const [activeTab, setActiveTab] = useState<
    "gregorianToWareki" | "warekiToGregorian"
  >("gregorianToWareki");

  // 西暦→和暦 入力 (遅延初期化)
  const [gYear, setGYear] = useState<string>(() => getInitialDate().year);
  const [gMonth, setGMonth] = useState<string>(() => getInitialDate().month);
  const [gDay, setGDay] = useState<string>(() => getInitialDate().day);

  // 和暦→西暦 入力 (遅延初期化)
  const [selectedEra, setSelectedEra] = useState<string>(() => getInitialDate().eraName);
  const [wYear, setWYear] = useState<string>(() => getInitialDate().warekiYear);
  const [wMonth, setWMonth] = useState<string>(() => getInitialDate().month);
  const [wDay, setWDay] = useState<string>(() => getInitialDate().day);

  // 結果・エラー
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [copied, setCopied] = useState(false);

  // 西暦→和暦 変換
  const handleGregorianToWareki = () => {
    const year = parseInt(gYear);
    const month = parseInt(gMonth);
    const day = parseInt(gDay);

    const conversionResult = gregorianToWareki(year, month, day);
    setResult(conversionResult);
  };

  // 和暦→西暦 変換
  const handleWarekiToGregorian = () => {
    const year = parseInt(wYear);
    const month = parseInt(wMonth);
    const day = parseInt(wDay);

    const conversionResult = warekiToGregorian(selectedEra, year, month, day);
    setResult(conversionResult);
  };

  // コピー
  const handleCopy = async () => {
    if (!result?.success) return;

    let text = "";
    if (activeTab === "gregorianToWareki" && result.wareki) {
      text =
        locale === "ja" ? result.wareki.formatted : result.wareki.formattedEn;
    } else if (result.gregorian) {
      text = `${result.gregorian.year}/${result.gregorian.month}/${result.gregorian.day}`;
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 曜日名を取得
  const getWeekdayName = (weekday: number): string => {
    if (locale === "ja") {
      return getWeekdayNameJa(weekday) + "曜日";
    }
    return getWeekdayNameEn(weekday);
  };

  // エラーメッセージを取得
  const getErrorMessage = (errorKey?: string, errorParams?: Record<string, string | number>): string => {
    if (!errorKey) return "";

    // next-intl の t 関数に直接パラメータを渡す
    return t(`error.${errorKey}` as Parameters<typeof t>[0], errorParams);
  };

  // タブ変更時に結果をクリア
  const handleTabChange = (value: string) => {
    setActiveTab(value as "gregorianToWareki" | "warekiToGregorian");
    setResult(null);
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
              <TabsTrigger value="gregorianToWareki">
                {t("tabs.gregorianToWareki")}
              </TabsTrigger>
              <TabsTrigger value="warekiToGregorian">
                {t("tabs.warekiToGregorian")}
              </TabsTrigger>
            </TabsList>

            {/* 西暦 → 和暦 */}
            <TabsContent value="gregorianToWareki" className="space-y-4 mt-4">
              <GregorianDateInput
                year={gYear}
                month={gMonth}
                day={gDay}
                onYearChange={setGYear}
                onMonthChange={setGMonth}
                onDayChange={setGDay}
                yearLabel={t("input.year")}
                monthLabel={t("input.month")}
                dayLabel={t("input.day")}
              />

              <Button onClick={handleGregorianToWareki} className="w-full">
                {tCommon("convert")}
              </Button>
            </TabsContent>

            {/* 和暦 → 西暦 */}
            <TabsContent value="warekiToGregorian" className="space-y-4 mt-4">
              <WarekiDateInput
                selectedEra={selectedEra}
                year={wYear}
                month={wMonth}
                day={wDay}
                onEraChange={setSelectedEra}
                onYearChange={setWYear}
                onMonthChange={setWMonth}
                onDayChange={setWDay}
                eraLabel={t("input.era")}
                yearLabel={t("input.year")}
                monthLabel={t("input.month")}
                dayLabel={t("input.day")}
                locale={locale}
              />

              <Button onClick={handleWarekiToGregorian} className="w-full">
                {tCommon("convert")}
              </Button>
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
              <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-6">
                <div className="text-center space-y-3">
                  {/* 和暦結果 (西暦→和暦の場合) */}
                  {activeTab === "gregorianToWareki" && result.wareki && (
                    <>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("result.wareki")}
                      </p>
                      <p className="text-2xl font-semibold">
                        {locale === "ja"
                          ? result.wareki.formatted
                          : result.wareki.formattedEn}
                      </p>
                    </>
                  )}

                  {/* 西暦結果 (和暦→西暦の場合) */}
                  {activeTab === "warekiToGregorian" && result.gregorian && (
                    <>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("result.gregorian")}
                      </p>
                      <p className="text-2xl font-semibold">
                        {result.gregorian.year}/{result.gregorian.month}/
                        {result.gregorian.day}
                      </p>
                    </>
                  )}

                  {/* 曜日 */}
                  {result.gregorian && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("result.weekday")}:{" "}
                      {getWeekdayName(result.gregorian.weekday)}
                    </p>
                  )}
                </div>
              </div>

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
