import {
  computeDiff,
  computeWordDiff,
  formatUnifiedDiff,
} from "../diff-viewer";

describe("diff-viewer", () => {
  describe("computeDiff", () => {
    it("同一テキストの差分は全てunchanged", () => {
      const result = computeDiff("hello\nworld\n", "hello\nworld\n");
      expect(result.stats.addedLines).toBe(0);
      expect(result.stats.removedLines).toBe(0);
      expect(result.stats.unchangedLines).toBeGreaterThan(0);
      expect(result.lines.every((l) => l.type === "unchanged")).toBe(true);
    });

    it("追加行を正しく検出する", () => {
      const result = computeDiff("line1\n", "line1\nline2\n");
      expect(result.stats.addedLines).toBe(1);
      const addedLines = result.lines.filter((l) => l.type === "added");
      expect(addedLines.length).toBe(1);
      expect(addedLines[0].content).toBe("line2");
    });

    it("削除行を正しく検出する", () => {
      const result = computeDiff("line1\nline2\n", "line1\n");
      expect(result.stats.removedLines).toBe(1);
      const removedLines = result.lines.filter((l) => l.type === "removed");
      expect(removedLines.length).toBe(1);
      expect(removedLines[0].content).toBe("line2");
    });

    it("変更行を正しく検出する", () => {
      const result = computeDiff("hello world\n", "hello earth\n");
      expect(result.stats.addedLines).toBe(1);
      expect(result.stats.removedLines).toBe(1);
    });

    it("空テキスト同士は差分なし", () => {
      const result = computeDiff("", "");
      expect(result.stats.addedLines).toBe(0);
      expect(result.stats.removedLines).toBe(0);
    });

    it("行番号が正しく割り当てられる", () => {
      const result = computeDiff("a\nb\nc\n", "a\nx\nc\n");
      const unchangedA = result.lines.find(
        (l) => l.type === "unchanged" && l.content === "a"
      );
      expect(unchangedA?.lineNumberBefore).toBe(1);
      expect(unchangedA?.lineNumberAfter).toBe(1);
    });

    it("隣接するremoved/addedに単語レベル差分が付与される", () => {
      const result = computeDiff("hello world\n", "hello earth\n");
      const removedLine = result.lines.find((l) => l.type === "removed");
      const addedLine = result.lines.find((l) => l.type === "added");
      expect(removedLine?.wordDiffs).toBeDefined();
      expect(addedLine?.wordDiffs).toBeDefined();
    });
  });

  describe("computeWordDiff", () => {
    it("単語レベルの差分を計算する", () => {
      const diffs = computeWordDiff("hello world", "hello earth");
      expect(diffs.length).toBeGreaterThan(0);
      expect(diffs.some((d) => d.type === "removed")).toBe(true);
      expect(diffs.some((d) => d.type === "added")).toBe(true);
      expect(diffs.some((d) => d.type === "unchanged")).toBe(true);
    });

    it("同一テキストの差分は全てunchanged", () => {
      const diffs = computeWordDiff("hello", "hello");
      expect(diffs.every((d) => d.type === "unchanged")).toBe(true);
    });
  });

  describe("formatUnifiedDiff", () => {
    it("変更がある場合に@@ヘッダーを含む", () => {
      const result = computeDiff("a\nb\nc\n", "a\nx\nc\n");
      const unified = formatUnifiedDiff(result);
      expect(unified).toContain("@@");
    });

    it("追加行に+プレフィックスが付く", () => {
      const result = computeDiff("a\n", "a\nb\n");
      const unified = formatUnifiedDiff(result);
      expect(unified).toContain("+b");
    });

    it("削除行に-プレフィックスが付く", () => {
      const result = computeDiff("a\nb\n", "a\n");
      const unified = formatUnifiedDiff(result);
      expect(unified).toContain("-b");
    });

    it("同一テキストの場合は空文字列を返す", () => {
      const result = computeDiff("hello\n", "hello\n");
      const unified = formatUnifiedDiff(result);
      expect(unified).toBe("");
    });
  });
});
