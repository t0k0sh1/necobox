import type { ZxcvbnResult } from "@zxcvbn-ts/core";

export interface PasswordStrengthResult {
  /** zxcvbnスコア (0-4) */
  score: 0 | 1 | 2 | 3 | 4;
  /** クラック推定時間（表示用文字列） */
  crackTimeDisplay: string;
  /** zxcvbnからのフィードバック */
  feedback: {
    warning: string;
    suggestions: string[];
  };
}

export interface NistComplianceResult {
  /** NIST準拠レベル */
  level: "compliant" | "multi-factor-only" | "non-compliant";
  /** 最小文字数の閾値 */
  minLength: number;
  /** 現在のパスワード長 */
  currentLength: number;
}

// zxcvbn辞書の遅延ロード用キャッシュ
let zxcvbnPromise: Promise<(password: string) => ZxcvbnResult> | null = null;

async function getZxcvbn(): Promise<(password: string) => ZxcvbnResult> {
  if (zxcvbnPromise) return zxcvbnPromise;

  zxcvbnPromise = (async () => {
    const [{ zxcvbn, zxcvbnOptions }, common, en] = await Promise.all([
      import("@zxcvbn-ts/core"),
      import("@zxcvbn-ts/language-common"),
      import("@zxcvbn-ts/language-en"),
    ]);

    // ESM/CJS interopにより、名前付きエクスポートまたはdefault内にある場合の両方に対応
    const adjacencyGraphs = common.adjacencyGraphs ?? common.default?.adjacencyGraphs;
    const commonDict = common.dictionary ?? common.default?.dictionary;
    const enDict = en.dictionary ?? en.default?.dictionary;
    const enTranslations = en.translations ?? en.default?.translations;

    zxcvbnOptions.setOptions({
      graphs: adjacencyGraphs,
      dictionary: {
        ...commonDict,
        ...enDict,
      },
      translations: enTranslations,
    });

    return zxcvbn;
  })();

  return zxcvbnPromise;
}

/**
 * パスワードに含まれる文字種の数を返す。
 * NIST SP 800-63B に基づき、ASCII印字文字・スペース・Unicode文字を
 * それぞれ独立した文字種として評価する。
 *
 * 文字種カテゴリ:
 *   1. ASCII大文字 (A-Z)
 *   2. ASCII小文字 (a-z)
 *   3. ASCII数字 (0-9)
 *   4. ASCII記号 (!@#$%... 等、スペースを除くASCII印字文字)
 *   5. スペース
 *   6. 非ASCII文字（Unicode: 絵文字、CJK、アクセント付き文字等）
 */
export function countCharacterTypes(password: string): number {
  let types = 0;
  if (/[A-Z]/.test(password)) types++;
  if (/[a-z]/.test(password)) types++;
  if (/[0-9]/.test(password)) types++;
  // ASCII記号: 0x21-0x2F, 0x3A-0x40, 0x5B-0x60, 0x7B-0x7E（スペースを除く）
  if (/[!-/:-@[-`{-~]/.test(password)) types++;
  if (/ /.test(password)) types++;
  // 非ASCII文字（Unicodeコードポイント > 0x7E）
  if (/[^\x00-\x7E]/.test(password)) types++;
  return types;
}

/**
 * パスワードに含まれる文字種から、攻撃者が想定する探索空間のサイズを推定する。
 */
export function estimateCharsetSize(password: string): number {
  let size = 0;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[a-z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[!-/:-@[-`{-~]/.test(password)) size += 33;
  if (/ /.test(password)) size += 1;
  if (/[^\x00-\x7E]/.test(password)) size += 100;
  return size;
}

/**
 * パスワードの理論上のエントロピー（ビット数）を計算する。
 * entropy = length * log2(charset_size)
 *
 * 文字種の探索空間サイズと長さの両方を考慮した客観的な指標。
 */
export function calculateEntropy(password: string): number {
  const len = countCodePoints(password);
  const charsetSize = estimateCharsetSize(password);
  if (len === 0 || charsetSize === 0) return 0;
  return len * Math.log2(charsetSize);
}

/**
 * エントロピーに基づくスコア上限を算出する。
 * zxcvbnのパターン検出と併用し、探索空間が狭い場合にスコアを制限する。
 *
 * 閾値:
 *   < 40 bits  → 0 (Very Weak)   例: 数字のみ12文字(39.9bit)
 *   40-59 bits → 1 (Weak)        例: 英小文字のみ12文字(56.4bit)
 *   60-89 bits → 2 (Fair)        例: 英大小+数字 12文字(71.4bit)
 *   90-119 bits → 3 (Strong)     例: 英大小+数字 16文字(95.3bit)
 *   120+ bits  → 4 (Very Strong) 例: 英大小+数字+記号 16文字(105bit) + 長め
 *
 * 参考: 英大小+数字(62文字)の場合
 *   8文字=47.6bit(1), 12文字=71.4bit(2), 16文字=95.3bit(3), 20文字=119bit(3), 21文字=125bit(4)
 *
 * 英大小+数字+記号(95文字)の場合
 *   8文字=52.6bit(1), 12文字=78.8bit(2), 16文字=105bit(3), 19文字=124.6bit(4)
 */
function entropyToMaxScore(entropy: number): 0 | 1 | 2 | 3 | 4 {
  if (entropy >= 120) return 4;
  if (entropy >= 90) return 3;
  if (entropy >= 60) return 2;
  if (entropy >= 40) return 1;
  return 0;
}

/**
 * zxcvbnによるパターンベースのパスワード強度判定。
 * zxcvbnスコアとエントロピーベースのスコア上限の低い方を採用する。
 *
 * - zxcvbn: パターン検出・辞書攻撃に対する強度（人が選んだパスワード向き）
 * - エントロピー上限: 文字種の探索空間 × 長さ（ランダム生成パスワード向き）
 */
export async function evaluatePasswordStrength(
  password: string
): Promise<PasswordStrengthResult> {
  if (!password) {
    return {
      score: 0,
      crackTimeDisplay: "",
      feedback: { warning: "", suggestions: [] },
    };
  }

  const zxcvbn = await getZxcvbn();
  const result = zxcvbn(password);

  const entropy = calculateEntropy(password);
  const entropyCap = entropyToMaxScore(entropy);
  const finalScore = Math.min(result.score, entropyCap) as 0 | 1 | 2 | 3 | 4;

  return {
    score: finalScore,
    crackTimeDisplay:
      result.crackTimesDisplay.offlineSlowHashing1e4PerSecond as string,
    feedback: {
      warning: result.feedback.warning ?? "",
      suggestions: result.feedback.suggestions ?? [],
    },
  };
}

/**
 * Unicodeコードポイント数でパスワード長を計測する。
 * NIST SP 800-63B では各コードポイントを1文字としてカウントする。
 * サロゲートペア（絵文字等）も正しく1文字として数える。
 */
export function countCodePoints(text: string): number {
  return [...text].length;
}

/**
 * NIST SP 800-63B 準拠判定（同期）
 * - Unicodeコードポイント数で長さを判定
 * - 単一要素認証: 15文字以上 → compliant
 * - 多要素認証: 8文字以上 → multi-factor-only
 * - それ未満 → non-compliant
 */
export function evaluateNistCompliance(password: string): NistComplianceResult {
  const len = countCodePoints(password);

  if (len >= 15) {
    return { level: "compliant", minLength: 15, currentLength: len };
  }
  if (len >= 8) {
    return { level: "multi-factor-only", minLength: 8, currentLength: len };
  }
  return { level: "non-compliant", minLength: 8, currentLength: len };
}
