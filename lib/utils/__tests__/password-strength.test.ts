import {
  evaluateNistCompliance,
  countCharacterTypes,
  countCodePoints,
  estimateCharsetSize,
  calculateEntropy,
  evaluatePasswordStrength,
} from "../password-strength";

describe("countCharacterTypes", () => {
  it("大文字のみ → 1", () => {
    expect(countCharacterTypes("ABCDEFGH")).toBe(1);
  });

  it("小文字のみ → 1", () => {
    expect(countCharacterTypes("abcdefgh")).toBe(1);
  });

  it("数字のみ → 1", () => {
    expect(countCharacterTypes("12345678")).toBe(1);
  });

  it("ASCII記号のみ → 1", () => {
    expect(countCharacterTypes("!@#$%^&*")).toBe(1);
  });

  it("スペースのみ → 1", () => {
    expect(countCharacterTypes("        ")).toBe(1);
  });

  it("Unicode文字のみ → 1", () => {
    expect(countCharacterTypes("日本語テスト")).toBe(1);
  });

  it("大文字 + 数字 → 2", () => {
    expect(countCharacterTypes("ABC12345")).toBe(2);
  });

  it("大文字 + 小文字 → 2", () => {
    expect(countCharacterTypes("ABCDabcd")).toBe(2);
  });

  it("大文字 + 小文字 + 数字 → 3", () => {
    expect(countCharacterTypes("ABCabc123")).toBe(3);
  });

  it("ASCII全種類（大文字+小文字+数字+記号） → 4", () => {
    expect(countCharacterTypes("Aa1!")).toBe(4);
  });

  it("大文字 + 小文字 + 数字 + 記号 + スペース → 5", () => {
    expect(countCharacterTypes("Aa1! ")).toBe(5);
  });

  it("全種類（大文字+小文字+数字+記号+スペース+Unicode） → 6", () => {
    expect(countCharacterTypes("Aa1! 日")).toBe(6);
  });

  it("小文字 + スペース → 2", () => {
    expect(countCharacterTypes("correct horse")).toBe(2);
  });

  it("小文字 + スペース + Unicode → 3", () => {
    expect(countCharacterTypes("hello wörld")).toBe(3);
  });

  it("絵文字のみ → 1 (非ASCII)", () => {
    expect(countCharacterTypes("🔑🔒🛡️")).toBe(1);
  });

  it("空文字 → 0", () => {
    expect(countCharacterTypes("")).toBe(0);
  });
});

describe("estimateCharsetSize", () => {
  it("大文字のみ → 26", () => {
    expect(estimateCharsetSize("ABCDEF")).toBe(26);
  });

  it("小文字のみ → 26", () => {
    expect(estimateCharsetSize("abcdef")).toBe(26);
  });

  it("数字のみ → 10", () => {
    expect(estimateCharsetSize("123456")).toBe(10);
  });

  it("大文字+小文字 → 52", () => {
    expect(estimateCharsetSize("ABCabc")).toBe(52);
  });

  it("大文字+小文字+数字 → 62", () => {
    expect(estimateCharsetSize("ABCabc123")).toBe(62);
  });

  it("大文字+小文字+数字+記号 → 95", () => {
    expect(estimateCharsetSize("Aa1!")).toBe(95);
  });

  it("全種類 → 196", () => {
    expect(estimateCharsetSize("Aa1! 日")).toBe(196);
  });

  it("空文字 → 0", () => {
    expect(estimateCharsetSize("")).toBe(0);
  });
});

