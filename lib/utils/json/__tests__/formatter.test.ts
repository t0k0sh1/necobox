import { formatJson, prettifyJson, minifyJson } from "../formatter";

describe("formatJson", () => {
  describe("prettify（整形）モード", () => {
    it("JSONを2スペースインデントで整形する", () => {
      const input = '{"name":"test","value":123}';
      const result = formatJson(input, { mode: "pretty", indent: 2 });

      expect(result.success).toBe(true);
      expect(result.output).toBe(`{
  "name": "test",
  "value": 123
}`);
    });

    it("JSONを4スペースインデントで整形する", () => {
      const input = '{"name":"test"}';
      const result = formatJson(input, { mode: "pretty", indent: 4 });

      expect(result.success).toBe(true);
      expect(result.output).toBe(`{
    "name": "test"
}`);
    });

    it("JSONをタブインデントで整形する", () => {
      const input = '{"name":"test"}';
      const result = formatJson(input, { mode: "pretty", indent: "tab" });

      expect(result.success).toBe(true);
      expect(result.output).toBe(`{
\t"name": "test"
}`);
    });

    it("デフォルトで2スペースインデントを使用する", () => {
      const input = '{"name":"test"}';
      const result = formatJson(input, { mode: "pretty" });

      expect(result.success).toBe(true);
      expect(result.output).toContain('  "name"');
    });

    it("配列を含むJSONを整形する", () => {
      const input = '{"items":[1,2,3]}';
      const result = formatJson(input, { mode: "pretty", indent: 2 });

      expect(result.success).toBe(true);
      expect(result.output).toBe(`{
  "items": [
    1,
    2,
    3
  ]
}`);
    });

    it("ネストされたオブジェクトを整形する", () => {
      const input = '{"outer":{"inner":{"value":1}}}';
      const result = formatJson(input, { mode: "pretty", indent: 2 });

      expect(result.success).toBe(true);
      expect(result.output).toBe(`{
  "outer": {
    "inner": {
      "value": 1
    }
  }
}`);
    });
  });

  describe("minify（圧縮）モード", () => {
    it("整形済みJSONを圧縮する", () => {
      const input = `{
  "name": "test",
  "value": 123
}`;
      const result = formatJson(input, { mode: "minify" });

      expect(result.success).toBe(true);
      expect(result.output).toBe('{"name":"test","value":123}');
    });

    it("既に圧縮されたJSONはそのまま", () => {
      const input = '{"name":"test"}';
      const result = formatJson(input, { mode: "minify" });

      expect(result.success).toBe(true);
      expect(result.output).toBe('{"name":"test"}');
    });

    it("配列を含むJSONを圧縮する", () => {
      const input = `{
  "items": [
    1,
    2,
    3
  ]
}`;
      const result = formatJson(input, { mode: "minify" });

      expect(result.success).toBe(true);
      expect(result.output).toBe('{"items":[1,2,3]}');
    });
  });

  describe("エラーハンドリング", () => {
    it("無効なJSONでエラーを返す", () => {
      const input = '{"name": }';
      const result = formatJson(input, { mode: "pretty" });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("空文字列でエラーを返す", () => {
      const result = formatJson("", { mode: "pretty" });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Empty input");
    });
  });
});

describe("prettifyJson", () => {
  it("JSONを整形する", () => {
    const result = prettifyJson('{"a":1}');
    expect(result.success).toBe(true);
    expect(result.output).toBe(`{
  "a": 1
}`);
  });

  it("インデントを指定できる", () => {
    const result = prettifyJson('{"a":1}', 4);
    expect(result.success).toBe(true);
    expect(result.output).toContain("    ");
  });

  it("タブインデントを使用できる", () => {
    const result = prettifyJson('{"a":1}', "tab");
    expect(result.success).toBe(true);
    expect(result.output).toContain("\t");
  });
});

describe("minifyJson", () => {
  it("JSONを圧縮する", () => {
    const input = `{
  "name": "test",
  "value": 123
}`;
    const result = minifyJson(input);

    expect(result.success).toBe(true);
    expect(result.output).toBe('{"name":"test","value":123}');
  });

  it("無効なJSONでエラーを返す", () => {
    const result = minifyJson("invalid");
    expect(result.success).toBe(false);
  });
});
