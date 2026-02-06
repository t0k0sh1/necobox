import {
  getCategoryColor,
  getDeadlineDisplay,
  getDeadlineBadgeClass,
  generateId,
  loadMatrixData,
  saveMatrixData,
  getPresetConfig,
  CELL_SIZE_PX,
  CARD_WIDTH_CELLS,
} from "../matrix-todo";

/** ローカル日付を YYYY-MM-DD 形式で返すヘルパー */
function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// LocalStorage モック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("matrix-todo", () => {
  describe("定数", () => {
    it("セルサイズとカード幅が正しい", () => {
      expect(CELL_SIZE_PX).toBe(16);
      expect(CARD_WIDTH_CELLS).toBe(10);
    });
  });

  describe("getCategoryColor", () => {
    it("同じカテゴリ名には同じ色を返す", () => {
      const color1 = getCategoryColor("開発");
      const color2 = getCategoryColor("開発");
      expect(color1).toBe(color2);
    });

    it("異なるカテゴリ名には異なる色を返す", () => {
      const color1 = getCategoryColor("開発");
      const color2 = getCategoryColor("デザイン");
      expect(color1).not.toBe(color2);
    });

    it("空文字列の場合はグレーを返す", () => {
      const color = getCategoryColor("");
      expect(color).toBe("hsl(0, 0%, 60%)");
    });

    it("HSL形式の色を返す", () => {
      const color = getCategoryColor("テスト");
      expect(color).toMatch(/^hsl\(\d+, 65%, 45%\)$/);
    });
  });

  describe("getDeadlineDisplay", () => {
    const translations = {
      noDeadline: "期限なし",
      overdue: "期限切れ",
      today: "今日",
      tomorrow: "明日",
      daysLater: (days: number) => `${days}日後`,
    };

    it("nullの場合は「期限なし」を返す", () => {
      expect(getDeadlineDisplay(null, translations)).toBe("期限なし");
    });

    it("今日の場合は「今日」を返す", () => {
      const today = new Date();
      const dateStr = toLocalDateString(today);
      expect(getDeadlineDisplay(dateStr, translations)).toBe("今日");
    });

    it("明日の場合は「明日」を返す", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = toLocalDateString(tomorrow);
      expect(getDeadlineDisplay(dateStr, translations)).toBe("明日");
    });

    it("数日後の場合は「N日後」を返す", () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      const dateStr = toLocalDateString(future);
      expect(getDeadlineDisplay(dateStr, translations)).toBe("5日後");
    });

    it("過去の日付の場合は「期限切れ」を返す", () => {
      const past = new Date();
      past.setDate(past.getDate() - 3);
      const dateStr = toLocalDateString(past);
      expect(getDeadlineDisplay(dateStr, translations)).toBe("期限切れ");
    });
  });

  describe("getDeadlineBadgeClass", () => {
    it("nullの場合はグレーのクラスを返す", () => {
      const cls = getDeadlineBadgeClass(null);
      expect(cls).toContain("bg-gray-200");
    });

    it("期限切れの場合は赤のクラスを返す", () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      const cls = getDeadlineBadgeClass(toLocalDateString(past));
      expect(cls).toContain("bg-red-100");
    });

    it("今日が期限の場合はオレンジのクラスを返す", () => {
      const today = new Date();
      const cls = getDeadlineBadgeClass(toLocalDateString(today));
      expect(cls).toContain("bg-orange-100");
    });

    it("十分先の期限の場合は青のクラスを返す", () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);
      const cls = getDeadlineBadgeClass(toLocalDateString(future));
      expect(cls).toContain("bg-blue-100");
    });
  });

  describe("generateId", () => {
    it("一意なIDを生成する", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it("文字列を返す", () => {
      const id = generateId();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe("loadMatrixData / saveMatrixData", () => {
    beforeEach(() => {
      localStorageMock.clear();
    });

    it("データが保存されていない場合はnullを返す", () => {
      expect(loadMatrixData()).toBeNull();
    });

    it("保存したデータを読み込める", () => {
      const data = {
        tasks: [
          {
            id: "1",
            title: "テスト",
            description: null,
            category: "開発",
            deadline: null,
            gridX: 10,
            gridY: 20,
            createdAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        config: {
          preset: "eisenhower" as const,
          xAxisLabel: "緊急度",
          yAxisLabel: "重要度",
          quadrantNames: {
            topLeft: "計画する",
            topRight: "今すぐやる",
            bottomLeft: "やらない",
            bottomRight: "委任する",
          },
        },
      };

      saveMatrixData(data);
      const loaded = loadMatrixData();
      expect(loaded).toEqual(data);
    });

    it("descriptionを含むタスクを保存・読み込みできる", () => {
      const data = {
        tasks: [
          {
            id: "1",
            title: "テスト",
            description: "これはテスト用の説明です",
            category: "開発",
            deadline: null,
            gridX: 10,
            gridY: 20,
            createdAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        config: {
          preset: "eisenhower" as const,
          xAxisLabel: "緊急度",
          yAxisLabel: "重要度",
          quadrantNames: {
            topLeft: "計画する",
            topRight: "今すぐやる",
            bottomLeft: "やらない",
            bottomRight: "委任する",
          },
        },
      };

      saveMatrixData(data);
      const loaded = loadMatrixData();
      expect(loaded).toEqual(data);
      expect(loaded?.tasks[0].description).toBe("これはテスト用の説明です");
    });

    it("descriptionがnullのタスクを保存・読み込みできる", () => {
      const data = {
        tasks: [
          {
            id: "1",
            title: "テスト",
            description: null,
            category: "開発",
            deadline: null,
            gridX: 10,
            gridY: 20,
            createdAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        config: {
          preset: "eisenhower" as const,
          xAxisLabel: "緊急度",
          yAxisLabel: "重要度",
          quadrantNames: {
            topLeft: "計画する",
            topRight: "今すぐやる",
            bottomLeft: "やらない",
            bottomRight: "委任する",
          },
        },
      };

      saveMatrixData(data);
      const loaded = loadMatrixData();
      expect(loaded?.tasks[0].description).toBeNull();
    });

    it("taskOrderを含むデータを保存・読み込みできる", () => {
      const data = {
        tasks: [
          {
            id: "a",
            title: "タスクA",
            description: null,
            category: "開発",
            deadline: null,
            gridX: 0,
            gridY: 0,
            createdAt: "2025-01-01T00:00:00.000Z",
          },
          {
            id: "b",
            title: "タスクB",
            description: null,
            category: "デザイン",
            deadline: null,
            gridX: 5,
            gridY: 5,
            createdAt: "2025-01-02T00:00:00.000Z",
          },
        ],
        config: {
          preset: "eisenhower" as const,
          xAxisLabel: "緊急度",
          yAxisLabel: "重要度",
          quadrantNames: {
            topLeft: "計画する",
            topRight: "今すぐやる",
            bottomLeft: "やらない",
            bottomRight: "委任する",
          },
        },
        taskOrder: ["b", "a"],
      };

      saveMatrixData(data);
      const loaded = loadMatrixData();
      expect(loaded).toEqual(data);
      expect(loaded?.taskOrder).toEqual(["b", "a"]);
    });

    it("taskOrderが未定義のデータも読み込める（後方互換性）", () => {
      const data = {
        tasks: [
          {
            id: "1",
            title: "テスト",
            category: "",
            deadline: null,
            gridX: 0,
            gridY: 0,
            createdAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        config: {
          preset: "eisenhower" as const,
          xAxisLabel: "緊急度",
          yAxisLabel: "重要度",
          quadrantNames: {
            topLeft: "計画する",
            topRight: "今すぐやる",
            bottomLeft: "やらない",
            bottomRight: "委任する",
          },
        },
      };

      saveMatrixData(data);
      const loaded = loadMatrixData();
      expect(loaded).not.toBeNull();
      expect(loaded?.taskOrder).toBeUndefined();
    });

    it("不正なJSONの場合はnullを返す", () => {
      localStorageMock.setItem("necobox-matrix-todo", "invalid json");
      expect(loadMatrixData()).toBeNull();
    });
  });

  describe("getPresetConfig", () => {
    const translations = {
      eisenhower: {
        xAxis: "緊急度",
        yAxis: "重要度",
        topLeft: "計画する",
        topRight: "今すぐやる",
        bottomLeft: "やらない",
        bottomRight: "委任する",
      },
      effectDifficulty: {
        xAxis: "難易度",
        yAxis: "効果",
        topLeft: "最優先",
        topRight: "計画的に",
        bottomLeft: "後回し",
        bottomRight: "再検討",
      },
      importanceUrgency: {
        xAxis: "緊急度",
        yAxis: "重要度",
        topLeft: "計画する",
        topRight: "最優先",
        bottomLeft: "後回し",
        bottomRight: "委任する",
      },
      importanceDifficulty: {
        xAxis: "難易度",
        yAxis: "重要度",
        topLeft: "すぐやる",
        topRight: "計画的に",
        bottomLeft: "暇な時に",
        bottomRight: "やらない",
      },
      axis: {
        xAxis: "横軸",
        yAxis: "縦軸",
      },
      quadrant: {
        topLeft: "左上",
        topRight: "右上",
        bottomLeft: "左下",
        bottomRight: "右下",
      },
    };

    it("アイゼンハワーのプリセットを返す", () => {
      const config = getPresetConfig("eisenhower", translations);
      expect(config.preset).toBe("eisenhower");
      expect(config.xAxisLabel).toBe("緊急度");
      expect(config.yAxisLabel).toBe("重要度");
      expect(config.quadrantNames.topRight).toBe("今すぐやる");
    });

    it("効果×難易度のプリセットを返す", () => {
      const config = getPresetConfig("effectDifficulty", translations);
      expect(config.preset).toBe("effectDifficulty");
      expect(config.xAxisLabel).toBe("難易度");
      expect(config.yAxisLabel).toBe("効果");
    });

    it("重要度×緊急度のプリセットを返す", () => {
      const config = getPresetConfig("importanceUrgency", translations);
      expect(config.preset).toBe("importanceUrgency");
      expect(config.xAxisLabel).toBe("緊急度");
      expect(config.yAxisLabel).toBe("重要度");
      expect(config.quadrantNames.topRight).toBe("最優先");
    });

    it("重要度×難易度のプリセットを返す", () => {
      const config = getPresetConfig("importanceDifficulty", translations);
      expect(config.preset).toBe("importanceDifficulty");
      expect(config.xAxisLabel).toBe("難易度");
      expect(config.yAxisLabel).toBe("重要度");
      expect(config.quadrantNames.topLeft).toBe("すぐやる");
    });

    it("カスタムのプリセットを返す", () => {
      const config = getPresetConfig("custom", translations);
      expect(config.preset).toBe("custom");
      expect(config.xAxisLabel).toBe("横軸");
      expect(config.yAxisLabel).toBe("縦軸");
    });
  });
});
