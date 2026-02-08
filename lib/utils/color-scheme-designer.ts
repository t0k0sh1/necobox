/**
 * カラースキームデザイナー ユーティリティ
 * パレット管理、エクスポート、アクセシビリティ機能
 */

import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  getRelativeLuminance,
  getContrastRatio,
  formatRgb,
  type RGB,
  type HSL,
} from "./color-converter";

/** 新規スキームのデフォルト名 */
export const DEFAULT_SCHEME_NAME = "My Color Scheme";

// --- 型定義 ---

export type ColorGroup = "palette" | "grayscale";

export interface SchemeColor {
  id: string;
  hex: string;
  /** グレースケール用の2色目（group === "grayscale" 時のみ使用） */
  hex2?: string;
  name: string;
  group: ColorGroup;
}

export interface ColorScheme {
  name: string;
  colors: SchemeColor[];
}

// --- localStorage 永続化用の型 ---

export interface SavedColorScheme {
  id: string;
  name: string;
  colors: SchemeColor[];
  colorMappings: Record<string, string>;
  updatedAt: number;
}

export interface ColorSchemeStorage {
  version: 1;
  schemes: SavedColorScheme[];
  lastActiveSchemeId: string | null;
}

export interface WorkingScheme {
  name: string;
  colors: SchemeColor[];
  colorMappings: Record<string, string>;
}

// --- ヘルパー関数 ---

/** HSLからHEXに変換 */
export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

/** HEXからHSLに変換 */
export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsl(rgb);
}

// --- テキスト色判定 ---

/** 背景色に対して白/黒のどちらが読みやすいか判定 */
export function getOptimalTextColor(bgHex: string): string {
  const rgb = hexToRgb(bgHex);
  if (!rgb) return "#000000";
  const luminance = getRelativeLuminance(rgb);
  return luminance > 0.179 ? "#000000" : "#ffffff";
}

// --- SchemeColor ヘルパー ---

/** ユニークIDを生成 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
}

// --- 名前正規化ヘルパー ---

/**
 * 色名を CSS 変数名 / Tailwind キーに安全な slug に変換する。
 * 英数字と - のみに正規化し、重複時はサフィックスで一意化する。
 */
function toSafeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // 英数字・スペース・ハイフン以外を除去
    .trim()
    .replace(/\s+/g, "-")         // スペースをハイフンに
    .replace(/-+/g, "-")          // 連続ハイフンを1つに
    .replace(/^-|-$/g, "")        // 先頭・末尾のハイフンを除去
    || "color";                   // 空文字になった場合のフォールバック
}

/**
 * slug の配列内で一意な名前を保証する。
 * 重複が発生した場合はサフィックス (-2, -3, ...) を付与する。
 */
function uniquifySlug(slug: string, usedSlugs: Set<string>): string {
  if (!usedSlugs.has(slug)) {
    usedSlugs.add(slug);
    return slug;
  }
  let counter = 2;
  while (usedSlugs.has(`${slug}-${counter}`)) {
    counter++;
  }
  const unique = `${slug}-${counter}`;
  usedSlugs.add(unique);
  return unique;
}

// --- エクスポート関数 ---