describe("calculateEntropy", () => {
  it("数字のみ12文字 → 約39.9ビット", () => {
    // 12 * log2(10) = 12 * 3.3219 = 39.86
    const entropy = calculateEntropy("123456789012");
    expect(entropy).toBeCloseTo(39.86, 0);
  });

  it("英小文字のみ12文字 → 約56.4ビット", () => {
    // 12 * log2(26) = 12 * 4.7004 = 56.4
    const entropy = calculateEntropy("abcdefghijkl");
    expect(entropy).toBeCloseTo(56.4, 0);
  });

  it("英大小+数字 16文字 → 約95.3ビット", () => {
    // 16 * log2(62) = 16 * 5.9542 = 95.27
    const entropy = calculateEntropy("ABCDabcd12345678");
    expect(entropy).toBeCloseTo(95.3, 0);
  });

  it("英大小+数字+記号 16文字 → 約105ビット", () => {
    // 16 * log2(95) = 16 * 6.5699 = 105.1
    const entropy = calculateEntropy("ABCDabcd1234!@#$");
    expect(entropy).toBeCloseTo(105.1, 0);
  });

  it("空文字 → 0", () => {
    expect(calculateEntropy("")).toBe(0);
  });
});

describe("エントロピーベースのスコア上限（統合テスト）", () => {
  // 具体的なスコア値の検証にはevaluatePasswordStrengthが必要だが、
  // zxcvbnのモック無しではテストしにくいため、エントロピー値から
  // 期待されるスコア上限を検証する

  it("数字のみ12文字はエントロピー40未満 → 上限0", () => {
    // 12 * log2(10) = 39.86 < 40
    const entropy = calculateEntropy("123456789012");
    expect(entropy).toBeLessThan(40);
  });

  it("英小文字のみ12文字はエントロピー40-59 → 上限1", () => {
    const entropy = calculateEntropy("abcdefghijkl");
    expect(entropy).toBeGreaterThanOrEqual(40);
    expect(entropy).toBeLessThan(60);
  });

  it("英大小+数字 12文字はエントロピー60-89 → 上限2", () => {
    // 12 * log2(62) = 71.4
    const entropy = calculateEntropy("ABCDabcd1234");
    expect(entropy).toBeGreaterThanOrEqual(60);
    expect(entropy).toBeLessThan(90);
  });

  it("英大小+数字 16文字はエントロピー90-119 → 上限3", () => {
    // 16 * log2(62) = 95.3
    const entropy = calculateEntropy("ABCDabcd12345678");
    expect(entropy).toBeGreaterThanOrEqual(90);
    expect(entropy).toBeLessThan(120);
  });

  it("英大小+数字+記号 19文字はエントロピー120以上 → 上限4", () => {
    // 19 * log2(95) = 124.8
    const entropy = calculateEntropy("ABCDabcd12345!@#$%^&");
    expect(entropy).toBeGreaterThanOrEqual(120);
  });

  it("全種類(196文字空間) 16文字はエントロピー120以上 → 上限4", () => {
    // 16 * log2(196) = 16 * 7.615 = 121.8
    const entropy = calculateEntropy("Abc1!  日本語テストabc");
    expect(entropy).toBeGreaterThanOrEqual(120);
  });
});

describe("countCodePoints", () => {
  it("ASCII文字列はlengthと同じ", () => {
    expect(countCodePoints("hello")).toBe(5);
  });

  it("日本語文字はコードポイント単位で数える", () => {
    expect(countCodePoints("日本語")).toBe(3);
  });

  it("絵文字（サロゲートペア）を1文字として数える", () => {
    expect(countCodePoints("🔑")).toBe(1);
    expect(countCodePoints("🔑🔒")).toBe(2);
  });

  it("ASCII + 絵文字の混合", () => {
    expect(countCodePoints("pass🔑word")).toBe(9);
  });

  it("空文字", () => {
    expect(countCodePoints("")).toBe(0);
  });
});

