import {
  parseColumnFilter,
  splitLineToColumns,
  matchesColumnFilters,
  getHighlightColumns,
  isColumnFilterMode,
  getColumnFilterPattern,
  type ColumnFilter,
} from "../column-filter";

describe("column-filter", () => {
  describe("parseColumnFilter", () => {
    it("空文字列を処理できる", () => {
      const result = parseColumnFilter("");
      expect(result).toEqual({ columnFilters: [], generalPattern: null });
    });

    it("スペースのみを処理できる", () => {
      const result = parseColumnFilter("   ");
      expect(result).toEqual({ columnFilters: [], generalPattern: null });
    });

    it("一般パターンを解析できる", () => {
      const result = parseColumnFilter("error");
      expect(result).toEqual({ columnFilters: [], generalPattern: "error" });
    });

    it("複数単語の一般パターンを解析できる", () => {
      const result = parseColumnFilter("some error message");
      expect(result).toEqual({
        columnFilters: [],
        generalPattern: "some error message",
      });
    });

    it("列ハイライト（パターンなし）を解析できる", () => {
      const result = parseColumnFilter("3:");
      expect(result).toEqual({
        columnFilters: [{ column: 3, pattern: "" }],
        generalPattern: null,
      });
    });

    it("列フィルタを解析できる", () => {
      const result = parseColumnFilter("3:for");
      expect(result).toEqual({
        columnFilters: [{ column: 3, pattern: "for" }],
        generalPattern: null,
      });
    });

    it("スペースを含む列フィルタを解析できる", () => {
      const result = parseColumnFilter("3: GET ");
      expect(result).toEqual({
        columnFilters: [{ column: 3, pattern: "GET" }],
        generalPattern: null,
      });
    });

    it("複数列フィルタを解析できる", () => {
      const result = parseColumnFilter("2:GET, 3:200");
      expect(result).toEqual({
        columnFilters: [
          { column: 2, pattern: "GET" },
          { column: 3, pattern: "200" },
        ],
        generalPattern: null,
      });
    });

    it("複数列フィルタとハイライトの組み合わせを解析できる", () => {
      const result = parseColumnFilter("2:GET, 4:");
      expect(result).toEqual({
        columnFilters: [
          { column: 2, pattern: "GET" },
          { column: 4, pattern: "" },
        ],
        generalPattern: null,
      });
    });

    it("列番号0以下は無視される", () => {
      const result = parseColumnFilter("0:test, 1:valid");
      expect(result).toEqual({
        columnFilters: [{ column: 1, pattern: "valid" }],
        generalPattern: null,
      });
    });

    it("2桁の列番号を解析できる", () => {
      const result = parseColumnFilter("12:value");
      expect(result).toEqual({
        columnFilters: [{ column: 12, pattern: "value" }],
        generalPattern: null,
      });
    });
  });

  describe("splitLineToColumns", () => {
    it("空の区切り文字で分割しない", () => {
      const result = splitLineToColumns("hello world", "");
      expect(result).toEqual(["hello world"]);
    });

    it("スペースで分割できる", () => {
      const result = splitLineToColumns("GET /api/users 200", " ");
      expect(result).toEqual(["GET", "/api/users", "200"]);
    });

    it("連続スペースを1つの区切りとして扱う", () => {
      const result = splitLineToColumns("GET    /api/users    200", " ");
      expect(result).toEqual(["GET", "/api/users", "200"]);
    });

    it("タブで分割できる", () => {
      const result = splitLineToColumns("col1\tcol2\tcol3", "\t");
      expect(result).toEqual(["col1", "col2", "col3"]);
    });

    it("カンマで分割できる", () => {
      const result = splitLineToColumns("name,age,city", ",");
      expect(result).toEqual(["name", "age", "city"]);
    });

    it("カスタム区切り文字で分割できる", () => {
      const result = splitLineToColumns("a|b|c", "|");
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("先頭・末尾の空列を保持（カンマ）", () => {
      const result = splitLineToColumns(",value,", ",");
      expect(result).toEqual(["", "value", ""]);
    });
  });

  describe("matchesColumnFilters", () => {
    const columns = ["GET", "/api/users", "200", "123ms"];

    it("フィルタがない場合は常にマッチ", () => {
      expect(matchesColumnFilters(columns, [], false)).toBe(true);
    });

    it("単一列フィルタがマッチする", () => {
      const filters: ColumnFilter[] = [{ column: 1, pattern: "GET" }];
      expect(matchesColumnFilters(columns, filters, false)).toBe(true);
    });

    it("大文字小文字を区別しない", () => {
      const filters: ColumnFilter[] = [{ column: 1, pattern: "get" }];
      expect(matchesColumnFilters(columns, filters, false)).toBe(true);
    });

    it("部分一致でマッチする", () => {
      const filters: ColumnFilter[] = [{ column: 2, pattern: "api" }];
      expect(matchesColumnFilters(columns, filters, false)).toBe(true);
    });

    it("マッチしない場合はfalse", () => {
      const filters: ColumnFilter[] = [{ column: 1, pattern: "POST" }];
      expect(matchesColumnFilters(columns, filters, false)).toBe(false);
    });

    it("複数フィルタがすべてマッチする（AND条件）", () => {
      const filters: ColumnFilter[] = [
        { column: 1, pattern: "GET" },
        { column: 3, pattern: "200" },
      ];
      expect(matchesColumnFilters(columns, filters, false)).toBe(true);
    });

    it("複数フィルタで1つでもマッチしない場合はfalse", () => {
      const filters: ColumnFilter[] = [
        { column: 1, pattern: "GET" },
        { column: 3, pattern: "404" },
      ];
      expect(matchesColumnFilters(columns, filters, false)).toBe(false);
    });

    it("列番号が範囲外の場合はマッチしない", () => {
      const filters: ColumnFilter[] = [{ column: 10, pattern: "test" }];
      expect(matchesColumnFilters(columns, filters, false)).toBe(false);
    });

    it("パターンが空の場合は常にマッチ（ハイライトのみ）", () => {
      const filters: ColumnFilter[] = [{ column: 1, pattern: "" }];
      expect(matchesColumnFilters(columns, filters, false)).toBe(true);
    });

    it("正規表現モードで完全一致", () => {
      const filters: ColumnFilter[] = [{ column: 1, pattern: "^GET$" }];
      expect(matchesColumnFilters(columns, filters, true)).toBe(true);
    });

    it("正規表現モードで部分一致", () => {
      const filters: ColumnFilter[] = [{ column: 2, pattern: "/api/.*" }];
      expect(matchesColumnFilters(columns, filters, true)).toBe(true);
    });

    it("無効な正規表現は文字列マッチにフォールバック", () => {
      const filters: ColumnFilter[] = [{ column: 1, pattern: "[invalid" }];
      expect(matchesColumnFilters(columns, filters, true)).toBe(false);
    });
  });

  describe("getHighlightColumns", () => {
    it("空のフィルタから空のセットを返す", () => {
      const result = getHighlightColumns([]);
      expect(result.size).toBe(0);
    });

    it("単一フィルタから列番号を取得", () => {
      const filters: ColumnFilter[] = [{ column: 3, pattern: "" }];
      const result = getHighlightColumns(filters);
      expect(result.has(3)).toBe(true);
      expect(result.size).toBe(1);
    });

    it("複数フィルタから列番号を取得", () => {
      const filters: ColumnFilter[] = [
        { column: 2, pattern: "GET" },
        { column: 4, pattern: "" },
      ];
      const result = getHighlightColumns(filters);
      expect(result.has(2)).toBe(true);
      expect(result.has(4)).toBe(true);
      expect(result.size).toBe(2);
    });

    it("重複する列番号は1つにまとめられる", () => {
      const filters: ColumnFilter[] = [
        { column: 3, pattern: "a" },
        { column: 3, pattern: "b" },
      ];
      const result = getHighlightColumns(filters);
      expect(result.has(3)).toBe(true);
      expect(result.size).toBe(1);
    });
  });

  describe("isColumnFilterMode", () => {
    it("列フィルタがある場合はtrue", () => {
      const result = isColumnFilterMode({
        columnFilters: [{ column: 1, pattern: "test" }],
        generalPattern: null,
      });
      expect(result).toBe(true);
    });

    it("列フィルタがない場合はfalse", () => {
      const result = isColumnFilterMode({
        columnFilters: [],
        generalPattern: "test",
      });
      expect(result).toBe(false);
    });
  });

  describe("getColumnFilterPattern", () => {
    it("空のフィルタリストからは空文字を返す", () => {
      expect(getColumnFilterPattern([])).toBe("");
    });

    it("パターンがあるフィルタから最初のパターンを返す", () => {
      const filters: ColumnFilter[] = [
        { column: 2, pattern: "GET" },
        { column: 3, pattern: "200" },
      ];
      expect(getColumnFilterPattern(filters)).toBe("GET");
    });

    it("パターンが空のフィルタのみの場合は空文字を返す", () => {
      const filters: ColumnFilter[] = [{ column: 1, pattern: "" }];
      expect(getColumnFilterPattern(filters)).toBe("");
    });

    it("最初のパターンが空でも次のパターンを返す", () => {
      const filters: ColumnFilter[] = [
        { column: 1, pattern: "" },
        { column: 2, pattern: "value" },
      ];
      expect(getColumnFilterPattern(filters)).toBe("value");
    });
  });
});
