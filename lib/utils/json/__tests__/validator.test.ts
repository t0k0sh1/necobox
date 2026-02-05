import { validateJson } from "../validator";

describe("validateJson", () => {
  describe("有効なJSON", () => {
    it("空のオブジェクトを有効と判定する", () => {
      const result = validateJson("{}");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("空の配列を有効と判定する", () => {
      const result = validateJson("[]");
      expect(result.valid).toBe(true);
    });

    it("プリミティブ値を有効と判定する", () => {
      expect(validateJson("123").valid).toBe(true);
      expect(validateJson('"hello"').valid).toBe(true);
      expect(validateJson("true").valid).toBe(true);
      expect(validateJson("false").valid).toBe(true);
      expect(validateJson("null").valid).toBe(true);
    });

    it("ネストされたオブジェクトを有効と判定する", () => {
      const json = '{"name": "test", "nested": {"value": 123}}';
      const result = validateJson(json);
      expect(result.valid).toBe(true);
    });

    it("配列を含むオブジェクトを有効と判定する", () => {
      const json = '{"items": [1, 2, 3], "name": "test"}';
      const result = validateJson(json);
      expect(result.valid).toBe(true);
    });

    it("複雑なJSONを有効と判定する", () => {
      const json = JSON.stringify({
        users: [
          { id: 1, name: "Alice", active: true },
          { id: 2, name: "Bob", active: false },
        ],
        metadata: {
          total: 2,
          page: 1,
        },
      });
      const result = validateJson(json);
      expect(result.valid).toBe(true);
    });

    it("整形済みJSONを有効と判定する", () => {
      const json = `{
  "name": "test",
  "value": 123
}`;
      const result = validateJson(json);
      expect(result.valid).toBe(true);
    });
  });

  describe("無効なJSON", () => {
    it("空文字列を無効と判定する", () => {
      const result = validateJson("");
      expect(result.valid).toBe(false);
      expect(result.error?.message).toBe("Empty input");
    });

    it("空白のみを無効と判定する", () => {
      const result = validateJson("   ");
      expect(result.valid).toBe(false);
      expect(result.error?.message).toBe("Empty input");
    });

    it("末尾カンマを無効と判定する", () => {
      const json = '{"name": "test",}';
      const result = validateJson(json);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("シングルクォートを無効と判定する", () => {
      const json = "{'name': 'test'}";
      const result = validateJson(json);
      expect(result.valid).toBe(false);
    });

    it("コメントを無効と判定する", () => {
      const json = '{"name": "test" /* comment */}';
      const result = validateJson(json);
      expect(result.valid).toBe(false);
    });

    it("閉じ括弧がないJSONを無効と判定する", () => {
      const json = '{"name": "test"';
      const result = validateJson(json);
      expect(result.valid).toBe(false);
    });

    it("プレーンテキストを無効と判定する", () => {
      const result = validateJson("hello world");
      expect(result.valid).toBe(false);
    });

    it("不完全な配列を無効と判定する", () => {
      const json = "[1, 2,";
      const result = validateJson(json);
      expect(result.valid).toBe(false);
    });
  });

  describe("エラー位置の取得", () => {
    it("エラーメッセージを返す", () => {
      const json = '{"name": }';
      const result = validateJson(json);
      expect(result.valid).toBe(false);
      expect(result.error?.message).toBeDefined();
      expect(result.error?.message).not.toBe("");
    });

    it("複数行JSONのエラーでも動作する", () => {
      const json = `{
  "name": "test",
  "value":
}`;
      const result = validateJson(json);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("重複キーの検出", () => {
    it("重複キーがある場合に警告を返す", () => {
      const json = '{"name": "test", "name": "test2"}';
      const result = validateJson(json);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings?.[0].message).toContain("Duplicate key");
      expect(result.warnings?.[0].message).toContain("name");
    });

    it("重複キーがない場合は警告なし", () => {
      const json = '{"name": "test", "value": 123}';
      const result = validateJson(json);
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeUndefined();
    });

    it("ネストしたオブジェクトで各レベルの重複を検出", () => {
      const json = '{"a": 1, "nested": {"b": 2, "b": 3}, "a": 4}';
      const result = validateJson(json);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(2);
    });

    it("異なるオブジェクトの同名キーは重複としない", () => {
      const json = '{"obj1": {"name": "a"}, "obj2": {"name": "b"}}';
      const result = validateJson(json);
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeUndefined();
    });

    it("配列内のオブジェクトの同名キーは重複としない", () => {
      const json = '[{"name": "a"}, {"name": "b"}]';
      const result = validateJson(json);
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeUndefined();
    });

    it("配列内オブジェクトの重複キーを検出", () => {
      const json = '[{"name": "a", "name": "b"}]';
      const result = validateJson(json);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
    });

    it("複数の重複キーを全て検出", () => {
      const json = '{"a": 1, "b": 2, "a": 3, "b": 4, "c": 5}';
      const result = validateJson(json);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(2);
    });

    it("エスケープされた文字を含むキーの重複を検出", () => {
      const json = '{"na\\"me": 1, "na\\"me": 2}';
      const result = validateJson(json);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
    });

    it("重複キーの行番号を返す", () => {
      const json = `{
  "name": "first",
  "name": "second"
}`;
      const result = validateJson(json);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings?.[0].line).toBe(3);
    });
  });
});
