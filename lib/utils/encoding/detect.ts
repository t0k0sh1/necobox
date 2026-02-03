/**
 * エンコーディング検出・デコードユーティリティ
 */

import type { EncodingType } from "../csv/types";

/**
 * BOMを検出
 */
export function detectBOM(bytes: Uint8Array): "utf-8-bom" | null {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return "utf-8-bom";
  }
  return null;
}

/**
 * エンコーディングを自動検出
 * BOM、文字パターンから推定
 */
export function detectEncoding(buffer: ArrayBuffer): EncodingType {
  const bytes = new Uint8Array(buffer);

  // BOM検出
  const bom = detectBOM(bytes);
  if (bom) {
    return bom;
  }

  // Shift_JIS/EUC-JP判定（簡易版）
  // 日本語文字が含まれているかをチェック
  let shiftJisScore = 0;
  let eucJpScore = 0;

  for (let i = 0; i < Math.min(bytes.length - 1, 1000); i++) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1];

    // Shift_JIS: 0x81-0x9F, 0xE0-0xFC で始まる2バイト文字
    if (
      ((b1 >= 0x81 && b1 <= 0x9f) || (b1 >= 0xe0 && b1 <= 0xfc)) &&
      ((b2 >= 0x40 && b2 <= 0x7e) || (b2 >= 0x80 && b2 <= 0xfc))
    ) {
      shiftJisScore++;
    }

    // EUC-JP: 0xA1-0xFE で始まる2バイト文字
    if (b1 >= 0xa1 && b1 <= 0xfe && b2 >= 0xa1 && b2 <= 0xfe) {
      eucJpScore++;
    }
  }

  if (shiftJisScore > eucJpScore && shiftJisScore > 5) {
    return "shift_jis";
  }
  if (eucJpScore > shiftJisScore && eucJpScore > 5) {
    return "euc-jp";
  }

  return "utf-8";
}

/**
 * ArrayBufferを指定したエンコーディングでデコード
 */
export function decodeWithEncoding(
  buffer: ArrayBuffer,
  encoding: EncodingType
): string {
  // BOM付きUTF-8の場合はBOMを除去
  const actualEncoding = encoding === "utf-8-bom" ? "utf-8" : encoding;

  try {
    const decoder = new TextDecoder(actualEncoding);
    let text = decoder.decode(buffer);

    // BOMを除去
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }

    return text;
  } catch {
    // フォールバック: UTF-8で試行
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(buffer);
  }
}
