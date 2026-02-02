import {
  parseCSV,
  stringifyCSV,
  detectDelimiter,
  detectEncoding,
  isNumeric,
  detectColumnType,
  createEmptyCsvData,
  addRow,
  addColumn,
  removeRow,
  removeColumn,
  updateCell,
  type CsvData,
} from "../csv-parser";

describe("csv-parser", () => {
  describe("isNumeric", () => {
    it("数値として解釈可能な文字列に対してtrueを返す", () => {
      expect(isNumeric("123")).toBe(true);
      expect(isNumeric("123.45")).toBe(true);
      expect(isNumeric("-123")).toBe(true);
      expect(isNumeric("0")).toBe(true);
      expect(isNumeric("1e10")).toBe(true);
    });

    it("数値として解釈できない文字列に対してfalseを返す", () => {
      expect(isNumeric("abc")).toBe(false);
      expect(isNumeric("")).toBe(false);
      expect(isNumeric("  ")).toBe(false);
      expect(isNumeric("12abc")).toBe(false);
      expect(isNumeric("NaN")).toBe(false);
      expect(isNumeric("Infinity")).toBe(false);
    });
  });

  describe("detectColumnType", () => {
    it("全て数値の列に対してnumberを返す", () => {
      expect(detectColumnType(["1", "2", "3"])).toBe("number");
      expect(detectColumnType(["1.5", "2.5", "3.5"])).toBe("number");
    });

    it("文字列を含む列に対してstringを返す", () => {
      expect(detectColumnType(["1", "abc", "3"])).toBe("string");
      expect(detectColumnType(["foo", "bar", "baz"])).toBe("string");
    });

    it("空の配列に対してautoを返す", () => {
      expect(detectColumnType([])).toBe("auto");
      expect(detectColumnType(["", "  "])).toBe("auto");
    });
  });

  describe("detectDelimiter", () => {
    it("カンマ区切りを検出する", () => {
      expect(detectDelimiter("a,b,c\n1,2,3")).toBe(",");
    });

    it("タブ区切りを検出する", () => {
      expect(detectDelimiter("a\tb\tc\n1\t2\t3")).toBe("\t");
    });

    it("セミコロン区切りを検出する", () => {
      expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";");
    });

    it("パイプ区切りを検出する", () => {
      expect(detectDelimiter("a|b|c\n1|2|3")).toBe("|");
    });

    it("クォート内の区切り文字を無視する", () => {
      expect(detectDelimiter('"a,b",c,d\n1,2,3')).toBe(",");
    });

    it("エスケープされたクォートを正しく処理する", () => {
      expect(detectDelimiter('"a""b",c,d\n1,2,3')).toBe(",");
    });
  });

  describe("parseCSV", () => {
    it("基本的なCSVをパースする", () => {
      const csv = "a,b,c\n1,2,3\n4,5,6";
      const result = parseCSV(csv);

      expect(result.headers).toEqual(["a", "b", "c"]);
      expect(result.rows).toEqual([
        ["1", "2", "3"],
        ["4", "5", "6"],
      ]);
      expect(result.hasHeader).toBe(true);
    });

    it("ヘッダーなしでパースする", () => {
      const csv = "1,2,3\n4,5,6";
      const result = parseCSV(csv, { hasHeader: false });

      expect(result.headers).toEqual(["Column 1", "Column 2", "Column 3"]);
      expect(result.rows).toEqual([
        ["1", "2", "3"],
        ["4", "5", "6"],
      ]);
      expect(result.hasHeader).toBe(false);
    });

    it("クォートされたフィールドをパースする", () => {
      const csv = '"a,b",c,d\n1,2,3';
      const result = parseCSV(csv);

      expect(result.headers).toEqual(["a,b", "c", "d"]);
    });

    it("クォート内の改行を処理する", () => {
      const csv = '"a\nb",c\n1,2';
      const result = parseCSV(csv);

      expect(result.headers).toEqual(["a\nb", "c"]);
    });

    it("エスケープされたクォートを処理する", () => {
      const csv = '"a""b",c\n1,2';
      const result = parseCSV(csv);

      expect(result.headers).toEqual(['a"b', "c"]);
    });

    it("異なる区切り文字を使用する", () => {
      const csv = "a\tb\tc\n1\t2\t3";
      const result = parseCSV(csv, { delimiter: "\t" });

      expect(result.headers).toEqual(["a", "b", "c"]);
    });

    it("列のデータ型を自動検出する", () => {
      const csv = "name,age\nAlice,25\nBob,30";
      const result = parseCSV(csv);

      expect(result.columnTypes).toEqual(["string", "number"]);
    });

    it("カスタム列名プレフィックスを使用する", () => {
      const csv = "1,2,3\n4,5,6";
      const result = parseCSV(csv, { hasHeader: false, columnNamePrefix: "列" });

      expect(result.headers).toEqual(["列 1", "列 2", "列 3"]);
    });
  });

  describe("stringifyCSV", () => {
    it("基本的なCsvDataをCSV文字列に変換する", () => {
      const data: CsvData = {
        headers: ["a", "b", "c"],
        rows: [
          ["1", "2", "3"],
          ["4", "5", "6"],
        ],
        hasHeader: true,
        columnTypes: ["string", "string", "string"],
      };
      const result = stringifyCSV(data);

      expect(result).toBe("a,b,c\n1,2,3\n4,5,6");
    });

    it("ヘッダーなしで出力する", () => {
      const data: CsvData = {
        headers: ["a", "b", "c"],
        rows: [["1", "2", "3"]],
        hasHeader: true,
        columnTypes: ["string", "string", "string"],
      };
      const result = stringifyCSV(data, { hasHeader: false });

      expect(result).toBe("1,2,3");
    });

    it("区切り文字を含む値をクォートする", () => {
      const data: CsvData = {
        headers: ["a,b", "c"],
        rows: [["1", "2"]],
        hasHeader: true,
        columnTypes: ["string", "string"],
      };
      const result = stringifyCSV(data);

      expect(result).toBe('"a,b",c\n1,2');
    });

    it("ダブルクォートをエスケープする", () => {
      const data: CsvData = {
        headers: ['a"b', "c"],
        rows: [["1", "2"]],
        hasHeader: true,
        columnTypes: ["string", "string"],
      };
      const result = stringifyCSV(data);

      expect(result).toBe('"a""b",c\n1,2');
    });

    it("常にクォートするスタイルを使用する", () => {
      const data: CsvData = {
        headers: ["a", "b"],
        rows: [["1", "2"]],
        hasHeader: true,
        columnTypes: ["string", "string"],
      };
      const result = stringifyCSV(data, { quoteStyle: "always" });

      expect(result).toBe('"a","b"\n"1","2"');
    });

    it("数値型の列はクォートしない（as-neededの場合）", () => {
      const data: CsvData = {
        headers: ["name", "age"],
        rows: [["Alice", "25"]],
        hasHeader: true,
        columnTypes: ["string", "number"],
      };
      const result = stringifyCSV(data, { quoteStyle: "as-needed" });

      expect(result).toBe("name,age\nAlice,25");
    });
  });

  describe("detectEncoding", () => {
    it("UTF-8 BOMを検出する", () => {
      const buffer = new Uint8Array([0xef, 0xbb, 0xbf, 0x61, 0x62, 0x63]).buffer;
      expect(detectEncoding(buffer)).toBe("utf-8-bom");
    });

    it("通常のUTF-8を検出する", () => {
      const buffer = new Uint8Array([0x61, 0x62, 0x63]).buffer;
      expect(detectEncoding(buffer)).toBe("utf-8");
    });
  });

  describe("createEmptyCsvData", () => {
    it("指定されたサイズの空のCsvDataを作成する", () => {
      const result = createEmptyCsvData(3, 2);

      expect(result.headers).toHaveLength(3);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toHaveLength(3);
    });

    it("カスタム列名プレフィックスを使用する", () => {
      const result = createEmptyCsvData(2, 1, true, "列");

      expect(result.headers).toEqual(["列 1", "列 2"]);
    });
  });

  describe("addRow", () => {
    it("末尾に行を追加する", () => {
      const data: CsvData = {
        headers: ["a", "b"],
        rows: [["1", "2"]],
        hasHeader: true,
        columnTypes: ["string", "string"],
      };
      const result = addRow(data);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[1]).toEqual(["", ""]);
    });
  });

  describe("addColumn", () => {
    it("末尾に列を追加する", () => {
      const data: CsvData = {
        headers: ["a", "b"],
        rows: [["1", "2"]],
        hasHeader: true,
        columnTypes: ["string", "string"],
      };
      const result = addColumn(data);

      expect(result.headers).toHaveLength(3);
      expect(result.rows[0]).toHaveLength(3);
    });

    it("カスタム列名プレフィックスを使用する", () => {
      const data: CsvData = {
        headers: ["a"],
        rows: [["1"]],
        hasHeader: true,
        columnTypes: ["string"],
      };
      const result = addColumn(data, undefined, "auto", "列");

      expect(result.headers[1]).toBe("列 2");
    });
  });

  describe("removeRow", () => {
    it("指定された行を削除する", () => {
      const data: CsvData = {
        headers: ["a"],
        rows: [["1"], ["2"], ["3"]],
        hasHeader: true,
        columnTypes: ["string"],
      };
      const result = removeRow(data, 1);

      expect(result.rows).toEqual([["1"], ["3"]]);
    });

    it("範囲外のインデックスの場合は変更しない", () => {
      const data: CsvData = {
        headers: ["a"],
        rows: [["1"]],
        hasHeader: true,
        columnTypes: ["string"],
      };
      const result = removeRow(data, 5);

      expect(result).toBe(data);
    });
  });

  describe("removeColumn", () => {
    it("指定された列を削除する", () => {
      const data: CsvData = {
        headers: ["a", "b", "c"],
        rows: [["1", "2", "3"]],
        hasHeader: true,
        columnTypes: ["string", "string", "string"],
      };
      const result = removeColumn(data, 1);

      expect(result.headers).toEqual(["a", "c"]);
      expect(result.rows[0]).toEqual(["1", "3"]);
    });
  });

  describe("updateCell", () => {
    it("データセルを更新する", () => {
      const data: CsvData = {
        headers: ["a", "b"],
        rows: [["1", "2"]],
        hasHeader: true,
        columnTypes: ["string", "string"],
      };
      const result = updateCell(data, 0, 0, "updated");

      expect(result.rows[0][0]).toBe("updated");
    });

    it("ヘッダーセルを更新する（row === -1）", () => {
      const data: CsvData = {
        headers: ["a", "b"],
        rows: [["1", "2"]],
        hasHeader: true,
        columnTypes: ["string", "string"],
      };
      const result = updateCell(data, -1, 0, "updated");

      expect(result.headers[0]).toBe("updated");
    });

    it("範囲外の列インデックスの場合は変更しない", () => {
      const data: CsvData = {
        headers: ["a"],
        rows: [["1"]],
        hasHeader: true,
        columnTypes: ["string"],
      };
      const result = updateCell(data, 0, 5, "updated");

      expect(result).toBe(data);
    });
  });
});
