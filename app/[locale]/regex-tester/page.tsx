"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  executeRegex,
  validatePattern,
  buildFlagsString,
  REGEX_PRESETS,
  type RegexResult,
} from "@/lib/utils/regex-tester";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";

const FLAG_OPTIONS = ["g", "i", "m", "s", "u"] as const;

export default function RegexTesterPage() {
  const t = useTranslations("regexTester");

  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
  });
  const [testString, setTestString] = useState("");

  const flagsString = useMemo(() => buildFlagsString(flags), [flags]);

  // バリデーション
  const validation = useMemo(
    () => validatePattern(pattern, flagsString),
    [pattern, flagsString]
  );

  // マッチ結果
  const result = useMemo<RegexResult>(() => {
    if (!pattern || !testString || !validation.valid) {
      return { matches: [], matchCount: 0, error: validation.error };
    }
    return executeRegex(pattern, flagsString, testString);
  }, [pattern, flagsString, testString, validation]);

  // フラグトグル
  const toggleFlag = (flag: string) => {
    setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
  };

  // プリセット選択
  const handlePresetSelect = (presetId: string) => {
    const preset = REGEX_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setPattern(preset.pattern);
      const newFlags: Record<string, boolean> = {
        g: false,
        i: false,
        m: false,
        s: false,
        u: false,
      };
      for (const f of preset.flags) {
        if (f in newFlags) {
          newFlags[f] = true;
        }
      }
      setFlags(newFlags);
    }
  };

  // マッチハイライト付きテキストを生成
  const highlightedText = useMemo(() => {
    if (result.matchCount === 0 || !testString) {
      return null;
    }

    const parts: { text: string; isMatch: boolean; matchIndex: number }[] = [];
    let lastIndex = 0;

    for (let i = 0; i < result.matches.length; i++) {
      const match = result.matches[i];
      if (match.index > lastIndex) {
        parts.push({
          text: testString.slice(lastIndex, match.index),
          isMatch: false,
          matchIndex: -1,
        });
      }
      parts.push({
        text: match.fullMatch,
        isMatch: true,
        matchIndex: i,
      });
      lastIndex = match.endIndex;
    }

    if (lastIndex < testString.length) {
      parts.push({
        text: testString.slice(lastIndex),
        isMatch: false,
        matchIndex: -1,
      });
    }

    return parts;
  }, [result, testString]);

  return (
    <div className="flex h-full items-start justify-center py-4 px-4">
      <div className="w-full max-w-4xl">
        <Breadcrumbs items={[{ label: t("breadcrumb") }]} />

        <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border mt-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("description")}
            </p>
          </div>

          {/* プリセット */}
          <div className="space-y-2">
            <Label>{t("presets")}</Label>
            <div className="flex flex-wrap gap-2">
              {REGEX_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect(preset.id)}
                >
                  {t(preset.i18nKey as Parameters<typeof t>[0])}
                </Button>
              ))}
            </div>
          </div>

          {/* パターン入力 */}
          <div className="space-y-2">
            <Label>{t("pattern")}</Label>
            <div className="flex gap-2 items-center">
              <span className="text-gray-400 font-mono text-lg">/</span>
              <Input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder={t("patternPlaceholder")}
                className="font-mono flex-1"
                aria-label={t("pattern")}
              />
              <span className="text-gray-400 font-mono text-lg">/</span>
              <span className="text-gray-600 dark:text-gray-400 font-mono text-sm min-w-[3ch]">
                {flagsString}
              </span>
            </div>

            {/* フラグ */}
            <div className="flex gap-2">
              {FLAG_OPTIONS.map((flag) => (
                <Button
                  key={flag}
                  variant={flags[flag] ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFlag(flag)}
                  className="w-9 h-9 font-mono"
                  aria-label={`${t("flag")} ${flag}`}
                  aria-pressed={flags[flag]}
                >
                  {flag}
                </Button>
              ))}
            </div>

            {/* エラー表示 */}
            {validation.error && (
              <p className="text-red-500 text-sm">{validation.error}</p>
            )}
          </div>

          {/* テスト文字列 */}
          <div className="space-y-2">
            <Label>{t("testString")}</Label>
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder={t("testStringPlaceholder")}
              className="w-full min-h-[120px] rounded-md border bg-transparent px-3 py-2 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("testString")}
            />
          </div>

          {/* マッチ結果 */}
          <div className="space-y-4">
            {/* マッチ数 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("matches")}:
              </span>
              <span
                className={`text-sm font-mono ${
                  result.matchCount > 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-500"
                }`}
              >
                {result.matchCount}
              </span>
            </div>

            {/* ハイライト表示 */}
            {highlightedText && (
              <div className="space-y-2">
                <Label>{t("highlightedResult")}</Label>
                <div className="rounded-md border bg-gray-50 dark:bg-gray-900 p-4 font-mono text-sm whitespace-pre-wrap break-all">
                  {highlightedText.map((part, i) =>
                    part.isMatch ? (
                      <mark
                        key={i}
                        className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 rounded-sm px-0.5"
                      >
                        {part.text}
                      </mark>
                    ) : (
                      <span key={i}>{part.text}</span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* キャプチャグループ */}
            {result.matches.some((m) => m.groups.length > 0) && (
              <div className="space-y-2">
                <Label>{t("captureGroups")}</Label>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900">
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                          {t("matchNumber")}
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                          {t("groupNumber")}
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                          {t("groupName")}
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                          {t("groupValue")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.matches.map((match, mi) =>
                        match.groups.map((group, gi) => (
                          <tr
                            key={`${mi}-${gi}`}
                            className="border-t"
                          >
                            <td className="px-3 py-2 font-mono">
                              {mi + 1}
                            </td>
                            <td className="px-3 py-2 font-mono">
                              {group.index}
                            </td>
                            <td className="px-3 py-2 font-mono text-gray-500">
                              {group.name ?? "-"}
                            </td>
                            <td className="px-3 py-2 font-mono">
                              {group.value}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
