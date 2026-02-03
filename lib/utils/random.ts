/**
 * 乱数生成ユーティリティ
 * セキュアな乱数とシード付き再現可能な乱数を提供
 */

/**
 * セキュアなランダム整数を生成（0 から max-1 の範囲）
 * crypto APIを使用して暗号学的に安全な乱数を生成
 * rejection samplingによりmodulo biasを回避
 * @param max 上限値（この値は含まれない、正の整数である必要あり）
 * @returns ランダムな整数
 * @throws RangeError maxが正の整数でない場合
 * @throws Error セキュアな乱数生成がサポートされていない環境の場合
 */
export function getSecureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0) {
    throw new RangeError("max must be a positive integer");
  }

  // ブラウザ / グローバル環境: Web Crypto API を優先的に使用
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cryptoObj = (globalThis as any).crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
    const maxUint32 = 0x100000000;
    const limit = maxUint32 - (maxUint32 % max);
    const randomBytes = new Uint32Array(1);

    // 拒否サンプリングでバイアスを回避
    // limit 未満の値のみ受け入れ、それを max で割った余りを返す
    while (true) {
      cryptoObj.getRandomValues(randomBytes);
      const value = randomBytes[0];
      if (value < limit) {
        return value % max;
      }
    }
  }

  // Node.js環境の場合（require が利用可能なときのみ）
  if (typeof require === "function") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require("crypto");

    // Node v14.10.0+ では crypto.randomInt が使用可能
    if (typeof crypto.randomInt === "function") {
      return crypto.randomInt(0, max);
    }

    // 互換性のためのフォールバック: 拒否サンプリングでバイアスを回避
    const maxUint32 = 0x100000000;
    const limit = maxUint32 - (maxUint32 % max);

    while (true) {
      const randomBytes = crypto.randomBytes(4);
      const value = randomBytes.readUInt32BE(0);
      if (value < limit) {
        return value % max;
      }
    }
  }

  // 上記いずれのパスも利用できない環境では、明示的にエラーを投げる
  throw new Error(
    "Secure random number generation is not supported in this environment."
  );
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
export function shuffleArray<T>(array: T[], randomFn?: () => number): T[] {
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
