import { generatePassword } from "../generate";

// デフォルトオプション（テスト共通）
const defaults = {
  spaces: false,
  unicode: false,
  excludeSimilar: false,
  noRepeat: false,
};

describe("generatePassword", () => {
  describe("basic functionality", () => {
    it("generates password of specified length", () => {
      const password = generatePassword({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: false,
        ...defaults,
        length: 16,
      });

      expect(password.length).toBe(16);
    });

    it("generates password with only uppercase", () => {
      const password = generatePassword({
        uppercase: true,
        lowercase: false,
        numbers: false,
        symbols: false,
        ...defaults,
        length: 10,
      });

      expect(password).toMatch(/^[A-Z]+$/);
    });

    it("generates password with only lowercase", () => {
      const password = generatePassword({
        uppercase: false,
        lowercase: true,
        numbers: false,
        symbols: false,
        ...defaults,
        length: 10,
      });

      expect(password).toMatch(/^[a-z]+$/);
    });

    it("generates password with only numbers", () => {
      const password = generatePassword({
        uppercase: false,
        lowercase: false,
        numbers: true,
        symbols: false,
        ...defaults,
        length: 10,
      });

      expect(password).toMatch(/^[0-9]+$/);
    });

    it("generates password with only symbols", () => {
      const password = generatePassword({
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: true,
        ...defaults,
        length: 10,
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
        ...defaults,
        length: 20,
      });

      expect(password.length).toBe(20);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
    });

    it("ensures each selected character type appears", () => {
      for (let i = 0; i < 10; i++) {
        const password = generatePassword({
          uppercase: true,
          lowercase: true,
          numbers: true,
          symbols: false,
          ...defaults,
          length: 10,
        });

        expect(password).toMatch(/[A-Z]/);
        expect(password).toMatch(/[a-z]/);
        expect(password).toMatch(/[0-9]/);
      }
    });
  });

  describe("spaces option", () => {
    it("generates password containing spaces", () => {
      const password = generatePassword({
        uppercase: false,
        lowercase: true,
        numbers: false,
        symbols: false,
        spaces: true,
        unicode: false,
        length: 50,
        excludeSimilar: false,
        noRepeat: false,
      });

      expect(password).toMatch(/ /);
    });

    it("generates password with only spaces", () => {
      const password = generatePassword({
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false,
        spaces: true,
        unicode: false,
        length: 5,
        excludeSimilar: false,
        noRepeat: false,
      });

      expect(password).toBe("     ");
    });
  });

  describe("unicode option", () => {
    it("generates password containing non-ASCII characters", () => {
      const password = generatePassword({
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false,
        spaces: false,
        unicode: true,
        length: 10,
        excludeSimilar: false,
        noRepeat: false,
      });

      // 全文字が非ASCIIであること
      expect(password).toMatch(/^[^\x00-\x7E]+$/);
    });

    it("generates password with unicode and ascii mix", () => {
      const password = generatePassword({
        uppercase: true,
        lowercase: true,
        numbers: false,
        symbols: false,
        spaces: false,
        unicode: true,
        length: 20,
        excludeSimilar: false,
        noRepeat: false,
      });

      expect(password.length).toBe(20);
      // 各種が含まれる（Unicode文字セットから最低1文字）
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[^\x00-\x7E]/);
    });
  });

  describe("excludeSimilar option", () => {
    it("excludes similar characters when enabled", () => {
      const password = generatePassword({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        ...defaults,
        length: 100,
        excludeSimilar: true,
      });

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
        ...defaults,
        length: 8,
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
        ...defaults,
        length: 8,
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
        ...defaults,
        length: 20,
      });

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
          ...defaults,
          length: 10,
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
        ...defaults,
        length: 1,
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
        ...defaults,
        length: 4,
      });

      expect(password.length).toBe(4);
    });

    it("handles length less than character types count", () => {
      const password = generatePassword({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        ...defaults,
        length: 2,
      });

      expect(password.length).toBe(2);
    });
  });
});
