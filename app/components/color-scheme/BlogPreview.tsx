"use client";

import type { SchemeColor, ElementContrastWarning } from "@/lib/utils/color-scheme-designer";
import { getOptimalTextColor, resolveElementContrasts } from "@/lib/utils/color-scheme-designer";
import { AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMemo } from "react";

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
  // ヘッダー
  { id: "header-bg", colorType: "bg" },
  { id: "header-border", colorType: "border" },
  { id: "header-logo", colorType: "text" },
  { id: "header-nav-link", colorType: "text" },
  { id: "header-nav-active", colorType: "text" },
  // 記事
  { id: "article-bg", colorType: "bg" },
  { id: "article-border", colorType: "border" },
  { id: "article-title", colorType: "text" },
  { id: "article-meta", colorType: "text" },
  { id: "article-body", colorType: "text" },
  { id: "article-link", colorType: "text" },
  { id: "article-h2", colorType: "text" },
  { id: "article-blockquote-bg", colorType: "bg" },
  { id: "article-blockquote-border", colorType: "border" },
  { id: "article-blockquote-text", colorType: "text" },
  { id: "article-code-bg", colorType: "bg" },
  { id: "article-code-text", colorType: "text" },
  { id: "article-tag-bg", colorType: "bg" },
  { id: "article-tag-text", colorType: "text" },
  // サイドバー
  { id: "sidebar-bg", colorType: "bg" },
  { id: "sidebar-border", colorType: "border" },
  { id: "sidebar-heading", colorType: "text" },
  { id: "sidebar-profile-avatar", colorType: "bg" },
  { id: "sidebar-profile-name", colorType: "text" },
  { id: "sidebar-profile-bio", colorType: "text" },
  { id: "sidebar-category-bg", colorType: "bg" },
  { id: "sidebar-category-text", colorType: "text" },
  { id: "sidebar-category-count", colorType: "text" },
  // フッター
  { id: "footer-bg", colorType: "bg" },
  { id: "footer-border", colorType: "border" },
  { id: "footer-text", colorType: "text" },
  { id: "footer-link", colorType: "text" },
  { id: "footer-divider", colorType: "border" },
];

/** 要素 ID → 人間が読める表示名のマッピング */
export const ELEMENT_LABELS: Record<string, string> = {
  "page-bg": "Page BG",
  "page-border": "Page Border",
  "header-bg": "Header BG",
  "header-border": "Header Border",
  "header-logo": "Header Logo",
  "header-nav-link": "Nav Link",
  "header-nav-active": "Nav Active",
  "article-bg": "Article BG",
  "article-border": "Article Border",
  "article-title": "Article Title",
  "article-meta": "Article Meta",
  "article-body": "Article Body",
  "article-link": "Article Link",
  "article-h2": "Article H2",
  "article-blockquote-bg": "Blockquote BG",
  "article-blockquote-border": "Blockquote Border",
  "article-blockquote-text": "Blockquote Text",
  "article-code-bg": "Code BG",
  "article-code-text": "Code Text",
  "article-tag-bg": "Tag BG",
  "article-tag-text": "Tag Text",
  "sidebar-bg": "Sidebar BG",
  "sidebar-border": "Sidebar Border",
  "sidebar-heading": "Sidebar Heading",
  "sidebar-profile-avatar": "Profile Avatar",
  "sidebar-profile-name": "Profile Name",
  "sidebar-profile-bio": "Profile Bio",
  "sidebar-category-bg": "Category BG",
  "sidebar-category-text": "Category Text",
  "sidebar-category-count": "Category Count",
  "footer-bg": "Footer BG",
  "footer-border": "Footer Border",
  "footer-text": "Footer Text",
  "footer-link": "Footer Link",
  "footer-divider": "Footer Divider",
};

