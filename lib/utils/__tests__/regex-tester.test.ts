import {
  validatePattern,
  executeRegex,
  buildFlagsString,
  REGEX_PRESETS,
} from "../regex-tester";

describe("regex-tester", () => {
  describe("validatePattern", () => {
    it("有効なパターンをバリデーションできる", () => {
      expect(validatePattern("\\d+", "g")).toEqual({
        valid: true,
        error: null,
      });
    });

    it("無効なパターンのエラーを返す", () => {
      const result = validatePattern("[", "g");
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("空のパターンは valid=false, error=null を返す", () => {
      expect(validatePattern("", "g")).toEqual({
        valid: false,
        error: null,
      });
    });
  });

  describe("executeRegex", () => {
    it("グローバルフラグで複数マッチを見つける", () => {
      const result = executeRegex("\\d+", "g", "abc 123 def 456");
      expect(result.matchCount).toBe(2);
      expect(result.matches[0].fullMatch).toBe("123");
      expect(result.matches[0].index).toBe(4);
      expect(result.matches[1].fullMatch).toBe("456");
      expect(result.matches[1].index).toBe(12);
    });

    it("グローバルフラグなしで最初のマッチのみ返す", () => {
      const result = executeRegex("\\d+", "", "abc 123 def 456");
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].fullMatch).toBe("123");
    });

    it("マッチなしの場合は空配列を返す", () => {
      const result = executeRegex("\\d+", "g", "abc def");
      expect(result.matchCount).toBe(0);
      expect(result.matches).toEqual([]);
    });

    it("キャプチャグループを正しく取得する", () => {
      const result = executeRegex(
        "(\\d{4})-(\\d{2})-(\\d{2})",
        "",
        "Today is 2025-01-15"
      );
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].groups.length).toBe(3);
      expect(result.matches[0].groups[0].value).toBe("2025");
      expect(result.matches[0].groups[1].value).toBe("01");
      expect(result.matches[0].groups[2].value).toBe("15");
    });

    it("名前付きキャプチャグループを取得する", () => {
      const result = executeRegex(
        "(?<year>\\d{4})-(?<month>\\d{2})",
        "",
        "2025-01"
      );
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].groups[0].name).toBe("year");
      expect(result.matches[0].groups[0].value).toBe("2025");
      expect(result.matches[0].groups[1].name).toBe("month");
      expect(result.matches[0].groups[1].value).toBe("01");
    });

    it("空パターンの場合は空結果を返す", () => {
      const result = executeRegex("", "g", "test");
      expect(result.matchCount).toBe(0);
      expect(result.error).toBeNull();
    });

    it("無効なパターンの場合はエラーを返す", () => {
      const result = executeRegex("[", "g", "test");
      expect(result.matchCount).toBe(0);
      expect(result.error).toBeTruthy();
    });

    it("大文字小文字無視フラグが動作する", () => {
      const result = executeRegex("abc", "gi", "ABC abc AbC");
      expect(result.matchCount).toBe(3);
    });

    it("空文字マッチで無限ループしない", () => {
      const result = executeRegex("", "g", "abc");
      // 空マッチは各位置で発生するが、無限ループしない
      expect(result.matchCount).toBe(0); // 空パターンは早期リターン
    });
  });

  describe("buildFlagsString", () => {
    it("有効なフラグのみを連結する", () => {
      expect(
        buildFlagsString({ g: true, i: false, m: true, s: false, u: false })
      ).toBe("gm");
    });

    it("すべてfalseの場合は空文字列", () => {
      expect(
        buildFlagsString({ g: false, i: false, m: false })
      ).toBe("");
    });
  });

  describe("REGEX_PRESETS", () => {
    it("すべてのプリセットが有効な正規表現を持つ", () => {
      for (const preset of REGEX_PRESETS) {
        expect(() => new RegExp(preset.pattern, preset.flags)).not.toThrow();
      }
    });

    it("メールプリセットがメールアドレスにマッチする", () => {
      const emailPreset = REGEX_PRESETS.find((p) => p.id === "email")!;
      const result = executeRegex(
        emailPreset.pattern,
        emailPreset.flags,
        "Contact us at test@example.com"
      );
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].fullMatch).toBe("test@example.com");
    });
  });
});
