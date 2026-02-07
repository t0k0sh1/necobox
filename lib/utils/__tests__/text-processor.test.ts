import {
  computeTextStats,
  splitIntoWords,
  convertCase,
  wrapLines,
  joinLines,
  splitToLines,
  removeDuplicateLines,
  sortLines,
  trimLines,
  removeEmptyLines,
} from "../text-processor";

describe("text-processor", () => {
  describe("computeTextStats", () => {
    it("空文字列の統計を返す", () => {
      const stats = computeTextStats("");
      expect(stats.characters).toBe(0);
      expect(stats.charactersNoSpaces).toBe(0);
      expect(stats.words).toBe(0);
      expect(stats.lines).toBe(0);
      expect(stats.nonEmptyLines).toBe(0);
      expect(stats.bytes).toBe(0);
    });

    it("ASCII文字列の統計を正しく計算する", () => {
      const stats = computeTextStats("hello world");
      expect(stats.characters).toBe(11);
      expect(stats.charactersNoSpaces).toBe(10);
      expect(stats.words).toBe(2);
      expect(stats.lines).toBe(1);
      expect(stats.nonEmptyLines).toBe(1);
      expect(stats.bytes).toBe(11);
    });

    it("日本語テキストのバイト数を正しく計算する", () => {
      const stats = computeTextStats("こんにちは");
      expect(stats.characters).toBe(5);
      expect(stats.bytes).toBe(15); // UTF-8で日本語は1文字3バイト
    });

    it("複数行テキストの統計を正しく計算する", () => {
      const stats = computeTextStats("line1\nline2\n\nline4");
      expect(stats.lines).toBe(4);
      expect(stats.nonEmptyLines).toBe(3);
    });

    it("空白のみの行を非空行としてカウントしない", () => {
      const stats = computeTextStats("hello\n   \nworld");
      expect(stats.lines).toBe(3);
      expect(stats.nonEmptyLines).toBe(2);
    });
  });

  describe("splitIntoWords", () => {
    it("camelCaseを分割する", () => {
      expect(splitIntoWords("camelCase")).toEqual(["camel", "Case"]);
    });

    it("snake_caseを分割する", () => {
      expect(splitIntoWords("snake_case")).toEqual(["snake", "case"]);
    });

    it("kebab-caseを分割する", () => {
      expect(splitIntoWords("kebab-case")).toEqual(["kebab", "case"]);
    });

    it("PascalCaseを分割する", () => {
      expect(splitIntoWords("PascalCase")).toEqual(["Pascal", "Case"]);
    });

    it("CONSTANT_CASEを分割する", () => {
      expect(splitIntoWords("CONSTANT_CASE")).toEqual(["CONSTANT", "CASE"]);
    });

    it("連続大文字を正しく処理する (XMLParser)", () => {
      expect(splitIntoWords("XMLParser")).toEqual(["XML", "Parser"]);
    });

    it("空文字列は空配列を返す", () => {
      expect(splitIntoWords("")).toEqual([]);
    });

    it("空白のみの文字列は空配列を返す", () => {
      expect(splitIntoWords("   ")).toEqual([]);
    });
  });

  describe("convertCase", () => {
    it("camelCaseに変換する", () => {
      expect(convertCase("hello_world", "camelCase")).toBe("helloWorld");
    });

    it("snake_caseに変換する", () => {
      expect(convertCase("helloWorld", "snake_case")).toBe("hello_world");
    });

    it("kebab-caseに変換する", () => {
      expect(convertCase("helloWorld", "kebab-case")).toBe("hello-world");
    });

    it("PascalCaseに変換する", () => {
      expect(convertCase("hello_world", "PascalCase")).toBe("HelloWorld");
    });

    it("CONSTANT_CASEに変換する", () => {
      expect(convertCase("helloWorld", "CONSTANT_CASE")).toBe("HELLO_WORLD");
    });

    it("複数行テキストは各行を独立して変換する", () => {
      const result = convertCase("hello_world\nfoo_bar", "camelCase");
      expect(result).toBe("helloWorld\nfooBar");
    });

    it("空文字列は空文字列を返す", () => {
      expect(convertCase("", "camelCase")).toBe("");
    });

    it("空行を含む複数行テキストで空行を保持する", () => {
      const result = convertCase("hello_world\n\nfoo_bar", "camelCase");
      expect(result).toBe("helloWorld\n\nfooBar");
    });

    it("各ケース間の相互変換が正しい", () => {
      // snake_case → PascalCase → camelCase → kebab-case → CONSTANT_CASE
      expect(convertCase("my_variable_name", "PascalCase")).toBe("MyVariableName");
      expect(convertCase("MyVariableName", "camelCase")).toBe("myVariableName");
      expect(convertCase("myVariableName", "kebab-case")).toBe("my-variable-name");
      expect(convertCase("my-variable-name", "CONSTANT_CASE")).toBe(
        "MY_VARIABLE_NAME"
      );
    });
  });

  describe("wrapLines", () => {
    it("シングルクォートで囲む", () => {
      expect(wrapLines("apple\nbanana", "'", "'")).toBe("'apple'\n'banana'");
    });

    it("ダブルクォートで囲む", () => {
      expect(wrapLines("hello", '"', '"')).toBe('"hello"');
    });

    it("カスタムprefix/suffixで囲む", () => {
      expect(wrapLines("test", "<", ">")).toBe("<test>");
    });

    it("空行も囲む", () => {
      expect(wrapLines("a\n\nb", "'", "'")).toBe("'a'\n''\n'b'");
    });

    it("空文字列は空文字列を返す", () => {
      expect(wrapLines("", "'", "'")).toBe("");
    });
  });

  describe("joinLines", () => {
    it("カンマで結合する", () => {
      expect(joinLines("a\nb\nc", "comma")).toBe("a, b, c");
    });

    it("タブで結合する", () => {
      expect(joinLines("a\nb\nc", "tab")).toBe("a\tb\tc");
    });

    it("スペースで結合する", () => {
      expect(joinLines("a\nb\nc", "space")).toBe("a b c");
    });

    it("空文字列は空文字列を返す", () => {
      expect(joinLines("", "comma")).toBe("");
    });

    it("単一行はそのまま返す", () => {
      expect(joinLines("hello", "comma")).toBe("hello");
    });
  });

  describe("splitToLines", () => {
    it("カンマで分割する", () => {
      expect(splitToLines("a, b, c", "comma")).toBe("a\nb\nc");
    });

    it("タブで分割する", () => {
      expect(splitToLines("a\tb\tc", "tab")).toBe("a\nb\nc");
    });

    it("スペースで分割する", () => {
      expect(splitToLines("a b c", "space")).toBe("a\nb\nc");
    });

    it("空文字列は空文字列を返す", () => {
      expect(splitToLines("", "comma")).toBe("");
    });

    it("区切り文字がない場合はそのまま返す", () => {
      expect(splitToLines("hello", "comma")).toBe("hello");
    });
  });

  describe("removeDuplicateLines", () => {
    it("重複行を除去して最初の出現を残す", () => {
      expect(removeDuplicateLines("a\nb\na\nc\nb")).toBe("a\nb\nc");
    });

    it("重複がない場合はそのまま返す", () => {
      expect(removeDuplicateLines("a\nb\nc")).toBe("a\nb\nc");
    });

    it("空行の重複も除去する", () => {
      expect(removeDuplicateLines("a\n\nb\n")).toBe("a\n\nb");
    });

    it("全行同一の場合は1行にする", () => {
      expect(removeDuplicateLines("x\nx\nx")).toBe("x");
    });

    it("空文字列は空文字列を返す", () => {
      expect(removeDuplicateLines("")).toBe("");
    });
  });

  describe("sortLines", () => {
    it("昇順でソートする", () => {
      expect(sortLines("c\na\nb", "asc")).toBe("a\nb\nc");
    });

    it("降順でソートする", () => {
      expect(sortLines("a\nc\nb", "desc")).toBe("c\nb\na");
    });

    it("逆順にする", () => {
      expect(sortLines("a\nb\nc", "reverse")).toBe("c\nb\na");
    });

    it("日本語もソートできる", () => {
      const result = sortLines("い\nあ\nう", "asc");
      expect(result).toBe("あ\nい\nう");
    });

    it("空文字列は空文字列を返す", () => {
      expect(sortLines("", "asc")).toBe("");
    });
  });

  describe("trimLines", () => {
    it("各行の前後空白を除去する", () => {
      expect(trimLines("  hello  \n  world  ")).toBe("hello\nworld");
    });

    it("タブも除去する", () => {
      expect(trimLines("\thello\t\n\tworld\t")).toBe("hello\nworld");
    });

    it("既にトリム済みのテキストはそのまま返す", () => {
      expect(trimLines("hello\nworld")).toBe("hello\nworld");
    });

    it("空文字列は空文字列を返す", () => {
      expect(trimLines("")).toBe("");
    });
  });

  describe("removeEmptyLines", () => {
    it("空行を除去する", () => {
      expect(removeEmptyLines("a\n\nb\n\nc")).toBe("a\nb\nc");
    });

    it("空白のみの行も空行として除去する", () => {
      expect(removeEmptyLines("a\n   \nb")).toBe("a\nb");
    });

    it("全て空行の場合は空文字列を返す", () => {
      expect(removeEmptyLines("\n\n\n")).toBe("");
    });

    it("空行がない場合はそのまま返す", () => {
      expect(removeEmptyLines("a\nb\nc")).toBe("a\nb\nc");
    });

    it("空文字列は空文字列を返す", () => {
      expect(removeEmptyLines("")).toBe("");
    });
  });
});
