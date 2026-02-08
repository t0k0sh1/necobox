"use client";

import type { SchemeColor } from "@/lib/utils/color-scheme-designer";
import { getOptimalTextColor } from "@/lib/utils/color-scheme-designer";
import { useTranslations } from "next-intl";

/** プレビュー要素の色適用タイプ */
type ElementColorType = "bg" | "text" | "border";

/** プレビュー要素の定義 */
export interface PreviewElement {
  id: string;
  colorType: ElementColorType;
}

/** 全プレビュー要素の一覧 */
export const PREVIEW_ELEMENTS: PreviewElement[] = [
  // ページ全体
  { id: "page-bg", colorType: "bg" },
  { id: "page-border", colorType: "border" },
  // ナビゲーション
  { id: "nav-bg", colorType: "bg" },
  { id: "nav-border", colorType: "border" },
  { id: "nav-logo", colorType: "text" },
  { id: "nav-link", colorType: "text" },
  { id: "nav-signup-btn", colorType: "bg" },
  // ヒーロー
  { id: "hero-bg", colorType: "bg" },
  { id: "hero-title", colorType: "text" },
  { id: "hero-description", colorType: "text" },
  { id: "hero-primary-btn", colorType: "bg" },
  { id: "hero-secondary-btn", colorType: "border" },
  { id: "hero-secondary-btn-text", colorType: "text" },
  // フィーチャー
  { id: "feature-bg", colorType: "bg" },
  { id: "feature-heading", colorType: "text" },
  { id: "feature-card-bg", colorType: "bg" },
  { id: "feature-card-border", colorType: "border" },
  { id: "feature-icon", colorType: "bg" },
  { id: "feature-card-title", colorType: "text" },
  { id: "feature-card-desc", colorType: "text" },
  // テスティモニアル
  { id: "testimonial-bg", colorType: "bg" },
  { id: "testimonial-heading", colorType: "text" },
  { id: "testimonial-card-bg", colorType: "bg" },
  { id: "testimonial-card-border", colorType: "border" },
  { id: "testimonial-text", colorType: "text" },
  { id: "testimonial-name", colorType: "text" },
  { id: "testimonial-avatar", colorType: "bg" },
  // CTA
  { id: "cta-bg", colorType: "bg" },
  { id: "cta-heading", colorType: "text" },
  { id: "cta-description", colorType: "text" },
  { id: "cta-btn", colorType: "bg" },
  // フッター
  { id: "footer-bg", colorType: "bg" },
  { id: "footer-border", colorType: "border" },
  { id: "footer-text", colorType: "text" },
];

interface LandingPreviewProps {
  colors: SchemeColor[];
  colorMappings: Record<string, string>;
  linkingColorId: string | null;
  onElementClick?: (elementId: string) => void;
  /** ダークモードプレビュー時に true（グレースケールの hex2 を使用） */
  previewDark?: boolean;
}