/** Markdown 箇条書き形式でエクスポート */
export function exportAsText(scheme: ColorScheme): string {
  const paletteColors = scheme.colors.filter((c) => c.group === "palette");
  const grayscaleColors = scheme.colors.filter((c) => c.group === "grayscale");
  const lines: string[] = [`## ${scheme.name || "Color Scheme"}`, ""];

  if (paletteColors.length > 0) {
    lines.push("### Palette", "");
    for (const color of paletteColors) {
      const rgb = hexToRgb(color.hex);
      const rgbStr = rgb ? ` / ${formatRgb(rgb)}` : "";
      lines.push(`- **${color.name}**: \`${color.hex}\`${rgbStr}`);
    }
    lines.push("");
  }

  if (grayscaleColors.length > 0) {
    lines.push("### Grayscale", "");
    for (const color of grayscaleColors) {
      const darkHex = color.hex2 ? ` / Dark: \`${color.hex2}\`` : "";
      lines.push(`- **${color.name}**: Light: \`${color.hex}\`${darkHex}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/** CSS変数形式でエクスポート */
export function exportAsCssVariables(scheme: ColorScheme): string {
  const lines: string[] = [":root {"];
  const usedSlugs = new Set<string>();

  for (const color of scheme.colors) {
    const slug = uniquifySlug(toSafeSlug(color.name), usedSlugs);
    lines.push(`  --color-${slug}: ${color.hex};`);
    if (color.hex2) {
      lines.push(`  --color-${slug}-2: ${color.hex2};`);
    }
  }

  lines.push("}");
  return lines.join("\n");
}

/** Tailwind Config 形式でエクスポート */
export function exportAsTailwindConfig(scheme: ColorScheme): string {
  const colors: Record<string, string> = {};
  const usedSlugs = new Set<string>();

  for (const color of scheme.colors) {
    const key = uniquifySlug(toSafeSlug(color.name), usedSlugs);
    colors[key] = color.hex;
    if (color.hex2) {
      colors[`${key}-2`] = color.hex2;
    }
  }

  const configStr = JSON.stringify({ colors }, null, 2);
  return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: ${configStr},\n  },\n};`;
}

/** Canvas API で BlocksPreview 風のカラーストリップ PNG を描画 */
export function renderSchemeToCanvas(
  scheme: ColorScheme,
  canvas: HTMLCanvasElement
): void {
  const width = 1200;
  const padding = 40;
  const stripHeight = 160;
  const labelHeight = 36;
  const gap = 24;
  const titleHeight = 60;
  const footerHeight = 40;

  const paletteColors = scheme.colors.filter((c) => c.group === "palette");
  const grayscaleColors = scheme.colors.filter((c) => c.group === "grayscale");
  const hasPalette = paletteColors.length > 0;
  const hasGrayscale = grayscaleColors.length > 0;

  // 高さを動的に計算
  let contentHeight = titleHeight;
  if (hasPalette) contentHeight += labelHeight + stripHeight;
  if (hasPalette && hasGrayscale) contentHeight += gap;
  if (hasGrayscale) contentHeight += labelHeight + stripHeight;
  const height = contentHeight + footerHeight + padding * 2;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 背景
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // タイトル
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(scheme.name || "Color Scheme", padding, padding + 32);

  let y = padding + titleHeight;
  const stripWidth = width - padding * 2;

  // パレットストリップ描画
  if (hasPalette) {
    ctx.fillStyle = "#999999";
    ctx.font = "13px sans-serif";
    ctx.fillText("Palette", padding, y + 20);
    y += labelHeight;

    const blockW = stripWidth / paletteColors.length;
    paletteColors.forEach((color, i) => {
      const x = padding + i * blockW;
      // 角丸の最初・最後のブロック
      ctx.fillStyle = color.hex;
      ctx.fillRect(x, y, blockW, stripHeight);

      // 名前
      const textColor = getOptimalTextColor(color.hex);
      ctx.fillStyle = textColor;
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(color.name, x + blockW / 2, y + stripHeight / 2 - 10);

      // HEX
      ctx.font = "15px monospace";
      ctx.fillText(color.hex, x + blockW / 2, y + stripHeight / 2 + 16);
      ctx.textAlign = "left";
    });
    y += stripHeight;
  }

  // グレースケールストリップ描画
  if (hasGrayscale) {
    if (hasPalette) y += gap;

    ctx.fillStyle = "#999999";
    ctx.font = "13px sans-serif";
    ctx.fillText("Grayscale", padding, y + 20);
    y += labelHeight;

    const blockW = stripWidth / grayscaleColors.length;
    grayscaleColors.forEach((color, i) => {
      const x = padding + i * blockW;
      const halfH = stripHeight / 2;

      // ライトモード（上半分）
      ctx.fillStyle = color.hex;
      ctx.fillRect(x, y, blockW, halfH);
      const lightText = getOptimalTextColor(color.hex);
      ctx.fillStyle = lightText;
      ctx.textAlign = "center";
      ctx.font = "11px sans-serif";
      ctx.globalAlpha = 0.6;
      ctx.fillText("Light", x + blockW / 2, y + halfH / 2 - 10);
      ctx.globalAlpha = 1.0;
      ctx.font = "14px monospace";
      ctx.fillText(color.hex, x + blockW / 2, y + halfH / 2 + 8);

      // ダークモード（下半分）
      const darkHex = color.hex2 ?? "#333333";
      ctx.fillStyle = darkHex;
      ctx.fillRect(x, y + halfH, blockW, halfH);
      const darkText = getOptimalTextColor(darkHex);
      ctx.fillStyle = darkText;
      ctx.font = "11px sans-serif";
      ctx.globalAlpha = 0.6;
      ctx.fillText("Dark", x + blockW / 2, y + halfH + halfH / 2 - 10);
      ctx.globalAlpha = 1.0;
      ctx.font = "14px monospace";
      ctx.fillText(darkHex, x + blockW / 2, y + halfH + halfH / 2 + 8);

      ctx.textAlign = "left";
    });
    y += stripHeight;
  }

  // フッター
  ctx.fillStyle = "#999999";
  ctx.font = "12px sans-serif";
  ctx.fillText("Generated by Neco Box - Color Scheme Designer", padding, height - padding + 8);
}

/** Canvas → PNG ダウンロード */
export function downloadCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename: string = "color-scheme.png"
): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// --- アクセシビリティ ---

export interface ContrastPair {
  fgName: string;
  fgHex: string;
  bgName: string;
  bgHex: string;
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
}

/** パレット内の色同士 + 白/黒テキストとのコントラスト比を計算 */
export function calculateContrastPairs(
  colors: SchemeColor[]
): ContrastPair[] {
  const pairs: ContrastPair[] = [];

  // 評価対象の (名前, hex) ペアを構築
  // grayscale の hex2（ダーク側）も評価に含める
  interface EvalColor {
    name: string;
    hex: string;
  }
  const evalColors: EvalColor[] = [];
  for (const color of colors) {
    evalColors.push({ name: color.name, hex: color.hex });
    if (color.hex2) {
      evalColors.push({
        name: `${color.name} (Dark)`,
        hex: color.hex2,
      });
    }
  }

  // 白テキスト & 黒テキストとの各色のコントラスト
  for (const ec of evalColors) {
    const bgRgb = hexToRgb(ec.hex);
    if (!bgRgb) continue;

    const whiteRgb: RGB = { r: 255, g: 255, b: 255 };
    const whiteResult = getContrastRatio(whiteRgb, bgRgb);
    pairs.push({
      fgName: "White",
      fgHex: "#ffffff",
      bgName: ec.name,
      bgHex: ec.hex,
      ratio: whiteResult.ratio,
      wcagAA: whiteResult.wcagAA,
      wcagAAA: whiteResult.wcagAAA,
    });

    const blackRgb: RGB = { r: 0, g: 0, b: 0 };
    const blackResult = getContrastRatio(blackRgb, bgRgb);
    pairs.push({
      fgName: "Black",
      fgHex: "#000000",
      bgName: ec.name,
      bgHex: ec.hex,
      ratio: blackResult.ratio,
      wcagAA: blackResult.wcagAA,
      wcagAAA: blackResult.wcagAAA,
    });
  }

  // 色同士の組み合わせ
  for (let i = 0; i < evalColors.length; i++) {
    for (let j = i + 1; j < evalColors.length; j++) {
      const fgRgb = hexToRgb(evalColors[i].hex);
      const bgRgb = hexToRgb(evalColors[j].hex);
      if (fgRgb && bgRgb) {
        const result = getContrastRatio(fgRgb, bgRgb);
        pairs.push({
          fgName: evalColors[i].name,
          fgHex: evalColors[i].hex,
          bgName: evalColors[j].name,
          bgHex: evalColors[j].hex,
          ratio: result.ratio,
          wcagAA: result.wcagAA,
          wcagAAA: result.wcagAAA,
        });
      }
    }
  }

  return pairs;
}
