/**
 * エンコードユーティリティ
 */

import Encoding from "encoding-japanese";

import type { EncodingType } from "../csv/types";

/**
 * 文字列を指定したエンコーディングでエンコード
 * UTF-8/UTF-8 BOMはTextEncoder、Shift_JIS/EUC-JPはencoding-japaneseを使用
 */
export function encodeWithEncoding(
  text: string,
  encoding: EncodingType
): Uint8Array {
  if (encoding === "utf-8") {
    const encoder = new TextEncoder();
    return encoder.encode(text);
  }

  if (encoding === "utf-8-bom") {
    const encoder = new TextEncoder();
    const content = encoder.encode(text);
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const result = new Uint8Array(bom.length + content.length);
    result.set(bom, 0);
    result.set(content, bom.length);
    return result;
  }

  if (encoding === "shift_jis") {
    // encoding-japaneseでShift_JISに変換
    const unicodeArray = Encoding.stringToCode(text);
    const sjisArray = Encoding.convert(unicodeArray, {
      to: "SJIS",
      from: "UNICODE",
    });
    return new Uint8Array(sjisArray);
  }

  if (encoding === "euc-jp") {
    // encoding-japaneseでEUC-JPに変換
    const unicodeArray = Encoding.stringToCode(text);
    const eucjpArray = Encoding.convert(unicodeArray, {
      to: "EUCJP",
      from: "UNICODE",
    });
    return new Uint8Array(eucjpArray);
  }

  // フォールバック: UTF-8
  const encoder = new TextEncoder();
  return encoder.encode(text);
}
