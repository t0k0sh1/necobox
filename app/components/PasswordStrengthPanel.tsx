"use client";

import type { PasswordStrengthResult, NistComplianceResult } from "@/lib/utils/password-strength";
import type { HibpResult } from "@/lib/utils/hibp";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle, Info, Loader2, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";

interface PasswordStrengthPanelProps {
  strengthResult: PasswordStrengthResult | null;
  nistResult: NistComplianceResult | null;
  hibpResult: HibpResult | null;
  isStrengthLoading: boolean;
  isBreachChecking: boolean;
}

const SCORE_COLORS = [
  "bg-red-600",       // 0: Very Weak
  "bg-orange-500",    // 1: Weak
  "bg-yellow-500",    // 2: Fair
  "bg-green-500",     // 3: Strong
  "bg-green-700",     // 4: Very Strong
] as const;

const SCORE_TEXT_COLORS = [
  "text-red-600",
  "text-orange-500",
  "text-yellow-600",
  "text-green-600",
  "text-green-700",
] as const;

function getScoreLabel(
  score: number,
  t: ReturnType<typeof useTranslations<"passwordGenerator">>
): { label: string; description: string } {
  switch (score) {
    case 0:
      return { label: t("strength.veryWeak"), description: t("strength.veryWeakDescription") };
    case 1:
      return { label: t("strength.weak"), description: t("strength.weakDescription") };
    case 2:
      return { label: t("strength.fair"), description: t("strength.fairDescription") };
    case 3:
      return { label: t("strength.strong"), description: t("strength.strongDescription") };
    case 4:
      return { label: t("strength.veryStrong"), description: t("strength.veryStrongDescription") };
    default:
      return { label: "", description: "" };
  }
}

export function PasswordStrengthPanel({
  strengthResult,
  nistResult,
  hibpResult,
  isStrengthLoading,
  isBreachChecking,
}: PasswordStrengthPanelProps) {
  const t = useTranslations("passwordGenerator");

  if (!strengthResult && !isStrengthLoading) return null;

  const score = strengthResult?.score ?? 0;
  const { label, description } = getScoreLabel(score, t);

  return (
    <div className="space-y-3">
      {/* 5セグメントプログレスバー */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          {isStrengthLoading ? (
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
            </span>
          ) : (
            <span className={`text-sm font-semibold ${SCORE_TEXT_COLORS[score]}`}>
              {label}
            </span>
          )}
          {strengthResult?.crackTimeDisplay && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t("strength.crackTime", { time: strengthResult.crackTimeDisplay })}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                !isStrengthLoading && strengthResult && i <= score
                  ? SCORE_COLORS[score]
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>
        {!isStrengthLoading && strengthResult && (
          <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
        )}
      </div>

      {/* zxcvbn フィードバック */}
      {strengthResult?.feedback.warning && (
        <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md p-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{strengthResult.feedback.warning}</span>
        </div>
      )}
      {strengthResult?.feedback.suggestions && strengthResult.feedback.suggestions.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md p-2">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <ul className="space-y-0.5">
            {strengthResult.feedback.suggestions.map((suggestion, i) => (
              <li key={i}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* NIST準拠バッジ */}
      {nistResult && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("nist.title")}:
          </span>
          {nistResult.level === "compliant" && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-full px-2 py-0.5">
              <ShieldCheck className="w-3 h-3" />
              {t("nist.compliant")}
            </span>
          )}
          {nistResult.level === "multi-factor-only" && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-full px-2 py-0.5">
              <ShieldAlert className="w-3 h-3" />
              {t("nist.multiFactorOnly")}
            </span>
          )}
          {nistResult.level === "non-compliant" && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-full px-2 py-0.5">
              <XCircle className="w-3 h-3" />
              {t("nist.nonCompliant")}
            </span>
          )}
        </div>
      )}

      {/* HIBP漏洩チェック結果 */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {t("hibp.title")}:
        </span>
        {isBreachChecking ? (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            {t("hibp.checking")}
          </span>
        ) : hibpResult?.error ? (
          <span className="text-xs text-gray-500">{t("hibp.error")}</span>
        ) : hibpResult?.breached ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400">
            <AlertTriangle className="w-3 h-3" />
            {t("hibp.breached", { count: hibpResult.count.toLocaleString() })}
          </span>
        ) : hibpResult ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            {t("hibp.safe")}
          </span>
        ) : null}
      </div>

      {/* HIBP漏洩警告 */}
      {hibpResult?.breached && (
        <div className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md p-2">
          <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{t("hibp.breachedWarning")}</span>
        </div>
      )}

      {/* プライバシーノート */}
      <p className="text-[10px] text-gray-400 dark:text-gray-500">
        {t("hibp.privacyNote")}
      </p>
    </div>
  );
}
