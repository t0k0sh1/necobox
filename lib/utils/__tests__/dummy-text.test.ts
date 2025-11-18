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
    it("generates texts with correct lengths", () => {
      const results = generateDummyTexts("alphanumeric", "character", "10");
      expect(results.length).toBeGreaterThan(0);
      // Should contain 1, 9, 10, 11 character strings (or subset)
      expect(results.some((r) => r.length === 10)).toBe(true);
    });

    it("generates only alphanumeric characters", () => {
      const results = generateDummyTexts("alphanumeric", "character", "20");
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      results.forEach((result) => {
        expect(result).toMatch(alphanumericRegex);
      });
    });
  });

  describe("japanese-full type", () => {
    it("generates Japanese characters", () => {
      const results = generateDummyTexts("japanese-full", "character", "10");
      expect(results.length).toBeGreaterThan(0);
      // Check for Japanese characters
      const hasJapanese = results.some((r) => /[\u3040-\u9FFF]/.test(r));
      expect(hasJapanese).toBe(true);
    });
  });

  describe("lorem type", () => {
    it("generates Lorem ipsum text", () => {
      const results = generateDummyTexts("lorem", "character", "20");
      expect(results.length).toBeGreaterThan(0);
      // Lorem ipsum starts with "Lorem"
      expect(results[results.length - 1]).toMatch(/^Lorem/);
    });

    it("repeats text for longer lengths", () => {
      const results = generateDummyTexts("lorem", "character", "500");
      expect(results.length).toBeGreaterThan(0);
      const longest = results[results.length - 1];
      expect(longest.length).toBeGreaterThanOrEqual(500);
    });
  });

  describe("natural-japanese type", () => {
    it("generates Japanese dummy text", () => {
      const results = generateDummyTexts(
        "natural-japanese",
        "character",
        "20"
      );
      expect(results.length).toBeGreaterThan(0);
      // Japanese dummy text starts with "これは"
      expect(results[results.length - 1]).toMatch(/^これは/);
    });
  });

  describe("mixed type", () => {
    it("generates mixed character text", () => {
      const results = generateDummyTexts("mixed", "character", "10");
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("returns empty array for length less than 1", () => {
      const results = generateDummyTexts("alphanumeric", "character", "0");
      expect(results).toEqual([]);
    });

    it("returns empty array for negative length", () => {
      const results = generateDummyTexts("alphanumeric", "character", "-5");
      expect(results).toEqual([]);
    });

    it("handles length of 1", () => {
      const results = generateDummyTexts("alphanumeric", "character", "1");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.length === 1)).toBe(true);
    });

    it("handles length of 2", () => {
      const results = generateDummyTexts("alphanumeric", "character", "2");
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("half-width mode", () => {
    it("generates texts based on half-width count", () => {
      const results = generateDummyTexts("alphanumeric", "half-width", "10");
      expect(results.length).toBeGreaterThan(0);
      results.forEach((result) => {
        expect(countLength(result, "half-width")).toBeLessThanOrEqual(11);
      });
    });
  });
});
