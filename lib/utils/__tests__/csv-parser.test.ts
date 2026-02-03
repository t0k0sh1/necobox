import {
  parseCSV,
  stringifyCSV,
  detectDelimiter,
  detectEncoding,
  encodeWithEncoding,
  isNumeric,
  detectColumnType,
  createEmptyCsvData,
  addRow,
  addColumn,
  removeRow,
  removeColumn,
  updateCell,
  updateCells,
  normalizeSelection,
  isCellInSelection,
  quoteFieldForClipboard,
  parseClipboardText,
  type CsvData,
  type SelectionRange,
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

  describe("encodeWithEncoding", () => {
    it("UTF-8でエンコードする", () => {
      const result = encodeWithEncoding("abc", "utf-8");
      expect(result).toEqual(new Uint8Array([0x61, 0x62, 0x63]));
    });

    it("UTF-8でエンコードする（日本語）", () => {
      const result = encodeWithEncoding("あ", "utf-8");
      // "あ" in UTF-8: 0xE3 0x81 0x82
      expect(result).toEqual(new Uint8Array([0xe3, 0x81, 0x82]));
    });

    it("UTF-8 BOMでエンコードする", () => {
      const result = encodeWithEncoding("abc", "utf-8-bom");
      // BOM (0xEF 0xBB 0xBF) + "abc"
      expect(result).toEqual(new Uint8Array([0xef, 0xbb, 0xbf, 0x61, 0x62, 0x63]));
    });

    it("Shift_JISでエンコードする", () => {
      const result = encodeWithEncoding("あ", "shift_jis");
      // "あ" in Shift_JIS: 0x82 0xA0
      expect(result).toEqual(new Uint8Array([0x82, 0xa0]));
    });

    it("Shift_JISでエンコードする（複数文字）", () => {
      const result = encodeWithEncoding("あいう", "shift_jis");
      // "あいう" in Shift_JIS: 0x82 0xA0 0x82 0xA2 0x82 0xA4
      expect(result).toEqual(new Uint8Array([0x82, 0xa0, 0x82, 0xa2, 0x82, 0xa4]));
    });

    it("EUC-JPでエンコードする", () => {
      const result = encodeWithEncoding("あ", "euc-jp");
      // "あ" in EUC-JP: 0xA4 0xA2
      expect(result).toEqual(new Uint8Array([0xa4, 0xa2]));
    });

    it("EUC-JPでエンコードする（複数文字）", () => {
      const result = encodeWithEncoding("あいう", "euc-jp");
      // "あいう" in EUC-JP: 0xA4 0xA2 0xA4 0xA4 0xA4 0xA6
      expect(result).toEqual(new Uint8Array([0xa4, 0xa2, 0xa4, 0xa4, 0xa4, 0xa6]));
    });

    it("ASCII文字をShift_JISでエンコードする", () => {
      const result = encodeWithEncoding("abc", "shift_jis");
      // ASCII is same in Shift_JIS
      expect(result).toEqual(new Uint8Array([0x61, 0x62, 0x63]));
    });

    it("ASCII文字をEUC-JPでエンコードする", () => {
      const result = encodeWithEncoding("abc", "euc-jp");
      // ASCII is same in EUC-JP
      expect(result).toEqual(new Uint8Array([0x61, 0x62, 0x63]));
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

  describe("normalizeSelection", () => {
    it("startが左上、endが右下になるように正規化する", () => {
      const selection: SelectionRange = {
        start: { row: 2, col: 3 },
        end: { row: 0, col: 1 },
      };
      const result = normalizeSelection(selection);

      expect(result.start).toEqual({ row: 0, col: 1 });
      expect(result.end).toEqual({ row: 2, col: 3 });
    });

    it("すでに正規化されている場合はそのまま返す", () => {
      const selection: SelectionRange = {
        start: { row: 0, col: 0 },
        end: { row: 2, col: 2 },
      };
      const result = normalizeSelection(selection);

      expect(result.start).toEqual({ row: 0, col: 0 });
      expect(result.end).toEqual({ row: 2, col: 2 });
    });

    it("単一セル選択を正しく処理する", () => {
      const selection: SelectionRange = {
        start: { row: 1, col: 1 },
        end: { row: 1, col: 1 },
      };
      const result = normalizeSelection(selection);

      expect(result.start).toEqual({ row: 1, col: 1 });
      expect(result.end).toEqual({ row: 1, col: 1 });
    });
  });

  describe("isCellInSelection", () => {
    it("選択範囲内のセルに対してtrueを返す", () => {
      const selection: SelectionRange = {
        start: { row: 0, col: 0 },
        end: { row: 2, col: 2 },
      };

      expect(isCellInSelection(0, 0, selection)).toBe(true);
      expect(isCellInSelection(1, 1, selection)).toBe(true);
      expect(isCellInSelection(2, 2, selection)).toBe(true);
      expect(isCellInSelection(0, 2, selection)).toBe(true);
      expect(isCellInSelection(2, 0, selection)).toBe(true);
    });

    it("選択範囲外のセルに対してfalseを返す", () => {
      const selection: SelectionRange = {
        start: { row: 0, col: 0 },
        end: { row: 2, col: 2 },
      };

      expect(isCellInSelection(3, 0, selection)).toBe(false);
      expect(isCellInSelection(0, 3, selection)).toBe(false);
      expect(isCellInSelection(-1, 0, selection)).toBe(false);
    });

    it("正規化されていない選択範囲でも正しく判定する", () => {
      const selection: SelectionRange = {
        start: { row: 2, col: 2 },
        end: { row: 0, col: 0 },
      };

      expect(isCellInSelection(1, 1, selection)).toBe(true);
      expect(isCellInSelection(3, 3, selection)).toBe(false);
    });

    it("nullの場合はfalseを返す", () => {
      expect(isCellInSelection(0, 0, null)).toBe(false);
    });
  });

  describe("updateCells", () => {
    it("複数のセルを一括で更新する", () => {
      const data: CsvData = {
        headers: ["a", "b", "c"],
        rows: [
          ["1", "2", "3"],
          ["4", "5", "6"],
        ],
        hasHeader: true,
        columnTypes: ["string", "string", "string"],
      };
      const updates = [
        { row: 0, col: 0, value: "A" },
        { row: 0, col: 1, value: "B" },
        { row: 1, col: 2, value: "C" },
      ];

      const result = updateCells(data, updates);

      expect(result.rows[0][0]).toBe("A");
      expect(result.rows[0][1]).toBe("B");
      expect(result.rows[0][2]).toBe("3"); // 変更なし
      expect(result.rows[1][0]).toBe("4"); // 変更なし
      expect(result.rows[1][2]).toBe("C");
    });

    it("空の更新配列の場合は元のデータを返す", () => {
      const data: CsvData = {
        headers: ["a"],
        rows: [["1"]],
        hasHeader: true,
        columnTypes: ["string"],
      };

      const result = updateCells(data, []);

      expect(result.rows[0][0]).toBe("1");
    });

    it("ヘッダーセルも更新できる", () => {
      const data: CsvData = {
        headers: ["a", "b"],
        rows: [["1", "2"]],
        hasHeader: true,
        columnTypes: ["string", "string"],
      };
      const updates = [
        { row: -1, col: 0, value: "Header A" },
        { row: 0, col: 1, value: "Data B" },
      ];

      const result = updateCells(data, updates);

      expect(result.headers[0]).toBe("Header A");
      expect(result.rows[0][1]).toBe("Data B");
    });
  });

  describe("quoteFieldForClipboard", () => {
    it("通常の文字列はそのまま返す", () => {
      expect(quoteFieldForClipboard("hello")).toBe("hello");
      expect(quoteFieldForClipboard("123")).toBe("123");
      expect(quoteFieldForClipboard("")).toBe("");
    });

    it("タブを含む文字列をダブルクォートで囲む", () => {
      expect(quoteFieldForClipboard("a\tb")).toBe('"a\tb"');
    });

    it("改行を含む文字列をダブルクォートで囲む", () => {
      expect(quoteFieldForClipboard("a\nb")).toBe('"a\nb"');
      expect(quoteFieldForClipboard("line1\nline2\nline3")).toBe('"line1\nline2\nline3"');
    });

    it("ダブルクォートを含む文字列をエスケープして囲む", () => {
      expect(quoteFieldForClipboard('a"b')).toBe('"a""b"');
      expect(quoteFieldForClipboard('"quoted"')).toBe('"""quoted"""');
    });

    it("複合ケース: タブ、改行、ダブルクォートを含む", () => {
      expect(quoteFieldForClipboard('a\t"b"\nc')).toBe('"a\t""b""\nc"');
    });
  });

  describe("parseClipboardText", () => {
    it("シンプルなTSVをパースする", () => {
      const text = "a\tb\nc\td";
      const result = parseClipboardText(text, 0, 0, 10, 10);
      expect(result).toEqual([
        { row: 0, col: 0, value: "a" },
        { row: 0, col: 1, value: "b" },
        { row: 1, col: 0, value: "c" },
        { row: 1, col: 1, value: "d" },
      ]);
    });

    it("ダブルクォートで囲まれた改行を含むフィールドをパースする", () => {
      const text = '"line1\nline2"\tother';
      const result = parseClipboardText(text, 0, 0, 10, 10);
      expect(result).toEqual([
        { row: 0, col: 0, value: "line1\nline2" },
        { row: 0, col: 1, value: "other" },
      ]);
    });

    it("エスケープされたダブルクォートをパースする", () => {
      const text = '"a""b"';
      const result = parseClipboardText(text, 0, 0, 10, 10);
      expect(result).toEqual([
        { row: 0, col: 0, value: 'a"b' },
      ]);
    });

    it("クォートされていないフィールド内のダブルクォートをリテラルとして扱う", () => {
      const text = 'a"b\tc';
      const result = parseClipboardText(text, 0, 0, 10, 10);
      expect(result).toEqual([
        { row: 0, col: 0, value: 'a"b' },
        { row: 0, col: 1, value: "c" },
      ]);
    });

    it("開始位置を指定してパースする", () => {
      const text = "a\tb";
      const result = parseClipboardText(text, 2, 1, 10, 10);
      expect(result).toEqual([
        { row: 2, col: 1, value: "a" },
        { row: 2, col: 2, value: "b" },
      ]);
    });

    it("最大行数・列数を超えるデータは無視する", () => {
      const text = "a\tb\tc\nd\te\tf";
      const result = parseClipboardText(text, 0, 0, 1, 2);
      expect(result).toEqual([
        { row: 0, col: 0, value: "a" },
        { row: 0, col: 1, value: "b" },
      ]);
    });

    it("ラウンドトリップ: quoteFieldForClipboard でクォートした値を正しくパースする", () => {
      const originalValues = [
        ["simple", "with\ttab"],
        ["with\nnewline", 'with"quote'],
      ];

      // クォートしてTSVを作成
      const tsvLines = originalValues.map(row =>
        row.map(quoteFieldForClipboard).join("\t")
      );
      const tsv = tsvLines.join("\n");

      // パースして元の値が復元されることを確認
      const result = parseClipboardText(tsv, 0, 0, 10, 10);
      expect(result).toEqual([
        { row: 0, col: 0, value: "simple" },
        { row: 0, col: 1, value: "with\ttab" },
        { row: 1, col: 0, value: "with\nnewline" },
        { row: 1, col: 1, value: 'with"quote' },
      ]);
    });
  });
});
