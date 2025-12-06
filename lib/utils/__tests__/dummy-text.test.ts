import {
  countLength,
  shuffleString,
  generateDummyTexts,
} from "../dummy-text";

describe("countLength", () => {
  describe("character mode", () => {
    it("counts ASCII characters correctly", () => {
      expect(countLength("hello", "character")).toBe(5);
    });

    it("counts Japanese characters correctly", () => {
      expect(countLength("あいう", "character")).toBe(3);
    });

    it("counts mixed characters correctly", () => {
      expect(countLength("ABCあいう", "character")).toBe(6);
    });

    it("returns 0 for empty string", () => {
      expect(countLength("", "character")).toBe(0);
    });
  });

  describe("half-width mode", () => {
    it("counts ASCII as 1 each", () => {
      expect(countLength("abc", "half-width")).toBe(3);
    });

    it("counts full-width characters as 2 each", () => {
      expect(countLength("あいう", "half-width")).toBe(6);
    });

    it("counts mixed correctly", () => {
      expect(countLength("abcあい", "half-width")).toBe(7);
    });
  });

  describe("bytes mode", () => {
    it("counts ASCII as 1 byte each", () => {
      expect(countLength("abc", "bytes")).toBe(3);
    });

    it("counts Japanese characters as 3 bytes each (UTF-8)", () => {
      expect(countLength("あ", "bytes")).toBe(3);
    });
  });
});

describe("shuffleString", () => {
  it("returns a string of the same length", () => {
    const input = "abcdef";
    const result = shuffleString(input);
    expect(result.length).toBe(input.length);
  });

  it("contains all original characters", () => {
    const input = "abcdef";
    const result = shuffleString(input);
    const sortedInput = input.split("").sort().join("");
    const sortedResult = result.split("").sort().join("");
    expect(sortedResult).toBe(sortedInput);
  });

  it("handles empty string", () => {
    expect(shuffleString("")).toBe("");
  });

  it("handles single character", () => {
    expect(shuffleString("a")).toBe("a");
  });
});

describe("generateDummyTexts", () => {
  describe("alphanumeric type", () => {
    it("generates texts with correct lengths (single mode)", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "single", single: 10 }, 1);
      expect(results.length).toBe(1);
      expect(results[0].length).toBe(10);
    });

    it("generates multiple texts with correct count", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "single", single: 10 }, 5);
      expect(results.length).toBe(5);
      results.forEach((result) => {
        expect(result.length).toBe(10);
      });
    });

    it("generates only alphanumeric characters", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "single", single: 20 }, 1);
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      results.forEach((result) => {
        expect(result).toMatch(alphanumericRegex);
      });
    });

    it("generates texts with range length", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "range", min: 5, max: 15 }, 10);
      expect(results.length).toBe(10);
      results.forEach((result) => {
        expect(result.length).toBeGreaterThanOrEqual(5);
        expect(result.length).toBeLessThanOrEqual(15);
      });
    });
  });

  describe("japanese-full type", () => {
    it("generates Japanese characters", () => {
      const results = generateDummyTexts("japanese-full", "character", { mode: "single", single: 10 }, 1);
      expect(results.length).toBe(1);
      // Check for Japanese characters
      const hasJapanese = results.some((r) => /[\u3040-\u9FFF]/.test(r));
      expect(hasJapanese).toBe(true);
    });
  });

  describe("lorem type", () => {
    it("generates Lorem ipsum text", () => {
      const results = generateDummyTexts("lorem", "character", { mode: "single", single: 20 }, 1);
      expect(results.length).toBe(1);
      // Lorem ipsum starts with "Lorem"
      expect(results[0]).toMatch(/^Lorem/);
    });

    it("repeats text for longer lengths", () => {
      const results = generateDummyTexts("lorem", "character", { mode: "single", single: 500 }, 1);
      expect(results.length).toBe(1);
      expect(results[0].length).toBeGreaterThanOrEqual(500);
    });
  });

  describe("natural-japanese type", () => {
    it("generates Japanese dummy text", () => {
      const results = generateDummyTexts(
        "natural-japanese",
        "character",
        { mode: "single", single: 20 },
        1
      );
      expect(results.length).toBe(1);
      // Japanese dummy text starts with "これは"
      expect(results[0]).toMatch(/^これは/);
    });
  });

  describe("mixed type", () => {
    it("generates mixed character text", () => {
      const results = generateDummyTexts("mixed", "character", { mode: "single", single: 10 }, 1);
      expect(results.length).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("returns empty array for count less than 1", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "single", single: 10 }, 0);
      expect(results).toEqual([]);
    });

    it("returns empty array for count greater than 100", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "single", single: 10 }, 101);
      expect(results).toEqual([]);
    });

    it("returns empty array for single length less than 1", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "single", single: 0 }, 1);
      expect(results).toEqual([]);
    });

    it("returns empty array for invalid range", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "range", min: 10, max: 5 }, 1);
      expect(results).toEqual([]);
    });

    it("handles length of 1", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "single", single: 1 }, 1);
      expect(results.length).toBe(1);
      expect(results[0].length).toBe(1);
    });

    it("handles length of 2", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "single", single: 2 }, 1);
      expect(results.length).toBe(1);
      expect(results[0].length).toBe(2);
    });
  });

  describe("half-width mode", () => {
    it("generates texts based on half-width count", () => {
      const results = generateDummyTexts("alphanumeric", "half-width", { mode: "single", single: 10 }, 1);
      expect(results.length).toBe(1);
      expect(countLength(results[0], "half-width")).toBeLessThanOrEqual(10);
    });
  });

  describe("range mode", () => {
    it("generates texts with lengths within specified range", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "range", min: 5, max: 15 }, 20);
      expect(results.length).toBe(20);
      results.forEach((result) => {
        expect(result.length).toBeGreaterThanOrEqual(5);
        expect(result.length).toBeLessThanOrEqual(15);
      });
    });

    it("generates texts with different lengths in range mode", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "range", min: 10, max: 20 }, 50);
      expect(results.length).toBe(50);

      // Check that we have variety in lengths (not all the same)
      const lengths = results.map((r) => r.length);
      const uniqueLengths = new Set(lengths);
      // With 50 results and a range of 11 possible lengths, we should have some variety
      expect(uniqueLengths.size).toBeGreaterThan(1);
    });

    it("handles range where min equals max", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "range", min: 10, max: 10 }, 5);
      expect(results.length).toBe(5);
      results.forEach((result) => {
        expect(result.length).toBe(10);
      });
    });

    it("returns empty array when min is less than 1 in range mode", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "range", min: 0, max: 10 }, 1);
      expect(results).toEqual([]);
    });

    it("returns empty array when max is less than min in range mode", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "range", min: 10, max: 5 }, 1);
      expect(results).toEqual([]);
    });
  });

  describe("multiple text generation", () => {
    it("generates exact number of texts requested", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "single", single: 10 }, 1);
      expect(results.length).toBe(1);

      const results5 = generateDummyTexts("alphanumeric", "character", { mode: "single", single: 10 }, 5);
      expect(results5.length).toBe(5);

      const results100 = generateDummyTexts("alphanumeric", "character", { mode: "single", single: 10 }, 100);
      expect(results100.length).toBe(100);
    });

    it("generates all texts with same length in single mode", () => {
      const results = generateDummyTexts("alphanumeric", "character", { mode: "single", single: 15 }, 10);
      expect(results.length).toBe(10);
      results.forEach((result) => {
        expect(result.length).toBe(15);
      });
    });
  });
});
