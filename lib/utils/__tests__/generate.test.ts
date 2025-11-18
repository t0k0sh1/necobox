import { generatePassword } from "../generate";

describe("generatePassword", () => {
  describe("basic functionality", () => {
    it("generates password of specified length", () => {
      const password = generatePassword({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: false,
        length: 16,
        excludeSimilar: false,
        noRepeat: false,
      });

      expect(password.length).toBe(16);
    });

    it("generates password with only uppercase", () => {
      const password = generatePassword({
        uppercase: true,
        lowercase: false,
        numbers: false,
        symbols: false,
        length: 10,
        excludeSimilar: false,
        noRepeat: false,
      });

      expect(password).toMatch(/^[A-Z]+$/);
    });

    it("generates password with only lowercase", () => {
      const password = generatePassword({
        uppercase: false,
        lowercase: true,
        numbers: false,
        symbols: false,
        length: 10,
        excludeSimilar: false,
        noRepeat: false,
      });

      expect(password).toMatch(/^[a-z]+$/);
    });

    it("generates password with only numbers", () => {
      const password = generatePassword({
        uppercase: false,
        lowercase: false,
        numbers: true,
        symbols: false,
        length: 10,
        excludeSimilar: false,
        noRepeat: false,
      });

      expect(password).toMatch(/^[0-9]+$/);
    });

    it("generates password with only symbols", () => {
      const password = generatePassword({
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: true,
        length: 10,
        excludeSimilar: false,
        noRepeat: false,
      });

      expect(password).toMatch(/^[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$/);
    });
  });

  describe("character type combinations", () => {
    it("generates password with all character types", () => {
      const password = generatePassword({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        length: 20,
        excludeSimilar: false,
        noRepeat: false,
      });

      expect(password.length).toBe(20);
      // Should contain at least one of each type when length > 4
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
    });

    it("ensures each selected character type appears", () => {
      // Run multiple times to ensure consistency
      for (let i = 0; i < 10; i++) {
        const password = generatePassword({
          uppercase: true,
          lowercase: true,
          numbers: true,
          symbols: false,
          length: 10,
          excludeSimilar: false,
          noRepeat: false,
        });

        expect(password).toMatch(/[A-Z]/);
        expect(password).toMatch(/[a-z]/);
        expect(password).toMatch(/[0-9]/);
      }
    });
  });

  describe("excludeSimilar option", () => {
    it("excludes similar characters when enabled", () => {
      const password = generatePassword({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        length: 100,
        excludeSimilar: true,
        noRepeat: false,
      });

      // Similar characters: I, l, O, o, 0, 1, _, |
      expect(password).not.toMatch(/[IlOo01_|]/);
    });
  });

  describe("noRepeat option", () => {
    it("generates password without repeated characters", () => {
      const password = generatePassword({
        uppercase: true,
        lowercase: false,
        numbers: false,
        symbols: false,
        length: 8,
        excludeSimilar: false,
        noRepeat: true,
      });

      const chars = password.split("");
      const uniqueChars = new Set(chars);
      expect(uniqueChars.size).toBe(chars.length);
    });

    it("generates password with numbers only without repeats", () => {
      const password = generatePassword({
        uppercase: false,
        lowercase: false,
        numbers: true,
        symbols: false,
        length: 8,
        excludeSimilar: false,
        noRepeat: true,
      });

      const chars = password.split("");
      const uniqueChars = new Set(chars);
      expect(uniqueChars.size).toBe(chars.length);
    });
  });

  describe("symbolsSelection option", () => {
    it("uses only selected symbols", () => {
      const password = generatePassword({
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: true,
        symbolsSelection: {
          exclamation: true,
          at: true,
          hash: false,
          dollar: false,
          percent: false,
          caret: false,
          ampersand: false,
          asterisk: false,
          parenthesis: false,
          underscore: false,
          plus: false,
          minus: false,
          equals: false,
          bracket: false,
          brace: false,
          pipe: false,
          semicolon: false,
          colon: false,
          comma: false,
          period: false,
          less: false,
          greater: false,
          question: false,
        },
        length: 20,
        excludeSimilar: false,
        noRepeat: false,
      });

      // Only ! and @ should be present
      expect(password).toMatch(/^[!@]+$/);
    });
  });

  describe("error handling", () => {
    it("throws error when no character type selected", () => {
      expect(() => {
        generatePassword({
          uppercase: false,
          lowercase: false,
          numbers: false,
          symbols: false,
          length: 10,
          excludeSimilar: false,
          noRepeat: false,
        });
      }).toThrow("At least one character type must be selected");
    });
  });

  describe("edge cases", () => {
    it("generates single character password", () => {
      const password = generatePassword({
        uppercase: true,
        lowercase: false,
        numbers: false,
        symbols: false,
        length: 1,
        excludeSimilar: false,
        noRepeat: false,
      });

      expect(password.length).toBe(1);
      expect(password).toMatch(/^[A-Z]$/);
    });

    it("handles length equal to character types count", () => {
      const password = generatePassword({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        length: 4,
        excludeSimilar: false,
        noRepeat: false,
      });

      expect(password.length).toBe(4);
    });

    it("handles length less than character types count", () => {
      const password = generatePassword({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        length: 2,
        excludeSimilar: false,
        noRepeat: false,
      });

      expect(password.length).toBe(2);
    });
  });
});
