import { getSecureRandomInt, shuffleString as shuffleStringSecure } from "./random";

export type TextType =
  | "alphanumeric"
  | "japanese-full"
  | "mixed"
  | "lorem"
  | "natural-japanese"
  | "numeric-only"
  | "lowercase-only"
  | "uppercase-only"
  | "uuid-v4";

export type LengthMode = "character" | "half-width" | "bytes";

// Lorem固定テキスト
const LOREM_FIXED_TEXT =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

// 日本語ダミーテキスト
const JAPANESE_DUMMY_TEXT =
  "これはダミーテキストです。文章の長さやレイアウトを確認するために使用します。この文章には特に意味はありません。";

// 文字数カウント関数
export function countLength(str: string, mode: LengthMode): number {
  if (mode === "character") {
    return str.length;
  } else if (mode === "half-width") {
    let count = 0;
    for (const char of str) {
      const isFullWidth = char.match(/[^\x00-\x7F]/);
      count += isFullWidth ? 2 : 1;
    }
    return count;
  } else if (mode === "bytes") {
    let byteCount = 0;
    for (const char of str) {
      byteCount += new Blob([char]).size;
    }
    return byteCount;
  }
  return str.length;
}

// Fisher-Yatesアルゴリズムでシャッフル（セキュアな乱数を使用）
export function shuffleString(str: string): string {
  return shuffleStringSecure(str);
}

// UUIDv4生成関数（セキュアな乱数を使用）
function generateUUIDv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = getSecureRandomInt(16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 文字種に応じた生成
function generateByType(textType: TextType, len: number): string {
  switch (textType) {
    case "alphanumeric": {
      const alphanumericChars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      return Array.from({ length: len }, () => {
        return alphanumericChars[getSecureRandomInt(alphanumericChars.length)];
      }).join("");
    }
    case "japanese-full": {
      const hiragana =
        "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
      const kanji = "一二三四五六七八九十日月火水木金土山川田海空";
      const japaneseChars = hiragana + kanji;
      return Array.from(
        { length: len },
        () => japaneseChars[getSecureRandomInt(japaneseChars.length)]
      ).join("");
    }
    case "mixed": {
      const mixedChars = "ABC123abcあいうアイウ漢字";
      return Array.from(
        { length: len },
        () => mixedChars[getSecureRandomInt(mixedChars.length)]
      ).join("");
    }
    case "lorem":
      // 固定テキストを繰り返して指定文字数まで生成（characterモードの場合のみ）
      let result = "";
      let textIndex = 0;
      while (result.length < len) {
        const char = LOREM_FIXED_TEXT[textIndex % LOREM_FIXED_TEXT.length];
        const testResult = result + char;
        if (testResult.length <= len) {
          result = testResult;
        } else {
          break;
        }
        textIndex++;
      }
      return result;
    case "natural-japanese":
      // 固定テキストを繰り返して指定文字数まで生成（characterモードの場合のみ）
      let japaneseResult = "";
      let japaneseIndex = 0;
      while (japaneseResult.length < len) {
        const char =
          JAPANESE_DUMMY_TEXT[japaneseIndex % JAPANESE_DUMMY_TEXT.length];
        const testJapaneseResult = japaneseResult + char;
        if (testJapaneseResult.length <= len) {
          japaneseResult = testJapaneseResult;
        } else {
          break;
        }
        japaneseIndex++;
      }
      return japaneseResult;
    case "numeric-only": {
      const numericChars = "0123456789";
      return Array.from({ length: len }, () => {
        return numericChars[getSecureRandomInt(numericChars.length)];
      }).join("");
    }
    case "lowercase-only": {
      const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
      return Array.from({ length: len }, () => {
        return lowercaseChars[getSecureRandomInt(lowercaseChars.length)];
      }).join("");
    }
    case "uppercase-only": {
      const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      return Array.from({ length: len }, () => {
        return uppercaseChars[getSecureRandomInt(uppercaseChars.length)];
      }).join("");
    }
    case "uuid-v4":
      // UUIDv4は固定長（36文字）のため、長さパラメータを無視
      return generateUUIDv4();
    default:
      return "";
  }
}

// 文字数モードに応じた生成
function generateWithLengthMode(
  textType: TextType,
  lengthMode: LengthMode,
  targetLength: number
): string {
  if (lengthMode === "character") {
    return generateByType(textType, targetLength);
  }

  // half-width または bytes モードの場合、目標長に達するまで文字を追加
  let result = "";
  while (countLength(result, lengthMode) < targetLength) {
    const remainingLength = targetLength - countLength(result, lengthMode);

    if (textType === "lorem" || textType === "natural-japanese") {
      // Loremまたは日本語ダミーの場合は固定テキストを順番に切り出す
      const fixedText =
        textType === "lorem" ? LOREM_FIXED_TEXT : JAPANESE_DUMMY_TEXT;
      // 既に使った部分を記録
      const usedLength = countLength(result, lengthMode);
      const startIndex = usedLength % fixedText.length;
      let cut = "";

      for (let i = 0; i < fixedText.length; i++) {
        const char = fixedText[(startIndex + i) % fixedText.length];
        const testChunk = cut + char;
        if (countLength(testChunk, lengthMode) <= remainingLength) {
          cut = testChunk;
        } else {
          break;
        }
      }

      if (cut) {
        result += cut;
      } else {
        break;
      }
    } else {
      const chunk = generateByType(textType, 1);
      const testResult = result + chunk;
      if (countLength(testResult, lengthMode) <= targetLength) {
        result = testResult;
      } else {
        break;
      }
    }
  }

  return result;
}

// メインのダミーテキスト生成関数
export function generateDummyTexts(
  textType: TextType,
  lengthMode: LengthMode,
  lengthSpec: {
    mode: "single" | "range";
    single?: number;
    min?: number;
    max?: number;
  },
  count: number
): string[] {
  if (count < 1 || count > 100) {
    return [];
  }

  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    let targetLength: number;

    if (lengthSpec.mode === "single") {
      // 単一の文字数指定
      if (!lengthSpec.single || lengthSpec.single < 1) {
        continue;
      }
      targetLength = lengthSpec.single;
    } else {
      // 範囲指定
      if (
        !lengthSpec.min ||
        !lengthSpec.max ||
        lengthSpec.min < 1 ||
        lengthSpec.max < lengthSpec.min
      ) {
        continue;
      }
      // 最小値と最大値の間でランダムに選択（セキュアな乱数を使用）
      targetLength =
        getSecureRandomInt(lengthSpec.max - lengthSpec.min + 1) +
        lengthSpec.min;
    }

    const text = generateWithLengthMode(textType, lengthMode, targetLength);
    if (text) {
      // japanese-full で half-width モードの場合、シャッフルを適用
      if (textType === "japanese-full" && lengthMode === "half-width") {
        results.push(shuffleString(text));
      } else {
        results.push(text);
      }
    }
  }

  return results;
}
