import {
  urlEncode,
  urlDecode,
  parseQueryParams,
  buildQueryString,
} from "../url-encoder";

describe("urlEncode", () => {
  it("encodeURIComponent モードで特殊文字をエンコードする", () => {
    expect(urlEncode("hello world", "component")).toBe("hello%20world");
    expect(urlEncode("foo=bar&baz=qux", "component")).toBe(
      "foo%3Dbar%26baz%3Dqux"
    );
  });

  it("encodeURI モードでURL構造文字を保持する", () => {
    expect(urlEncode("https://example.com/path?q=hello world", "uri")).toBe(
      "https://example.com/path?q=hello%20world"
    );
  });

  it("日本語文字列をエンコードする", () => {
    const encoded = urlEncode("こんにちは", "component");
    expect(encoded).toContain("%");
    expect(decodeURIComponent(encoded)).toBe("こんにちは");
  });

  it("空文字列を処理する", () => {
    expect(urlEncode("", "component")).toBe("");
    expect(urlEncode("", "uri")).toBe("");
  });
});

describe("urlDecode", () => {
  it("エンコード済み文字列をデコードする", () => {
    expect(urlDecode("hello%20world")).toEqual({
      result: "hello world",
      error: null,
    });
  });

  it("日本語エンコードをデコードする", () => {
    const encoded = encodeURIComponent("こんにちは");
    expect(urlDecode(encoded)).toEqual({
      result: "こんにちは",
      error: null,
    });
  });

  it("不正な%エンコードでエラーを返す", () => {
    const result = urlDecode("%ZZ");
    expect(result.error).not.toBeNull();
    expect(result.result).toBe("");
  });

  it("既にデコード済みのテキストを処理する", () => {
    expect(urlDecode("hello")).toEqual({
      result: "hello",
      error: null,
    });
  });
});

describe("parseQueryParams", () => {
  it("URLからクエリパラメータを解析する", () => {
    const params = parseQueryParams("https://example.com?foo=bar&baz=qux");
    expect(params).toEqual([
      { key: "foo", value: "bar" },
      { key: "baz", value: "qux" },
    ]);
  });

  it("値なしのパラメータを処理する", () => {
    const params = parseQueryParams("?key");
    expect(params).toEqual([{ key: "key", value: "" }]);
  });

  it("空のクエリ文字列を処理する", () => {
    expect(parseQueryParams("")).toEqual([]);
    expect(parseQueryParams("?")).toEqual([]);
  });

  it("フラグメントを除去する", () => {
    const params = parseQueryParams("?foo=bar#section");
    expect(params).toEqual([{ key: "foo", value: "bar" }]);
  });

  it("エンコード済みのキーと値をデコードする", () => {
    const params = parseQueryParams("?%E3%82%AD%E3%83%BC=%E5%80%A4");
    expect(params).toEqual([{ key: "キー", value: "値" }]);
  });
});

describe("buildQueryString", () => {
  it("パラメータからクエリ文字列を構築する", () => {
    const result = buildQueryString([
      { key: "foo", value: "bar" },
      { key: "baz", value: "qux" },
    ]);
    expect(result).toBe("foo=bar&baz=qux");
  });

  it("特殊文字をエンコードする", () => {
    const result = buildQueryString([{ key: "q", value: "hello world" }]);
    expect(result).toBe("q=hello%20world");
  });

  it("空配列で空文字列を返す", () => {
    expect(buildQueryString([])).toBe("");
  });

  it("空のキーを除外する", () => {
    const result = buildQueryString([
      { key: "", value: "bar" },
      { key: "foo", value: "baz" },
    ]);
    expect(result).toBe("foo=baz");
  });
});
