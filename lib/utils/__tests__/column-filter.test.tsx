import { renderToStaticMarkup } from "react-dom/server";
import {
  parseColumnFilter,
  splitLineToColumns,
  splitLineToColumnsWithPositions,
  matchesColumnFilters,
  getHighlightColumns,
  highlightColumnsWithSearch,
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

  describe("splitLineToColumnsWithPositions", () => {
    it("空の区切り文字で分割しない", () => {
      const result = splitLineToColumnsWithPositions("hello world", "");
      expect(result).toEqual([{ text: "hello world", start: 0, end: 11 }]);
    });

    it("スペースで分割して位置を保持", () => {
      const result = splitLineToColumnsWithPositions("GET /api 200", " ");
      expect(result).toEqual([
        { text: "GET", start: 0, end: 3 },
        { text: "/api", start: 4, end: 8 },
        { text: "200", start: 9, end: 12 },
      ]);
    });

    it("連続スペースの位置を正確に保持", () => {
      const line = "GET    /api    200";
      const result = splitLineToColumnsWithPositions(line, " ");
      expect(result).toEqual([
        { text: "GET", start: 0, end: 3 },
        { text: "/api", start: 7, end: 11 },
        { text: "200", start: 15, end: 18 },
      ]);
      // 元の行から正しくスライスできることを確認
      expect(line.slice(result[0].start, result[0].end)).toBe("GET");
      expect(line.slice(result[1].start, result[1].end)).toBe("/api");
      expect(line.slice(result[2].start, result[2].end)).toBe("200");
      // 区切り部分も確認
      expect(line.slice(result[0].end, result[1].start)).toBe("    ");
    });

    it("タブで分割して位置を保持", () => {
      const result = splitLineToColumnsWithPositions("col1\tcol2\tcol3", "\t");
      expect(result).toEqual([
        { text: "col1", start: 0, end: 4 },
        { text: "col2", start: 5, end: 9 },
        { text: "col3", start: 10, end: 14 },
      ]);
    });

    it("カンマで分割して位置を保持", () => {
      const result = splitLineToColumnsWithPositions("a,b,c", ",");
      expect(result).toEqual([
        { text: "a", start: 0, end: 1 },
        { text: "b", start: 2, end: 3 },
        { text: "c", start: 4, end: 5 },
      ]);
    });

    it("先頭のスペースを含む行を処理", () => {
      const line = "  GET /api";
      const result = splitLineToColumnsWithPositions(line, " ");
      expect(result).toEqual([
        { text: "GET", start: 2, end: 5 },
        { text: "/api", start: 6, end: 10 },
      ]);
      // 先頭のスペースが保持されていることを確認
      expect(line.slice(0, result[0].start)).toBe("  ");
    });

    it("末尾のスペースを含む行を処理", () => {
      const line = "GET /api  ";
      const result = splitLineToColumnsWithPositions(line, " ");
      expect(result).toEqual([
        { text: "GET", start: 0, end: 3 },
        { text: "/api", start: 4, end: 8 },
      ]);
      // 末尾のスペースが保持されていることを確認（最後の列の end から行末まで）
      expect(line.slice(result[result.length - 1].end)).toBe("  ");
    });

    it("空の行を処理", () => {
      const result = splitLineToColumnsWithPositions("", " ");
      expect(result).toEqual([]);
    });

    it("スペースのみの行を処理", () => {
      const result = splitLineToColumnsWithPositions("   ", " ");
      expect(result).toEqual([]);
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

  describe("highlightColumnsWithSearch", () => {
    // モックのハイライト関数（パターンにマッチした部分を<mark>で囲む）
    const mockHighlightFn = (text: string, pattern: string, isRegex: boolean) => {
      if (!pattern) return text;
      try {
        const regex = isRegex ? new RegExp(`(${pattern})`, "gi") : new RegExp(`(${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
        const parts = text.split(regex);
        if (parts.length === 1) return text;
        return parts.map((part, i) =>
          regex.test(part) ? <mark key={i}>{part}</mark> : part
        );
      } catch {
        return text;
      }
    };

    // ReactNodeを文字列に変換するヘルパー
    const renderResult = (nodes: React.ReactNode[]) => {
      return renderToStaticMarkup(<>{nodes}</>);
    };

    it("区切り文字がない場合は通常のハイライトを返す", () => {
      const result = highlightColumnsWithSearch(
        "hello world",
        "",
        new Set<number>(),
        "world",
        false,
        mockHighlightFn
      );
      expect(renderResult(result)).toContain("<mark>world</mark>");
    });

    it("スペース区切りで列をハイライト（単一列）", () => {
      const result = highlightColumnsWithSearch(
        "GET /api 200",
        " ",
        new Set([2]),
        "",
        false,
        mockHighlightFn
      );
      const html = renderResult(result);
      // 2列目（/api）は通常表示、他はグレー
      expect(html).toContain('class="text-gray-400"');
      expect(html).toContain("/api");
    });

    it("スペース区切りで検索パターン付きハイライト", () => {
      const result = highlightColumnsWithSearch(
        "GET /api/users 200",
        " ",
        new Set([2]),
        "api",
        false,
        mockHighlightFn
      );
      const html = renderResult(result);
      // 2列目の'api'がハイライトされる
      expect(html).toContain("<mark>api</mark>");
    });

    it("連続スペースを保持する", () => {
      const line = "GET    /api    200";
      const result = highlightColumnsWithSearch(
        line,
        " ",
        new Set([1, 2, 3]),
        "",
        false,
        mockHighlightFn
      );
      const html = renderResult(result);
      // 元の連続スペースが保持されている
      expect(html).toContain("    ");
    });

    it("先頭のスペースを保持する", () => {
      const line = "  GET /api";
      const result = highlightColumnsWithSearch(
        line,
        " ",
        new Set([1]),
        "",
        false,
        mockHighlightFn
      );
      const html = renderResult(result);
      // 先頭のスペースが保持されている
      expect(html).toContain(">  <");
    });

    it("末尾のスペースを保持する", () => {
      const line = "GET /api  ";
      const result = highlightColumnsWithSearch(
        line,
        " ",
        new Set([1]),
        "",
        false,
        mockHighlightFn
      );
      const html = renderResult(result);
      // 末尾のスペースが保持されている
      expect(html).toContain(">  </span>");
    });

    it("カンマ区切りで動作する", () => {
      const result = highlightColumnsWithSearch(
        "name,age,city",
        ",",
        new Set([2]),
        "",
        false,
        mockHighlightFn
      );
      const html = renderResult(result);
      // 2列目（age）以外はグレー
      expect(html).toContain(">name<");
      expect(html).toContain(">age<");
      expect(html).toContain(">city<");
    });

    it("タブ区切りで動作する", () => {
      const result = highlightColumnsWithSearch(
        "col1\tcol2\tcol3",
        "\t",
        new Set([2]),
        "col2",
        false,
        mockHighlightFn
      );
      const html = renderResult(result);
      expect(html).toContain("<mark>col2</mark>");
    });

    it("すべての列がターゲットでない場合は全体がグレー", () => {
      const result = highlightColumnsWithSearch(
        "GET /api 200",
        " ",
        new Set([5]), // 存在しない列
        "",
        false,
        mockHighlightFn
      );
      const html = renderResult(result);
      // すべてグレー表示
      expect(html.match(/text-gray-400/g)?.length).toBeGreaterThanOrEqual(3);
    });

    it("ターゲット列が空のSetの場合はすべての列を表示", () => {
      const result = highlightColumnsWithSearch(
        "GET /api 200",
        " ",
        new Set<number>(), // 空 = 全列対象
        "api",
        false,
        mockHighlightFn
      );
      const html = renderResult(result);
      // すべての列が表示され、パターンがハイライト
      expect(html).toContain("<mark>api</mark>");
      expect(html).toContain("GET");
      expect(html).toContain("200");
    });

    it("正規表現パターンで動作する", () => {
      const result = highlightColumnsWithSearch(
        "GET /api/users/123 200",
        " ",
        new Set([2]),
        "\\d+",
        true,
        mockHighlightFn
      );
      const html = renderResult(result);
      // 数字がハイライトされる
      expect(html).toContain("<mark>123</mark>");
    });

    it("空の行を処理できる", () => {
      const result = highlightColumnsWithSearch(
        "",
        " ",
        new Set([1]),
        "",
        false,
        mockHighlightFn
      );
      expect(result).toEqual([]);
    });

    it("スペースのみの行を処理できる", () => {
      const result = highlightColumnsWithSearch(
        "   ",
        " ",
        new Set([1]),
        "",
        false,
        mockHighlightFn
      );
      const html = renderResult(result);
      // 末尾処理として空白が含まれる
      expect(html).toContain("   ");
    });

    it("複数列をターゲットにできる", () => {
      const result = highlightColumnsWithSearch(
        "GET /api 200 100ms",
        " ",
        new Set([1, 3]),
        "",
        false,
        mockHighlightFn
      );
      const html = renderResult(result);
      // 1列目と3列目は通常、2列目と4列目はグレー
      const grayMatches = html.match(/text-gray-400/g);
      expect(grayMatches).toBeTruthy();
    });
  });
});
