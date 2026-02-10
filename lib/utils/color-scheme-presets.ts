/**
 * カラースキームデザイナー プリセット定義
 * パレット・グレースケールのプリセットカラーとマッピング
 */

import type { GrayscalePreset, PalettePreset } from "./color-scheme-designer";

// --- グレースケールプリセット ---

/** 全プリセット共通の要素→色インデックスマッピング */
const GRAYSCALE_ELEMENT_MAPPINGS: Record<string, number> = {
  // 0: BG（背景白）
  "page-bg": 0,
  "header-bg": 0,
  "article-bg": 0,
  "sidebar-bg": 0,
  // 1: Surface（サブ背景）
  "footer-bg": 1,
  "article-blockquote-bg": 1,
  "article-code-bg": 1,
  // 2: Subtle（薄いグレー）
  "article-tag-bg": 2,
  "sidebar-category-bg": 2,
  "sidebar-profile-avatar": 2,
  // 3: Border（ボーダー）
  "page-border": 3,
  "header-border": 3,
  "article-border": 3,
  "sidebar-border": 3,
  "footer-border": 3,
  "footer-divider": 3,
  "article-blockquote-border": 3,
  // 4: Muted（控えめテキスト）
  "article-meta": 4,
  "sidebar-profile-bio": 4,
  "header-nav-link": 4,
  "footer-text": 4,
  "footer-link": 4,
  "sidebar-category-count": 4,
  "article-blockquote-text": 4,
  // 5: Default（本文テキスト）
  "article-body": 5,
  "sidebar-category-text": 5,
  "article-tag-text": 5,
  "article-code-text": 5,
  // 6: Emphasis（見出し・強調）
  "article-title": 6,
  "article-h2": 6,
  "header-logo": 6,
  "header-nav-active": 6,
  "sidebar-heading": 6,
  "sidebar-profile-name": 6,
  "article-link": 6,
};

// --- パレットプリセット ---

/** パレットプリセット共通の要素→色インデックスマッピング */
const PALETTE_ELEMENT_MAPPINGS: Record<string, number> = {
  // 0: Primary（メインアクセント）
  "header-logo": 0,
  "header-nav-active": 0,
  "article-link": 0,
  "article-tag-text": 0,
  // 1: Primary Soft（メインアクセントの薄い背景）
  "article-tag-bg": 1,
  // 2: Secondary（補色）
  "article-blockquote-border": 2,
  "article-h2": 2,
  // 3: Accent（アクセント）
  "article-code-text": 3,
  "footer-link": 3,
  // 4: Accent Soft（アクセントの薄い背景）
  "sidebar-profile-avatar": 4,
};

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    key: "ocean",
    colors: [
      { name: "Primary", hex: "#2563eb" },
      { name: "Primary Soft", hex: "#dbeafe" },
      { name: "Secondary", hex: "#7c3aed" },
      { name: "Accent", hex: "#f59e0b" },
      { name: "Accent Soft", hex: "#fef3c7" },
    ],
    mappings: PALETTE_ELEMENT_MAPPINGS,
  },
  {
    key: "forest",
    colors: [
      { name: "Primary", hex: "#059669" },
      { name: "Primary Soft", hex: "#d1fae5" },
      { name: "Secondary", hex: "#0891b2" },
      { name: "Accent", hex: "#e11d48" },
      { name: "Accent Soft", hex: "#ffe4e6" },
    ],
    mappings: PALETTE_ELEMENT_MAPPINGS,
  },
  {
    key: "sunset",
    colors: [
      { name: "Primary", hex: "#dc2626" },
      { name: "Primary Soft", hex: "#fee2e2" },
      { name: "Secondary", hex: "#ea580c" },
      { name: "Accent", hex: "#7c3aed" },
      { name: "Accent Soft", hex: "#ede9fe" },
    ],
    mappings: PALETTE_ELEMENT_MAPPINGS,
  },
];

export const GRAYSCALE_PRESETS: GrayscalePreset[] = [
  {
    key: "neutral",
    colors: [
      { name: "White", hex: "#ffffff", hex2: "#0a0a0a" },
      { name: "Surface", hex: "#f9fafb", hex2: "#111827" },
      { name: "Subtle", hex: "#f3f4f6", hex2: "#1f2937" },
      { name: "Border", hex: "#e5e7eb", hex2: "#374151" },
      { name: "Muted", hex: "#9ca3af", hex2: "#9ca3af" },
      { name: "Default", hex: "#4b5563", hex2: "#d1d5db" },
      { name: "Emphasis", hex: "#111827", hex2: "#f9fafb" },
    ],
    mappings: GRAYSCALE_ELEMENT_MAPPINGS,
  },
  {
    key: "warm",
    colors: [
      { name: "White", hex: "#ffffff", hex2: "#0c0a09" },
      { name: "Surface", hex: "#fafaf9", hex2: "#1c1917" },
      { name: "Subtle", hex: "#f5f5f4", hex2: "#292524" },
      { name: "Border", hex: "#e7e5e4", hex2: "#44403c" },
      { name: "Muted", hex: "#a8a29e", hex2: "#a8a29e" },
      { name: "Default", hex: "#57534e", hex2: "#d6d3d1" },
      { name: "Emphasis", hex: "#1c1917", hex2: "#fafaf9" },
    ],
    mappings: GRAYSCALE_ELEMENT_MAPPINGS,
  },
  {
    key: "cool",
    colors: [
      { name: "White", hex: "#ffffff", hex2: "#020617" },
      { name: "Surface", hex: "#f8fafc", hex2: "#0f172a" },
      { name: "Subtle", hex: "#f1f5f9", hex2: "#1e293b" },
      { name: "Border", hex: "#e2e8f0", hex2: "#334155" },
      { name: "Muted", hex: "#94a3b8", hex2: "#94a3b8" },
      { name: "Default", hex: "#475569", hex2: "#cbd5e1" },
      { name: "Emphasis", hex: "#0f172a", hex2: "#f8fafc" },
    ],
    mappings: GRAYSCALE_ELEMENT_MAPPINGS,
  },
];