export function LandingPreview({
  colors,
  colorMappings,
  linkingColorId,
  onElementClick,
  previewDark = false,
}: LandingPreviewProps) {
  const t = useTranslations("colorSchemeDesigner");
  const isLinking = !!linkingColorId;

  const getColor = (elementId: string): string | undefined => {
    const colorId = colorMappings[elementId];
    if (!colorId) return undefined;
    const color = colors.find((c) => c.id === colorId);
    if (!color) return undefined;
    // ダークモードプレビューかつ hex2 がある場合は hex2 を返す
    if (previewDark && color.hex2) return color.hex2;
    return color.hex;
  };

  const s = (
    elementId: string,
    colorType: ElementColorType = "bg"
  ): React.CSSProperties => {
    const hex = getColor(elementId);
    if (!hex) return {};
    if (colorType === "bg") {
      // ボーダーが明示指定されていなければ背景色で塗りつぶし、罫線を消す
      return { backgroundColor: hex, color: getOptimalTextColor(hex), borderColor: hex };
    }
    if (colorType === "text") {
      return { color: hex };
    }
    return { borderColor: hex };
  };

  const click = (elementId: string) => (e: React.MouseEvent) => {
    if (!isLinking) return;
    e.stopPropagation();
    onElementClick?.(elementId);
  };

  const lc = isLinking
    ? "cursor-crosshair hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-shadow"
    : "";

  const mr = (elementId: string) =>
    isLinking && colorMappings[elementId] ? "ring-1 ring-blue-300/50" : "";

  return (
    <div
      className={`rounded-lg border bg-white dark:bg-gray-900 overflow-hidden shadow-sm text-[10px] leading-tight select-none ${lc} ${mr("page-bg")} ${mr("page-border")}`}
      style={{ ...s("page-bg"), ...s("page-border", "border") }}
      onClick={click("page-bg")}
    >
      {/* ナビゲーション */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-b bg-gray-50 dark:bg-gray-800 ${lc} ${mr("nav-bg")} ${mr("nav-border")}`}
        style={{ ...s("nav-bg"), ...s("nav-border", "border") }}
        onClick={click("nav-bg")}
      >
        <div
          className={`flex items-center gap-2 ${lc} ${mr("nav-logo")}`}
          style={s("nav-logo", "text")}
          onClick={click("nav-logo")}
        >
          <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-600" />
          <span className="font-semibold text-gray-700 dark:text-gray-300" style={s("nav-logo", "text")}>
            Logo
          </span>
        </div>
        <div
          className={`flex gap-3 text-gray-500 dark:text-gray-400 ${lc} ${mr("nav-link")}`}
          style={s("nav-link", "text")}
          onClick={click("nav-link")}
        >
          <span>Features</span>
          <span>Pricing</span>
          <span>About</span>
        </div>
        <div
          className={`px-2 py-0.5 rounded bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium ${lc} ${mr("nav-signup-btn")}`}
          style={s("nav-signup-btn")}
          onClick={click("nav-signup-btn")}
        >
          Sign Up
        </div>
      </div>

      {/* ヒーローセクション */}
      <div
        className={`px-6 py-8 text-center bg-gray-100 dark:bg-gray-800/50 ${lc} ${mr("hero-bg")}`}
        style={s("hero-bg")}
        onClick={click("hero-bg")}
      >
        <div
          className={`text-lg font-bold text-gray-800 dark:text-gray-100 ${lc} ${mr("hero-title")}`}
          style={s("hero-title", "text")}
          onClick={click("hero-title")}
        >
          {t("preview.heroTitle")}
        </div>
        <p
          className={`mt-1 text-gray-500 dark:text-gray-400 max-w-[240px] mx-auto ${lc} ${mr("hero-description")}`}
          style={s("hero-description", "text")}
          onClick={click("hero-description")}
        >
          {t("preview.heroDescription")}
        </p>
        <div className="mt-3 flex justify-center gap-2">
          <div
            className={`px-3 py-1 rounded bg-gray-400 dark:bg-gray-600 text-white font-medium ${lc} ${mr("hero-primary-btn")}`}
            style={s("hero-primary-btn")}
            onClick={click("hero-primary-btn")}
          >
            Get Started
          </div>
          <div
            className={`px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 ${lc} ${mr("hero-secondary-btn")}`}
            style={{ ...s("hero-secondary-btn", "border"), ...s("hero-secondary-btn-text", "text") }}
            onClick={(e) => {
              if (!isLinking) return;
              e.stopPropagation();
              // ボーダーとテキストは別要素だが、同じDOMなのでボーダー優先
              onElementClick?.("hero-secondary-btn");
            }}
          >
            <span
              className={`${lc} ${mr("hero-secondary-btn-text")}`}
              style={s("hero-secondary-btn-text", "text")}
              onClick={click("hero-secondary-btn-text")}
            >
              Learn More
            </span>
          </div>
        </div>
      </div>

      {/* フィーチャーカード */}
      <div
        className={`px-4 py-4 ${lc} ${mr("feature-bg")}`}
        style={s("feature-bg")}
        onClick={click("feature-bg")}
      >
        <div
          className={`text-xs font-semibold text-center text-gray-700 dark:text-gray-200 mb-3 ${lc} ${mr("feature-heading")}`}
          style={s("feature-heading", "text")}
          onClick={click("feature-heading")}
        >
          Features
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`rounded border bg-gray-50 dark:bg-gray-800 p-2 text-center ${lc} ${mr("feature-card-bg")} ${mr("feature-card-border")}`}
              style={{ ...s("feature-card-bg"), ...s("feature-card-border", "border") }}
              onClick={click("feature-card-bg")}
            >
              <div
                className={`w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 mx-auto mb-1 ${lc} ${mr("feature-icon")}`}
                style={s("feature-icon")}
                onClick={click("feature-icon")}
              />
              <div
                className={`font-medium text-gray-700 dark:text-gray-200 ${lc} ${mr("feature-card-title")}`}
                style={s("feature-card-title", "text")}
                onClick={click("feature-card-title")}
              >
                Feature {i}
              </div>
              <div
                className={`text-gray-400 dark:text-gray-500 mt-0.5 ${lc} ${mr("feature-card-desc")}`}
                style={s("feature-card-desc", "text")}
                onClick={click("feature-card-desc")}
              >
                Short description
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* テスティモニアル */}
      <div
        className={`px-4 py-3 bg-gray-50 dark:bg-gray-800/50 ${lc} ${mr("testimonial-bg")}`}
        style={s("testimonial-bg")}
        onClick={click("testimonial-bg")}
      >
        <div
          className={`text-xs font-semibold text-center text-gray-700 dark:text-gray-200 mb-2 ${lc} ${mr("testimonial-heading")}`}
          style={s("testimonial-heading", "text")}
          onClick={click("testimonial-heading")}
        >
          Testimonials
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className={`rounded border bg-white dark:bg-gray-800 p-2 ${lc} ${mr("testimonial-card-bg")} ${mr("testimonial-card-border")}`}
              style={{ ...s("testimonial-card-bg"), ...s("testimonial-card-border", "border") }}
              onClick={click("testimonial-card-bg")}
            >
              <div
                className={`text-gray-400 dark:text-gray-500 italic ${lc} ${mr("testimonial-text")}`}
                style={s("testimonial-text", "text")}
                onClick={click("testimonial-text")}
              >
                &ldquo;Great product!&rdquo;
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div
                  className={`w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 ${lc} ${mr("testimonial-avatar")}`}
                  style={s("testimonial-avatar")}
                  onClick={click("testimonial-avatar")}
                />
                <span
                  className={`text-gray-600 dark:text-gray-300 font-medium ${lc} ${mr("testimonial-name")}`}
                  style={s("testimonial-name", "text")}
                  onClick={click("testimonial-name")}
                >
                  User {i}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA セクション */}
      <div
        className={`px-4 py-4 text-center bg-gray-100 dark:bg-gray-800/30 ${lc} ${mr("cta-bg")}`}
        style={s("cta-bg")}
        onClick={click("cta-bg")}
      >
        <div
          className={`text-xs font-semibold text-gray-700 dark:text-gray-200 ${lc} ${mr("cta-heading")}`}
          style={s("cta-heading", "text")}
          onClick={click("cta-heading")}
        >
          {t("preview.ctaTitle")}
        </div>
        <p
          className={`text-gray-400 dark:text-gray-500 mt-0.5 ${lc} ${mr("cta-description")}`}
          style={s("cta-description", "text")}
          onClick={click("cta-description")}
        >
          {t("preview.ctaDescription")}
        </p>
        <div
          className={`mt-2 inline-block px-3 py-1 rounded bg-gray-400 dark:bg-gray-600 text-white font-medium ${lc} ${mr("cta-btn")}`}
          style={s("cta-btn")}
          onClick={click("cta-btn")}
        >
          Start Free Trial
        </div>
      </div>

      {/* フッター */}
      <div
        className={`px-4 py-2 border-t bg-gray-50 dark:bg-gray-800 text-center ${lc} ${mr("footer-bg")} ${mr("footer-border")}`}
        style={{ ...s("footer-bg"), ...s("footer-border", "border") }}
        onClick={click("footer-bg")}
      >
        <span
          className={`text-gray-400 dark:text-gray-500 ${lc} ${mr("footer-text")}`}
          style={s("footer-text", "text")}
          onClick={click("footer-text")}
        >
          © 2025 Company Inc.
        </span>
      </div>
    </div>
  );
}
