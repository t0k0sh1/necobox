/**
 * JSONフォーマット機能
 */

import type { FormatOptions, FormatResult, IndentType } from "./types";
import { validateJson } from "./validator";

/**
 * JSONをフォーマット（整形または圧縮）
 * @param input JSON文字列
 * @param options フォーマットオプション
 * @returns フォーマット結果
 */
export function formatJson(input: string, options: FormatOptions): FormatResult {
  // バリデーション
  const validation = validateJson(input);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  try {
    const parsed = JSON.parse(input);

    if (options.mode === "minify") {
      return {
        success: true,
        output: JSON.stringify(parsed),
      };
    }

    // pretty モード
    const indent = getIndentString(options.indent ?? 2);
    return {
      success: true,
      output: JSON.stringify(parsed, null, indent),
    };
  } catch (e) {
    return {
      success: false,
      error: {
        message: e instanceof Error ? e.message : String(e),
      },
    };
  }
}

/**
 * JSONを整形（見やすい形式）
 * @param input JSON文字列
 * @param indent インデントタイプ
 * @returns フォーマット結果
 */
export function prettifyJson(
  input: string,
  indent: IndentType = 2
): FormatResult {
  return formatJson(input, { mode: "pretty", indent });
}

/**
 * JSONを圧縮（1行表示）
 * @param input JSON文字列
 * @returns フォーマット結果
 */
export function minifyJson(input: string): FormatResult {
  return formatJson(input, { mode: "minify" });
}

/**
 * インデントタイプからインデント文字列を取得
 * @param indent インデントタイプ
 * @returns インデント文字列またはスペース数
 */
function getIndentString(indent: IndentType): string | number {
  if (indent === "tab") {
    return "\t";
  }
  return indent;
}