/** テキスト要素 → 親背景要素のマッピング（コントラスト計算用） */
const TEXT_PARENT_BG_MAP: Record<string, string> = {
  "header-logo": "header-bg",
  "header-nav-link": "header-bg",
  "header-nav-active": "header-bg",
  "article-title": "article-bg",
  "article-meta": "article-bg",
  "article-body": "article-bg",
  "article-link": "article-bg",
  "article-h2": "article-bg",
  "article-blockquote-text": "article-blockquote-bg",
  "article-code-text": "article-code-bg",
  "article-tag-text": "article-tag-bg",
  "sidebar-heading": "sidebar-bg",
  "sidebar-profile-name": "sidebar-bg",
  "sidebar-profile-bio": "sidebar-bg",
  "sidebar-category-text": "sidebar-bg",
  "sidebar-category-count": "sidebar-bg",
  "footer-text": "footer-bg",
  "footer-link": "footer-bg",
};

/** resolveElementContrasts に渡す要素リスト */
const CONTRAST_CHECK_ELEMENTS = PREVIEW_ELEMENTS.map((el) => ({
  id: el.id,
  colorType: el.colorType,
  parentBgId: TEXT_PARENT_BG_MAP[el.id],
}));

interface BlogPreviewProps {
  colors: SchemeColor[];
  colorMappings: Record<string, string>;
  linkingColorId: string | null;
  onElementClick?: (elementId: string) => void;
  previewDark?: boolean;
  showContrastWarnings?: boolean;
}

/**
 * ボーダーと背景を独立して選択可能にするラッパー
 *
 * 非リンクモード: 単一 div に borderColor / backgroundColor をインラインスタイルで適用
 * リンクモード: 3層構造でボーダー/背景を独立してクリック可能にする
 */
