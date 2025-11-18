import {
  generateRandomIntegers,
  generateUniform,
  generateNormal,
  seededRandom,
  type GeneratorOptions,
} from "../random-integer";

// Mock crypto.getRandomValues for consistent testing
const mockGetRandomValues = jest.fn();
Object.defineProperty(global, "crypto", {
  value: {
    getRandomValues: mockGetRandomValues,
  },
});

describe("seededRandom", () => {
  it("returns values between 0 and 1", () => {
    const rng = seededRandom(12345);
    for (let i = 0; i < 100; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("produces deterministic sequence with same seed", () => {
    const rng1 = seededRandom(12345);
    const rng2 = seededRandom(12345);

    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("produces different sequences with different seeds", () => {
    const rng1 = seededRandom(12345);
    const rng2 = seededRandom(54321);

    const values1 = Array.from({ length: 10 }, () => rng1());
    const values2 = Array.from({ length: 10 }, () => rng2());

    expect(values1).not.toEqual(values2);
  });

  it("handles seed of 0 by using 1", () => {
    const rng = seededRandom(0);
    const value = rng();
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });
});

describe("generateUniform", () => {
  it("generates correct number of values", () => {
    const results = generateUniform(1, 100, 10, 12345);
    expect(results).toHaveLength(10);
  });

  it("generates values within range", () => {
    const results = generateUniform(10, 20, 100, 12345);
    results.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(20);
    });
  });

  it("produces deterministic results with same seed", () => {
    const results1 = generateUniform(1, 100, 10, 12345);
    const results2 = generateUniform(1, 100, 10, 12345);
    expect(results1).toEqual(results2);
  });

  it("handles single value range", () => {
    const results = generateUniform(5, 5, 10, 12345);
    results.forEach((value) => {
      expect(value).toBe(5);
    });
  });

  it("handles negative ranges", () => {
    const results = generateUniform(-100, -50, 10, 12345);
    results.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(-100);
      expect(value).toBeLessThanOrEqual(-50);
    });
  });

  it("handles range spanning zero", () => {
    const results = generateUniform(-10, 10, 50, 12345);
    results.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(-10);
      expect(value).toBeLessThanOrEqual(10);
    });
  });
});

describe("generateNormal", () => {
  it("generates correct number of values", () => {
    const results = generateNormal(1, 100, 10, 12345);
    expect(results).toHaveLength(10);
  });

  it("generates values within range (clipped)", () => {
    const results = generateNormal(10, 20, 100, 12345);
    results.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(20);
    });
  });

  it("produces deterministic results with same seed", () => {
    const results1 = generateNormal(1, 100, 10, 12345);
    const results2 = generateNormal(1, 100, 10, 12345);
    expect(results1).toEqual(results2);
  });

  it("generates integers (rounded values)", () => {
    const results = generateNormal(1, 100, 100, 12345);
    results.forEach((value) => {
      expect(Number.isInteger(value)).toBe(true);
    });
  });

  it("tends to cluster around mean", () => {
    const min = 0;
    const max = 100;
    const mean = (min + max) / 2;
    const results = generateNormal(min, max, 1000, 12345);

    // Count values near the mean (within 20% of range)
    const nearMean = results.filter(
      (v) => v >= mean - 10 && v <= mean + 10
    ).length;
    // Normal distribution should have more values near mean
    expect(nearMean).toBeGreaterThan(300); // At least 30% near mean
  });
});

describe("generateRandomIntegers", () => {
  beforeEach(() => {
    mockGetRandomValues.mockImplementation((arr: Uint32Array) => {
      arr[0] = 12345;
      return arr;
    });
  });

  it("uses uniform distribution when specified", () => {
    const options: GeneratorOptions = {
      min: 1,
      max: 100,
      distribution: "uniform",
      count: 10,
      seed: -1,
    };

    const results = generateRandomIntegers(options);
    expect(results).toHaveLength(10);
    results.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(100);
    });
  });

  it("uses normal distribution when specified", () => {
    const options: GeneratorOptions = {
      min: 1,
      max: 100,
      distribution: "normal",
      count: 10,
      seed: -1,
    };

    const results = generateRandomIntegers(options);
    expect(results).toHaveLength(10);
    results.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(100);
    });
  });

  it("combines provided seed with random value", () => {
    const options: GeneratorOptions = {
      min: 1,
      max: 100,
      distribution: "uniform",
      count: 10,
      seed: 99999,
    };

    const results = generateRandomIntegers(options);
    expect(results).toHaveLength(10);
  });

  it("uses only random value when seed is -1", () => {
    const options: GeneratorOptions = {
      min: 1,
      max: 100,
      distribution: "uniform",
      count: 10,
      seed: -1,
    };

    const results = generateRandomIntegers(options);
    expect(results).toHaveLength(10);
  });
});
