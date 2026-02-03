/**
 * ランダム整数ジェネレータのユーティリティ関数
 */

import { createSeededRandom } from "./random";

export interface GeneratorOptions {
  min: number
  max: number
  distribution: 'uniform' | 'normal'
  count: number
  seed: number
}

/**
 * 指定されたオプションに基づいてランダム整数を生成
 * @param options - 生成オプション
 * @returns ランダム整数の配列
 */
export function generateRandomIntegers(options: GeneratorOptions): number[] {
  const { min, max, distribution, count, seed } = options

  // crypto.getRandomValues() を使用してランダムシードを生成
  // シード値が -1 でない場合は、シード値と XOR して組み合わせる
  const randomBytes = new Uint32Array(1)
  crypto.getRandomValues(randomBytes)
  const actualSeed = seed === -1 ? randomBytes[0] : (seed ^ randomBytes[0])

  if (distribution === 'uniform') {
    return generateUniform(min, max, count, actualSeed)
  } else {
    return generateNormal(min, max, count, actualSeed)
  }
}

/**
 * 一様分布に従うランダム整数を生成
 * @param min - 最小値
 * @param max - 最大値
 * @param count - 生成数
 * @param seed - シード値
 * @returns ランダム整数の配列
 */
export function generateUniform(
  min: number,
  max: number,
  count: number,
  seed: number
): number[] {
  const results: number[] = []
  const rng = createSeededRandom(seed)
  const range = max - min + 1

  for (let i = 0; i < count; i++) {
    // 0 から range-1 の範囲でランダム値を生成
    const randomValue = Math.floor(rng() * range)
    results.push(min + randomValue)
  }

  return results
}

/**
 * 正規分布に従うランダム整数を生成
 * @param min - 最小値
 * @param max - 最大値
 * @param count - 生成数
 * @param seed - シード値
 * @returns ランダム整数の配列
 */
export function generateNormal(
  min: number,
  max: number,
  count: number,
  seed: number
): number[] {
  const results: number[] = []
  const rng = createSeededRandom(seed)
  const mean = (min + max) / 2
  const stdDev = (max - min) / 6

  for (let i = 0; i < count; i++) {
    // Box-Muller 変換で正規分布に従う値を生成
    const value = boxMullerTransform(rng, mean, stdDev)
    // min と max の範囲内にクリップして整数に丸める
    const clipped = Math.max(min, Math.min(max, Math.round(value)))
    results.push(clipped)
  }

  return results
}

/**
 * Box-Muller 変換を使用して正規分布に従う乱数を生成
 * @param rng - 乱数生成関数
 * @param mean - 平均値
 * @param stdDev - 標準偏差
 * @returns 正規分布に従う乱数
 */
function boxMullerTransform(
  rng: () => number,
  mean: number,
  stdDev: number
): number {
  const u1 = rng()
  const u2 = rng()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean + z0 * stdDev
}

// seededRandomはcreateSeededRandomとして共通ユーティリティから再エクスポート
export { createSeededRandom as seededRandom } from "./random";
