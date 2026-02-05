/**
 * JSONバリデーション機能
 */

import type { ValidationResult, ValidationError, ValidationWarning } from "./types";

/**
 * JSONの構文をバリデート
 * @param input JSON文字列
 * @returns バリデーション結果
 */
export function validateJson(input: string): ValidationResult {
  if (!input.trim()) {
    return {
      valid: false,
      error: {
        message: "Empty input",
        type: "emptyInput",
      },
    };
  }

  try {
    JSON.parse(input);

    // 重複キーをチェック
    const duplicates = findDuplicateKeys(input);
    if (duplicates.length > 0) {
      return {
        valid: true,
        warnings: duplicates,
      };
    }

    return { valid: true };
  } catch (e) {
    const error = parseJsonError(e, input);
    return {
      valid: false,
      error,
    };
  }
}

/**
 * 重複キーを検出
 * @param input JSON文字列
 * @returns 重複キーの警告リスト
 */
function findDuplicateKeys(input: string): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const keyStack: Map<string, { line: number; column: number }>[] = [];
  let currentKeys: Map<string, { line: number; column: number }> | null = null;

  let i = 0;
  let line = 1;
  let lineStart = 0;
  let inString = false;
  let stringStart = -1;
  let stringStartLine = 1;
  let stringStartColumn = 1;
  let escapeNext = false;
  let expectingKey = false;
  let currentKey = "";

  while (i < input.length) {
    const char = input[i];
    const column = i - lineStart + 1;

    if (char === "\n") {
      line++;
      lineStart = i + 1;
    }

    if (escapeNext) {
      escapeNext = false;
      i++;
      continue;
    }

    if (inString) {
      if (char === "\\") {
        escapeNext = true;
      } else if (char === '"') {
        inString = false;
        if (expectingKey && currentKeys) {
          currentKey = input.substring(stringStart + 1, i);
          // 重複チェック
          const existing = currentKeys.get(currentKey);
          if (existing) {
            warnings.push({
              message: `Duplicate key "${currentKey}"`,
              type: "duplicateKey",
              key: currentKey,
              line: stringStartLine,
              column: stringStartColumn,
            });
          } else {
            currentKeys.set(currentKey, { line: stringStartLine, column: stringStartColumn });
          }
          expectingKey = false;
        }
      }
      i++;
      continue;
    }

    if (char === '"') {
      inString = true;
      stringStart = i;
      stringStartLine = line;
      stringStartColumn = column;
      i++;
      continue;
    }

    if (char === "{") {
      if (currentKeys) {
        keyStack.push(currentKeys);
      }
      currentKeys = new Map();
      expectingKey = true;
      i++;
      continue;
    }

    if (char === "}") {
      currentKeys = keyStack.pop() ?? null;
      expectingKey = false;
      i++;
      continue;
    }

    if (char === "[") {
      // 配列内ではキーを期待しない
      if (currentKeys) {
        keyStack.push(currentKeys);
      }
      currentKeys = null;
      expectingKey = false;
      i++;
      continue;
    }

    if (char === "]") {
      currentKeys = keyStack.pop() ?? null;
      expectingKey = currentKeys !== null;
      i++;
      continue;
    }

    if (char === ":") {
      expectingKey = false;
      i++;
      continue;
    }

    if (char === ",") {
      if (currentKeys) {
        expectingKey = true;
      }
      i++;
      continue;
    }

    i++;
  }

  return warnings;
}

/**
 * JSONパースエラーから行番号・カラム番号を抽出
 * @param error エラーオブジェクト
 * @param input 入力文字列
 * @returns バリデーションエラー
 */
function parseJsonError(error: unknown, input: string): ValidationError {
  if (!(error instanceof SyntaxError)) {
    return {
      message: String(error),
    };
  }

  const message = error.message;

  // "at position X" パターンからポジションを抽出
  const positionMatch = message.match(/at position (\d+)/);
  if (positionMatch) {
    const position = parseInt(positionMatch[1], 10);
    const { line, column } = getLineAndColumn(input, position);
    return {
      message: formatErrorMessage(message),
      line,
      column,
    };
  }

  // "at line X column Y" パターン（一部ブラウザ）
  const lineColMatch = message.match(/at line (\d+) column (\d+)/);
  if (lineColMatch) {
    return {
      message: formatErrorMessage(message),
      line: parseInt(lineColMatch[1], 10),
      column: parseInt(lineColMatch[2], 10),
    };
  }

  return {
    message: formatErrorMessage(message),
  };
}

/**
 * ポジションから行番号・カラム番号を計算
 * @param input 入力文字列
 * @param position ポジション（0始まり）
 * @returns 行番号（1始まり）とカラム番号（1始まり）
 */
function getLineAndColumn(
  input: string,
  position: number
): { line: number; column: number } {
  const lines = input.substring(0, position).split("\n");
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}

/**
 * エラーメッセージを整形
 * @param message 元のエラーメッセージ
 * @returns 整形されたメッセージ
 */
function formatErrorMessage(message: string): string {
  // "JSON.parse: " などのプレフィックスを除去
  return message
    .replace(/^JSON\.parse:\s*/i, "")
    .replace(/\s*at position \d+$/, "")
    .replace(/\s*at line \d+ column \d+$/, "")
    .trim();
}
