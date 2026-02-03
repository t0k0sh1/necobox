import {
  getSecureRandomInt,
  createSeededRandom,
  shuffleArray,
  shuffleString,
} from "../random";

describe("getSecureRandomInt", () => {
  it("0からmax-1の範囲で整数を返す", () => {
    for (let i = 0; i < 100; i++) {
      const result = getSecureRandomInt(10);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  it("max=1の場合は常に0を返す", () => {
    for (let i = 0; i < 10; i++) {
      expect(getSecureRandomInt(1)).toBe(0);
    }
  });

  it("max=100の場合も正しい範囲で値を返す", () => {
    for (let i = 0; i < 100; i++) {
      const result = getSecureRandomInt(100);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(100);
    }
  });

  it("max=0の場合はRangeErrorを投げる", () => {
    expect(() => getSecureRandomInt(0)).toThrow(RangeError);
    expect(() => getSecureRandomInt(0)).toThrow("max must be a positive integer");
  });

  it("負の値の場合はRangeErrorを投げる", () => {
    expect(() => getSecureRandomInt(-1)).toThrow(RangeError);
    expect(() => getSecureRandomInt(-10)).toThrow(RangeError);
  });

  it("非整数の場合はRangeErrorを投げる", () => {
    expect(() => getSecureRandomInt(1.5)).toThrow(RangeError);
    expect(() => getSecureRandomInt(10.1)).toThrow(RangeError);
  });

  it("NaNの場合はRangeErrorを投げる", () => {
    expect(() => getSecureRandomInt(NaN)).toThrow(RangeError);
  });

  it("Infinityの場合はRangeErrorを投げる", () => {
    expect(() => getSecureRandomInt(Infinity)).toThrow(RangeError);
    expect(() => getSecureRandomInt(-Infinity)).toThrow(RangeError);
  });
});

describe("createSeededRandom", () => {
  it("同じシードから同じ乱数列を生成する", () => {
    const rng1 = createSeededRandom(12345);
    const rng2 = createSeededRandom(12345);

    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("異なるシードから異なる乱数列を生成する", () => {
    const rng1 = createSeededRandom(12345);
    const rng2 = createSeededRandom(54321);

    const values1 = Array.from({ length: 10 }, () => rng1());
    const values2 = Array.from({ length: 10 }, () => rng2());

    // 全ての値が一致することはほぼないはず
    const allSame = values1.every((v, i) => v === values2[i]);
    expect(allSame).toBe(false);
  });

  it("0から1の間の値を返す", () => {
    const rng = createSeededRandom(42);
    for (let i = 0; i < 100; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("シード0は1として扱われる", () => {
    const rng0 = createSeededRandom(0);
    const rng1 = createSeededRandom(1);

    // シード0とシード1は同じ乱数列を生成する
    for (let i = 0; i < 10; i++) {
      expect(rng0()).toBe(rng1());
    }
  });
});

describe("shuffleArray", () => {
  it("配列の要素を保持する", () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(original);

    expect(shuffled.sort()).toEqual(original.sort());
  });

  it("元の配列を変更しない", () => {
    const original = [1, 2, 3, 4, 5];
    const originalCopy = [...original];
    shuffleArray(original);

    expect(original).toEqual(originalCopy);
  });

  it("空の配列でも動作する", () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it("1要素の配列でも動作する", () => {
    expect(shuffleArray([1])).toEqual([1]);
  });

  it("カスタム乱数関数を使用できる", () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled1 = shuffleArray(original, createSeededRandom(42));
    const shuffled2 = shuffleArray(original, createSeededRandom(42));

    // 同じシードなら同じ結果
    expect(shuffled1).toEqual(shuffled2);
  });

  it("文字列の配列でも動作する", () => {
    const original = ["a", "b", "c", "d", "e"];
    const shuffled = shuffleArray(original);

    expect(shuffled.sort()).toEqual(original.sort());
  });
});

describe("shuffleString", () => {
  it("文字列の文字を保持する", () => {
    const original = "hello";
    const shuffled = shuffleString(original);

    expect(shuffled.split("").sort().join("")).toBe(original.split("").sort().join(""));
  });

  it("空文字列でも動作する", () => {
    expect(shuffleString("")).toBe("");
  });

  it("1文字の文字列でも動作する", () => {
    expect(shuffleString("a")).toBe("a");
  });

  it("日本語文字列でも動作する", () => {
    const original = "あいうえお";
    const shuffled = shuffleString(original);

    expect(shuffled.split("").sort().join("")).toBe(original.split("").sort().join(""));
  });

  it("カスタム乱数関数を使用できる", () => {
    const original = "abcdefghij";
    const shuffled1 = shuffleString(original, createSeededRandom(42));
    const shuffled2 = shuffleString(original, createSeededRandom(42));

    // 同じシードなら同じ結果
    expect(shuffled1).toBe(shuffled2);
  });
});
