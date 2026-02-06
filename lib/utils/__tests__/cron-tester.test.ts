import {
  parseCron,
  parseAwsCron,
  validateCron,
  getNextExecutions,
  describeCron,
  CRON_PRESETS,
  AWS_CRON_PRESETS,
} from "../cron-tester";

describe("parseCron", () => {
  it("有効な式をパースする", () => {
    const result = parseCron("0 9 * * 1");
    expect(result).toEqual({
      minute: "0",
      hour: "9",
      dayOfMonth: "*",
      month: "*",
      dayOfWeek: "1",
    });
  });

  it("5フィールド以外はnullを返す", () => {
    expect(parseCron("* * *")).toBeNull();
    expect(parseCron("* * * * * *")).toBeNull();
  });

  it("すべてワイルドカードの式をパースする", () => {
    const result = parseCron("* * * * *");
    expect(result).toEqual({
      minute: "*",
      hour: "*",
      dayOfMonth: "*",
      month: "*",
      dayOfWeek: "*",
    });
  });
});

describe("parseAwsCron", () => {
  it("有効な6フィールド式をパースする", () => {
    const result = parseAwsCron("0 9 ? * MON *");
    expect(result).toEqual({
      minute: "0",
      hour: "9",
      dayOfMonth: "?",
      month: "*",
      dayOfWeek: "MON",
      year: "*",
    });
  });

  it("6フィールド以外はnullを返す", () => {
    expect(parseAwsCron("* * * * *")).toBeNull();
    expect(parseAwsCron("* * * * * * *")).toBeNull();
  });

  it("年フィールドを含む式をパースする", () => {
    const result = parseAwsCron("0 0 1 * ? 2024");
    expect(result).toEqual({
      minute: "0",
      hour: "0",
      dayOfMonth: "1",
      month: "*",
      dayOfWeek: "?",
      year: "2024",
    });
  });
});

describe("validateCron", () => {
  it("有効な式をvalidとする", () => {
    expect(validateCron("* * * * *").valid).toBe(true);
    expect(validateCron("0 9 * * 1-5").valid).toBe(true);
    expect(validateCron("*/15 * * * *").valid).toBe(true);
  });

  it("無効な式をinvalidとする", () => {
    expect(validateCron("60 * * * *").valid).toBe(false);
    expect(validateCron("invalid").valid).toBe(false);
  });

  it("プリセットの式がすべて有効", () => {
    CRON_PRESETS.forEach((preset) => {
      expect(validateCron(preset.expression).valid).toBe(true);
    });
  });

  describe("AWS形式", () => {
    it("有効なAWS式をvalidとする", () => {
      expect(validateCron("0 9 ? * MON *", "aws").valid).toBe(true);
      expect(validateCron("* * * * ? *", "aws").valid).toBe(true);
      expect(validateCron("0 0 1 * ? *", "aws").valid).toBe(true);
    });

    it("日と曜日の両方が?でないとinvalid", () => {
      const result = validateCron("0 9 * * MON *", "aws");
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain("?");
    });

    it("日と曜日の両方が?だとinvalid", () => {
      const result = validateCron("0 9 ? * ? *", "aws");
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain("?");
    });

    it("6フィールドでない場合はinvalid", () => {
      const result = validateCron("* * * * *", "aws");
      expect(result.valid).toBe(false);
    });

    it("AWSプリセットの式がすべて有効", () => {
      AWS_CRON_PRESETS.forEach((preset) => {
        expect(validateCron(preset.expression, "aws").valid).toBe(true);
      });
    });

    it("曜日名（MON-FRI）を含む式が有効", () => {
      expect(validateCron("0 9 ? * MON-FRI *", "aws").valid).toBe(true);
    });
  });
});

describe("getNextExecutions", () => {
  it("次回実行時刻を指定件数分取得する", () => {
    const dates = getNextExecutions("0 9 * * *", 5);
    expect(dates).toHaveLength(5);
  });

  it("結果が時系列順になっている", () => {
    const dates = getNextExecutions("* * * * *", 5);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i].getTime()).toBeGreaterThan(dates[i - 1].getTime());
    }
  });

  it("無効な式で空配列を返す", () => {
    const dates = getNextExecutions("invalid", 5);
    expect(dates).toEqual([]);
  });

  it("開始日時を指定できる", () => {
    const from = new Date("2024-01-01T00:00:00Z");
    const dates = getNextExecutions("0 0 * * *", 3, from);
    expect(dates).toHaveLength(3);
    dates.forEach((d) => {
      expect(d.getTime()).toBeGreaterThan(from.getTime());
    });
  });

  describe("AWS形式", () => {
    it("AWS式で次回実行時刻を取得する", () => {
      const from = new Date("2024-01-01T00:00:00");
      const dates = getNextExecutions("0 9 ? * MON *", 3, from, "aws");
      expect(dates).toHaveLength(3);
      // すべて月曜日（getDay() === 1）、ローカル時刻9時
      dates.forEach((d) => {
        expect(d.getDay()).toBe(1);
        expect(d.getHours()).toBe(9);
      });
    });

    it("AWS式で日指定の実行時刻を取得する", () => {
      const from = new Date("2024-01-01T00:00:00");
      const dates = getNextExecutions("0 0 1 * ? *", 3, from, "aws");
      expect(dates).toHaveLength(3);
      // すべて1日
      dates.forEach((d) => {
        expect(d.getDate()).toBe(1);
      });
    });

    it("無効なAWS式で空配列を返す", () => {
      const dates = getNextExecutions("invalid", 5, undefined, "aws");
      expect(dates).toEqual([]);
    });
  });
});

describe("describeCron", () => {
  it("毎分の式を説明する", () => {
    const parts = parseCron("* * * * *")!;
    expect(describeCron(parts, "en")).toBe("Every minute");
    expect(describeCron(parts, "ja")).toBe("毎分");
  });

  it("毎時の式を説明する", () => {
    const parts = parseCron("30 * * * *")!;
    expect(describeCron(parts, "en")).toContain("30");
    expect(describeCron(parts, "ja")).toContain("30分");
  });

  it("特定時刻の式を説明する", () => {
    const parts = parseCron("0 9 * * *")!;
    expect(describeCron(parts, "en")).toContain("09:00");
    expect(describeCron(parts, "ja")).toContain("9時");
  });

  describe("AWS形式の説明", () => {
    it("?を*として扱い正しく説明する", () => {
      const parts = parseAwsCron("0 9 ? * MON *")!;
      const enDesc = describeCron(parts, "en");
      const jaDesc = describeCron(parts, "ja");
      expect(enDesc).toContain("09:00");
      expect(enDesc).toContain("Monday");
      expect(jaDesc).toContain("9時");
      expect(jaDesc).toContain("月曜日");
    });

    it("日指定のAWS式を説明する", () => {
      const parts = parseAwsCron("0 0 1 * ? *")!;
      const enDesc = describeCron(parts, "en");
      const jaDesc = describeCron(parts, "ja");
      expect(enDesc).toContain("day 1");
      expect(jaDesc).toContain("1日");
    });

    it("曜日名の範囲を説明する", () => {
      const parts = parseAwsCron("0 9 ? * MON-FRI *")!;
      const enDesc = describeCron(parts, "en");
      expect(enDesc).toContain("09:00");
    });
  });
});
