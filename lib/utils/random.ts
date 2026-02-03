/**
 * 乱数生成ユーティリティ
 * セキュアな乱数とシード付き再現可能な乱数を提供
 */

/**
 * セキュアなランダム整数を生成（0 から max-1 の範囲）
 * crypto APIを使用して暗号学的に安全な乱数を生成
 * @param max 上限値（この値は含まれない）
 * @returns ランダムな整数
 */
export function getSecureRandomInt(max: number): number {
  // ブラウザ環境の場合
  if (typeof window !== "undefined" && window.crypto) {
    const randomBytes = new Uint32Array(1);
    window.crypto.getRandomValues(randomBytes);
    const randomValue = randomBytes[0] / 0x100000000;
    return Math.floor(randomValue * max);
  }

  // Node.js環境の場合
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto");
  const randomBytes = crypto.randomBytes(4);
  const randomValue = randomBytes.readUInt32BE(0) / 0x100000000;
  return Math.floor(randomValue * max);
}

/**
 * シード付き乱数生成器を作成
 * Xorshift32アルゴリズムを使用して再現可能な乱数を生成
 * @param seed シード値
 * @returns 0から1の間の乱数を返す関数
 */
export function createSeededRandom(seed: number): () => number {
  let state = (seed >>> 0) || 1; // 32ビット符号なし整数に変換、0の場合は1に

  return () => {
    // Xorshift32 アルゴリズム
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;

    // 0から1の間の値を返す
    return (state >>> 0) / 0x100000000;
  };
}

/**
 * Fisher-Yatesアルゴリズムで配列をシャッフル
 * @param array シャッフルする配列
 * @param randomFn 乱数生成関数（省略時はセキュアな乱数を使用）
 * @returns シャッフルされた新しい配列
 */
export function shuffleArray<T>(
  array: T[],
  randomFn?: () => number
): T[] {
  const shuffled = [...array];
  const getRandomIndex = randomFn
    ? (max: number) => Math.floor(randomFn() * max)
    : getSecureRandomInt;

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getRandomIndex(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 文字列をシャッフル
 * @param str シャッフルする文字列
 * @param randomFn 乱数生成関数（省略時はセキュアな乱数を使用）
 * @returns シャッフルされた文字列
 */
export function shuffleString(str: string, randomFn?: () => number): string {
  return shuffleArray(str.split(""), randomFn).join("");
}