describe("evaluateNistCompliance", () => {
  it("ASCII 15文字以上で compliant を返す", () => {
    const result = evaluateNistCompliance("a".repeat(15));
    expect(result.level).toBe("compliant");
    expect(result.minLength).toBe(15);
    expect(result.currentLength).toBe(15);
  });

  it("20文字で compliant を返す", () => {
    const result = evaluateNistCompliance("a".repeat(20));
    expect(result.level).toBe("compliant");
  });

  it("8文字以上15文字未満で multi-factor-only を返す", () => {
    const result = evaluateNistCompliance("a".repeat(8));
    expect(result.level).toBe("multi-factor-only");
    expect(result.minLength).toBe(8);
  });

  it("14文字で multi-factor-only を返す", () => {
    const result = evaluateNistCompliance("a".repeat(14));
    expect(result.level).toBe("multi-factor-only");
  });

  it("8文字未満で non-compliant を返す", () => {
    const result = evaluateNistCompliance("a".repeat(7));
    expect(result.level).toBe("non-compliant");
    expect(result.minLength).toBe(8);
    expect(result.currentLength).toBe(7);
  });

  it("空文字で non-compliant を返す", () => {
    const result = evaluateNistCompliance("");
    expect(result.level).toBe("non-compliant");
    expect(result.currentLength).toBe(0);
  });

  it("絵文字をコードポイント単位で数えて判定する", () => {
    const result = evaluateNistCompliance("🔑🔒🛡️🗝️🔐🔓🔏📋");
    expect(result.level).toBe("multi-factor-only");
    expect(result.currentLength).toBeGreaterThanOrEqual(8);
  });

  it("日本語15文字以上で compliant を返す", () => {
    // "これはとても安全なパスワードです。" → 17コードポイント
    const result = evaluateNistCompliance("これはとても安全なパスワードです。");
    expect(result.level).toBe("compliant");
    expect(result.currentLength).toBe(17);
  });

  it("スペース混在のパスフレーズを正しく判定する", () => {
    const result = evaluateNistCompliance("correct horse battery staple");
    expect(result.level).toBe("compliant");
    expect(result.currentLength).toBe(28);
  });
});

// 実物の @zxcvbn-ts を通すテスト。
// ライブラリの API 変更（結果の形・オプションの渡し方）を検知するため、モックを使わない。
describe("evaluatePasswordStrength（実物の @zxcvbn-ts を使用）", () => {
  it("空文字はスコア 0 で空の結果を返す", async () => {
    const result = await evaluatePasswordStrength("");
    expect(result).toEqual({
      score: 0,
      crackTimeDisplay: "",
      feedback: { warning: "", suggestions: [] },
    });
  });

  it("よく使われるパスワードはスコア 0 で、英語の警告文と提案が付く", async () => {
    const result = await evaluatePasswordStrength("password");
    expect(result.score).toBe(0);
    // 辞書と英語の翻訳がオプションとして渡されていること（翻訳キーのままではない）
    expect(result.feedback.warning).toMatch(/heavily used/i);
    expect(result.feedback.suggestions.length).toBeGreaterThan(0);
    expect(result.crackTimeDisplay).toMatch(/less than a second/i);
  });

  it("キーボード配列のパターンを検出する", async () => {
    const result = await evaluatePasswordStrength("qwertyuiop");
    expect(result.score).toBe(0);
    expect(result.feedback.warning).toMatch(/frequently used/i);
  });

  it("警告がない場合 feedback.warning は空文字になる（null にならない）", async () => {
    const result = await evaluatePasswordStrength("Xk9#mPq2$vLz8@wN4!");
    expect(result.feedback.warning).toBe("");
    expect(Array.isArray(result.feedback.suggestions)).toBe(true);
  });

  it("ランダムで長いパスワードは高スコアで、クラック推定時間が表示される", async () => {
    // 95 文字種 × 18 文字 ≒ 118 ビットのため、エントロピー上限により最大 3
    const result = await evaluatePasswordStrength("Xk9#mPq2$vLz8@wN4!");
    expect(result.score).toBe(3);
    expect(typeof result.crackTimeDisplay).toBe("string");
    expect(result.crackTimeDisplay.length).toBeGreaterThan(0);
  });

  it("日本語のパスワードも評価できる", async () => {
    const result = await evaluatePasswordStrength("あいうえおかきくけこ");
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.crackTimeDisplay.length).toBeGreaterThan(0);
  });
});