function SelectableWrapper({
  borderId,
  bgId,
  isLinking,
  colorMappings,
  getColor,
  onClick,
  className = "",
  grow = false,
  children,
}: {
  borderId: string;
  bgId: string;
  isLinking: boolean;
  colorMappings: Record<string, string>;
  getColor: (id: string) => string | undefined;
  onClick: (elementId: string) => (e: React.MouseEvent) => void;
  className?: string;
  grow?: boolean;
  children: React.ReactNode;
}) {
  const borderHex = getColor(borderId);
  const bgHex = getColor(bgId);

  const lc = isLinking
    ? "cursor-crosshair hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-shadow"
    : "";

  const mr = (elementId: string) =>
    isLinking && colorMappings[elementId] ? "ring-1 ring-blue-300/50" : "";

  const g = grow ? "flex-1 flex flex-col min-h-0" : "";

  // コンテンツ div に直接適用するスタイル（className のデフォルト色を上書き）
  const contentStyle: React.CSSProperties = {};
  if (borderHex) contentStyle.borderColor = borderHex;
  if (bgHex) {
    contentStyle.backgroundColor = bgHex;
    contentStyle.color = getOptimalTextColor(bgHex);
  }

  if (!isLinking) {
    // 非リンクモード: 単一 div、色をインラインスタイルで直接適用
    return (
      <div className={`${className} ${g}`} style={contentStyle}>
        {children}
      </div>
    );
  }

  // リンクモード: ボーダー/背景の独立クリック用ラッパー
  return (
    <div
      className={`p-[3px] ${g} ${lc} ${mr(borderId)}`}
      style={borderHex ? { backgroundColor: borderHex } : {}}
      onClick={onClick(borderId)}
    >
      <div
        className={`p-[3px] ${g} ${lc} ${mr(bgId)}`}
        style={bgHex ? { backgroundColor: bgHex, color: getOptimalTextColor(bgHex) } : {}}
        onClick={onClick(bgId)}
      >
        <div className={`${className} ${g}`} style={contentStyle}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** サイドバーのウィジェット風セクション */
function SidebarWidget({
  title,
  titleId,
  isLinking,
  colorMappings,
  s,
  click,
  lc,
  mr,
  warnBadge,
  children,
}: {
  title: string;
  titleId: string;
  isLinking: boolean;
  colorMappings: Record<string, string>;
  s: (id: string, type?: ElementColorType) => React.CSSProperties;
  click: (id: string) => (e: React.MouseEvent) => void;
  lc: string;
  mr: (id: string) => string;
  warnBadge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div
        className={`relative text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-700 pb-1.5 mb-2 ${lc} ${mr(titleId)}`}
        style={s(titleId, "text")}
        onClick={click(titleId)}
      >
        {warnBadge}
        {title}
      </div>
      {children}
    </div>
  );
}

/** コントラスト警告バッジ */
function ContrastWarningBadge({ warning }: { warning: ElementContrastWarning }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="absolute -top-1 -right-1 z-10">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 drop-shadow-sm" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[200px]">
          <p>Contrast {warning.ratio.toFixed(1)}:1 — WCAG AA fail</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function BlogPreview({
  colors,
  colorMappings,
  linkingColorId,
  onElementClick,
  previewDark = false,
  showContrastWarnings = false,
}: BlogPreviewProps) {
  const isLinking = !!linkingColorId;

  // コントラスト警告を計算（色・マッピング変更時のみ再計算）
  const contrastWarnings = useMemo(() => {
    if (!showContrastWarnings) return new Map<string, ElementContrastWarning>();
    const warnings = resolveElementContrasts(colorMappings, colors, CONTRAST_CHECK_ELEMENTS, previewDark);
    return new Map(warnings.map((w) => [w.elementId, w]));
  }, [showContrastWarnings, colorMappings, colors, previewDark]);

  // 要素に警告バッジを付ける関数
  const warn = (elementId: string) => {
    if (!showContrastWarnings) return null;
    const w = contrastWarnings.get(elementId);
    if (!w) return null;
    return <ContrastWarningBadge warning={w} />;
  };

  const getColor = (elementId: string): string | undefined => {
    const colorId = colorMappings[elementId];
    if (!colorId) return undefined;
    const color = colors.find((c) => c.id === colorId);
    if (!color) return undefined;
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
      return { backgroundColor: hex, color: getOptimalTextColor(hex) };
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

  const swProps = { isLinking, colorMappings, getColor, onClick: click };

  return (
    <div className="rounded-lg border-2 bg-white dark:bg-gray-900 overflow-y-auto shadow-sm text-[13px] leading-relaxed select-none flex-1 min-h-0">
      {/* ページ全体: 外側 div で直接スクロール、min-h-full で背景を埋める */}
      <SelectableWrapper
        borderId="page-border"
        bgId="page-bg"
        {...swProps}
        className="min-h-full"
      >
        {/* ── ヘッダー ── */}
        <SelectableWrapper
          borderId="header-border"
          bgId="header-bg"
          {...swProps}
          className="border-b-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        >
          <div className="max-w-[720px] mx-auto px-5 py-3 flex items-center justify-between">
            <div
              className={`relative flex items-center gap-2 ${lc} ${mr("header-logo")}`}
              style={s("header-logo", "text")}
              onClick={click("header-logo")}
            >
              {warn("header-logo")}
              <div className="w-5 h-5 rounded-sm bg-gray-800 dark:bg-gray-200" />
              <span className="font-bold text-[15px] text-gray-800 dark:text-gray-100" style={s("header-logo", "text")}>
                Dev Blog
              </span>
            </div>
            <nav className="flex gap-4">
              {["Home", "Blog", "About", "Contact"].map((item) => {
                const isActive = item === "Blog";
                const id = isActive ? "header-nav-active" : "header-nav-link";
                return (
                  <span
                    key={item}
                    className={`${isActive ? "font-semibold text-gray-800 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"} ${lc} ${mr(id)}`}
                    style={s(id, "text")}
                    onClick={click(id)}
                  >
                    {item}
                  </span>
                );
              })}
            </nav>
          </div>
        </SelectableWrapper>

        {/* ── メインコンテンツ: 記事リスト + サイドバー ── */}
        <div className="max-w-[720px] mx-auto px-5 py-4 flex gap-5 w-full">
          {/* 記事リスト */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* ── 記事 1（詳細） ── */}
            <SelectableWrapper
              borderId="article-border"
              bgId="article-bg"
              {...swProps}
              className="bg-white dark:bg-gray-900 rounded border-2 border-gray-200 dark:border-gray-700 p-5"
            >
              {/* タイトル */}
              <h1
                className={`relative text-lg font-bold leading-snug text-gray-900 dark:text-gray-50 mb-1 ${lc} ${mr("article-title")}`}
                style={s("article-title", "text")}
                onClick={click("article-title")}
              >
                {warn("article-title")}
                Building a Design System from Scratch
              </h1>

              {/* メタ情報 */}
              <div
                className={`relative text-xs text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-1.5 ${lc} ${mr("article-meta")}`}
                style={s("article-meta", "text")}
                onClick={click("article-meta")}
              >
                {warn("article-meta")}
                <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                <span>John Doe</span>
                <span>·</span>
                <span>Jan 15, 2025 · 5 min read</span>
              </div>

              {/* アイキャッチ画像プレースホルダー */}
              <div className="w-full h-24 rounded bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
              </div>

              {/* 本文 */}
              <p
                className={`relative text-gray-600 dark:text-gray-300 mb-3 leading-[1.8] ${lc} ${mr("article-body")}`}
                style={s("article-body", "text")}
                onClick={click("article-body")}
              >
                {warn("article-body")}
                A design system is a collection of reusable components, guided by clear standards, that can be assembled to build applications.
              </p>

              {/* 見出し H2 */}
              <h2
                className={`relative text-[15px] font-bold text-gray-800 dark:text-gray-100 mb-2 mt-4 border-b-2 border-gray-100 dark:border-gray-800 pb-1 ${lc} ${mr("article-h2")}`}
                style={s("article-h2", "text")}
                onClick={click("article-h2")}
              >
                {warn("article-h2")}
                Getting Started
              </h2>

              {/* 本文続き + リンク */}
              <p
                className={`text-gray-600 dark:text-gray-300 mb-3 leading-[1.8] ${lc} ${mr("article-body")}`}
                style={s("article-body", "text")}
                onClick={click("article-body")}
              >
                First, define your color palette. Good color choices improve readability and{" "}
                <span
                  className={`relative underline decoration-1 underline-offset-2 text-blue-600 dark:text-blue-400 ${lc} ${mr("article-link")}`}
                  style={s("article-link", "text")}
                  onClick={click("article-link")}
                >
                  {warn("article-link")}
                  accessibility guidelines
                </span>
                {" "}should always be considered.
              </p>

              {/* ブロッククォート */}
              <SelectableWrapper
                borderId="article-blockquote-border"
                bgId="article-blockquote-bg"
                {...swProps}
                className="border-l-4 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-r pl-4 pr-3 py-3 mb-4 italic"
              >
                <span
                  className={`relative text-gray-500 dark:text-gray-400 leading-[1.7] ${lc} ${mr("article-blockquote-text")}`}
                  style={s("article-blockquote-text", "text")}
                  onClick={click("article-blockquote-text")}
                >
                  {warn("article-blockquote-text")}
                  &ldquo;Design is not just what it looks like. Design is how it works.&rdquo;
                </span>
              </SelectableWrapper>

              {/* コードブロック */}
              <div
                className={`rounded px-3 py-2 mb-4 font-mono text-xs leading-[1.6] bg-gray-50 dark:bg-gray-800 ${lc} ${mr("article-code-bg")}`}
                style={s("article-code-bg")}
                onClick={click("article-code-bg")}
              >
                <div
                  className={`relative text-red-600 dark:text-red-400 ${lc} ${mr("article-code-text")}`}
                  style={s("article-code-text", "text")}
                  onClick={click("article-code-text")}
                >
                  {warn("article-code-text")}
                  <span className="opacity-50">1</span>{"  :root { "}
                  <span className="text-blue-600 dark:text-blue-400">color-scheme</span>
                  {": light dark; }"}
                  <br />
                  <span className="opacity-50">2</span>{"  body { "}
                  <span className="text-blue-600 dark:text-blue-400">background</span>
                  {": var(--bg); }"}
                </div>
              </div>

              {/* 追加の本文 */}
              <p
                className={`text-gray-600 dark:text-gray-300 mb-4 leading-[1.8] ${lc} ${mr("article-body")}`}
                style={s("article-body", "text")}
                onClick={click("article-body")}
              >
                Choosing the right color palette is one of the most impactful decisions in any design system. Colors communicate meaning, establish hierarchy, and directly affect usability. A well-structured palette includes primary, secondary, neutral, and semantic colors.
              </p>

              {/* 区切り線 + タグ */}
              <div className="border-t-2 border-gray-100 dark:border-gray-800 pt-3 mt-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">Tags:</span>
                  {["Design", "CSS", "Accessibility", "UI"].map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 ${lc} ${mr("article-tag-bg")}`}
                      style={s("article-tag-bg")}
                      onClick={click("article-tag-bg")}
                    >
                      <span
                        className={`text-gray-600 dark:text-gray-300 ${lc} ${mr("article-tag-text")}`}
                        style={s("article-tag-text", "text")}
                        onClick={click("article-tag-text")}
                      >
                        {tag}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </SelectableWrapper>

            {/* ── 記事 2 ── */}
            <SelectableWrapper
              borderId="article-border"
              bgId="article-bg"
              {...swProps}
              className="bg-white dark:bg-gray-900 rounded border-2 border-gray-200 dark:border-gray-700 p-5"
            >
              <h1
                className={`text-lg font-bold leading-snug text-gray-900 dark:text-gray-50 mb-1 ${lc} ${mr("article-title")}`}
                style={s("article-title", "text")}
                onClick={click("article-title")}
              >
                Understanding CSS Grid Layout
              </h1>
              <div
                className={`text-xs text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-1.5 ${lc} ${mr("article-meta")}`}
                style={s("article-meta", "text")}
                onClick={click("article-meta")}
              >
                <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                <span>Jane Smith</span>
                <span>·</span>
                <span>Jan 10, 2025 · 8 min read</span>
              </div>
              <div className="w-full h-20 rounded bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-200 dark:text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
              </div>
              <p
                className={`text-gray-600 dark:text-gray-300 mb-3 leading-[1.8] ${lc} ${mr("article-body")}`}
                style={s("article-body", "text")}
                onClick={click("article-body")}
              >
                CSS Grid is a two-dimensional layout system that revolutionized how we build web layouts. Unlike Flexbox, which is primarily one-dimensional, Grid allows you to control both rows and columns simultaneously.
              </p>
              <p
                className={`text-gray-600 dark:text-gray-300 mb-3 leading-[1.8] ${lc} ${mr("article-body")}`}
                style={s("article-body", "text")}
                onClick={click("article-body")}
              >
                With properties like{" "}
                <span
                  className={`px-1 py-0.5 rounded text-xs bg-gray-50 dark:bg-gray-800 ${lc} ${mr("article-code-bg")}`}
                  style={s("article-code-bg")}
                  onClick={click("article-code-bg")}
                >
                  <code
                    className={`text-red-600 dark:text-red-400 ${lc} ${mr("article-code-text")}`}
                    style={s("article-code-text", "text")}
                    onClick={click("article-code-text")}
                  >grid-template-columns</code>
                </span>{" "}and{" "}
                <span
                  className={`px-1 py-0.5 rounded text-xs bg-gray-50 dark:bg-gray-800 ${lc} ${mr("article-code-bg")}`}
                  style={s("article-code-bg")}
                  onClick={click("article-code-bg")}
                >
                  <code
                    className={`text-red-600 dark:text-red-400 ${lc} ${mr("article-code-text")}`}
                    style={s("article-code-text", "text")}
                    onClick={click("article-code-text")}
                  >grid-template-rows</code>
                </span>, you can create complex layouts with minimal code.
              </p>
              <div className="border-t-2 border-gray-100 dark:border-gray-800 pt-3 mt-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">Tags:</span>
                  {["CSS", "Layout", "Tutorial"].map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 ${lc} ${mr("article-tag-bg")}`}
                      style={s("article-tag-bg")}
                      onClick={click("article-tag-bg")}
                    >
                      <span
                        className={`text-gray-600 dark:text-gray-300 ${lc} ${mr("article-tag-text")}`}
                        style={s("article-tag-text", "text")}
                        onClick={click("article-tag-text")}
                      >
                        {tag}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </SelectableWrapper>

            {/* ── 記事 3 ── */}
            <SelectableWrapper
              borderId="article-border"
              bgId="article-bg"
              {...swProps}
              className="bg-white dark:bg-gray-900 rounded border-2 border-gray-200 dark:border-gray-700 p-5"
            >
              <h1
                className={`text-lg font-bold leading-snug text-gray-900 dark:text-gray-50 mb-1 ${lc} ${mr("article-title")}`}
                style={s("article-title", "text")}
                onClick={click("article-title")}
              >
                Web Accessibility: A Practical Guide
              </h1>
              <div
                className={`text-xs text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-1.5 ${lc} ${mr("article-meta")}`}
                style={s("article-meta", "text")}
                onClick={click("article-meta")}
              >
                <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                <span>John Doe</span>
                <span>·</span>
                <span>Dec 28, 2024 · 6 min read</span>
              </div>
              <div className="w-full h-20 rounded bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-200 dark:text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
              </div>
              <p
                className={`text-gray-600 dark:text-gray-300 mb-3 leading-[1.8] ${lc} ${mr("article-body")}`}
                style={s("article-body", "text")}
                onClick={click("article-body")}
              >
                Web accessibility ensures that websites and applications are usable by everyone, including people with disabilities. Following{" "}
                <span
                  className={`underline decoration-1 underline-offset-2 text-blue-600 dark:text-blue-400 ${lc} ${mr("article-link")}`}
                  style={s("article-link", "text")}
                  onClick={click("article-link")}
                >
                  WCAG 2.1 guidelines
                </span>
                {" "}is essential for creating inclusive digital experiences.
              </p>
              <SelectableWrapper
                borderId="article-blockquote-border"
                bgId="article-blockquote-bg"
                {...swProps}
                className="border-l-4 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-r pl-4 pr-3 py-3 mb-4 italic"
              >
                <span
                  className={`text-gray-500 dark:text-gray-400 leading-[1.7] ${lc} ${mr("article-blockquote-text")}`}
                  style={s("article-blockquote-text", "text")}
                  onClick={click("article-blockquote-text")}
                >
                  &ldquo;The power of the Web is in its universality. Access by everyone regardless of disability is an essential aspect.&rdquo; — Tim Berners-Lee
                </span>
              </SelectableWrapper>
              <div className="border-t-2 border-gray-100 dark:border-gray-800 pt-3 mt-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">Tags:</span>
                  {["Accessibility", "WCAG", "HTML"].map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 ${lc} ${mr("article-tag-bg")}`}
                      style={s("article-tag-bg")}
                      onClick={click("article-tag-bg")}
                    >
                      <span
                        className={`text-gray-600 dark:text-gray-300 ${lc} ${mr("article-tag-text")}`}
                        style={s("article-tag-text", "text")}
                        onClick={click("article-tag-text")}
                      >
                        {tag}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </SelectableWrapper>
          </div>

          {/* サイドバー */}
          <div className="w-[160px] shrink-0">
            <SelectableWrapper
              borderId="sidebar-border"
              bgId="sidebar-bg"
              {...swProps}
              className="bg-white dark:bg-gray-900 rounded border-2 border-gray-200 dark:border-gray-700 p-4"
            >
              {/* About ウィジェット */}
              <SidebarWidget title="About" titleId="sidebar-heading" isLinking={isLinking} colorMappings={colorMappings} s={s} click={click} lc={lc} mr={mr} warnBadge={warn("sidebar-heading")}>
                <div className="text-center">
                  <div
                    className={`w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-2 ${lc} ${mr("sidebar-profile-avatar")}`}
                    style={s("sidebar-profile-avatar")}
                    onClick={click("sidebar-profile-avatar")}
                  />
                  <div
                    className={`font-semibold text-gray-700 dark:text-gray-200 ${lc} ${mr("sidebar-profile-name")}`}
                    style={s("sidebar-profile-name", "text")}
                    onClick={click("sidebar-profile-name")}
                  >
                    John Doe
                  </div>
                  <div
                    className={`text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed ${lc} ${mr("sidebar-profile-bio")}`}
                    style={s("sidebar-profile-bio", "text")}
                    onClick={click("sidebar-profile-bio")}
                  >
                    Frontend developer writing about design systems, CSS, and web accessibility.
                  </div>
                </div>
              </SidebarWidget>

              {/* Categories ウィジェット */}
              <SidebarWidget title="Categories" titleId="sidebar-heading" isLinking={isLinking} colorMappings={colorMappings} s={s} click={click} lc={lc} mr={mr} warnBadge={warn("sidebar-heading")}>
                {[
                  { name: "Design", count: 12 },
                  { name: "Development", count: 24 },
                  { name: "CSS", count: 8 },
                  { name: "Accessibility", count: 5 },
                  { name: "JavaScript", count: 18 },
                ].map((cat) => (
                  <div
                    key={cat.name}
                    className={`flex items-center justify-between py-1 border-b-2 border-gray-100 dark:border-gray-800 last:border-b-0 ${lc} ${mr("sidebar-category-bg")}`}
                    style={s("sidebar-category-bg")}
                    onClick={click("sidebar-category-bg")}
                  >
                    <span
                      className={`text-gray-600 dark:text-gray-300 ${lc} ${mr("sidebar-category-text")}`}
                      style={s("sidebar-category-text", "text")}
                      onClick={click("sidebar-category-text")}
                    >
                      {cat.name}
                    </span>
                    <span
                      className={`text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-1.5 py-0.5 leading-none ${lc} ${mr("sidebar-category-count")}`}
                      style={s("sidebar-category-count", "text")}
                      onClick={click("sidebar-category-count")}
                    >
                      {cat.count}
                    </span>
                  </div>
                ))}
              </SidebarWidget>

              {/* Recent Posts ウィジェット */}
              <SidebarWidget title="Recent Posts" titleId="sidebar-heading" isLinking={isLinking} colorMappings={colorMappings} s={s} click={click} lc={lc} mr={mr} warnBadge={warn("sidebar-heading")}>
                {[
                  { title: "Understanding CSS Grid", date: "Jan 10" },
                  { title: "React Server Components", date: "Jan 5" },
                  { title: "Web Accessibility 101", date: "Dec 28" },
                  { title: "TypeScript Best Practices", date: "Dec 20" },
                ].map((post) => (
                  <div key={post.title} className="py-1 border-b-2 border-gray-100 dark:border-gray-800 last:border-b-0">
                    <div
                      className={`text-gray-600 dark:text-gray-300 leading-snug ${lc} ${mr("article-link")}`}
                      style={s("article-link", "text")}
                      onClick={click("article-link")}
                    >
                      {post.title}
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500">{post.date}</div>
                  </div>
                ))}
              </SidebarWidget>
            </SelectableWrapper>
          </div>
        </div>

        {/* ── フッター ── */}
        <SelectableWrapper
          borderId="footer-border"
          bgId="footer-bg"
          {...swProps}
          className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 mt-auto"
        >
          <div className="max-w-[720px] mx-auto px-5 py-3 flex items-center justify-between">
            <span
              className={`relative text-gray-400 dark:text-gray-500 ${lc} ${mr("footer-text")}`}
              style={s("footer-text", "text")}
              onClick={click("footer-text")}
            >
              {warn("footer-text")}
              © 2025 Dev Blog. All rights reserved.
            </span>
            <div className="flex gap-3">
              {["Privacy Policy", "Terms", "RSS"].map((item, i) => (
                <span key={item} className="flex items-center gap-3">
                  {i > 0 && (
                    <span
                      className={`border-l border-gray-300 dark:border-gray-600 h-4 ${lc} ${mr("footer-divider")}`}
                      style={s("footer-divider", "border")}
                      onClick={click("footer-divider")}
                    />
                  )}
                  <span
                    className={`text-gray-400 dark:text-gray-500 hover:underline ${lc} ${mr("footer-link")}`}
                    style={s("footer-link", "text")}
                    onClick={click("footer-link")}
                  >
                    {item}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </SelectableWrapper>
      </SelectableWrapper>
    </div>
  );
}
