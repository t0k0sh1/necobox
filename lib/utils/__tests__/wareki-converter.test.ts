import {
  gregorianToWareki,
  warekiToGregorian,
  isValidDate,
  isValidWarekiDate,
  getEras,
  getEraByName,
  getWeekdayNameJa,
  getWeekdayNameEn,
} from "../wareki-converter";

describe("wareki-converter", () => {
  describe("getEras", () => {
    it("元号一覧を取得できる", () => {
      const eras = getEras();
      expect(eras).toHaveLength(5);
      expect(eras[0].name).toBe("令和");
      expect(eras[4].name).toBe("明治");
    });
  });

  describe("getEraByName", () => {
    it("日本語名で元号を取得できる", () => {
      const era = getEraByName("令和");
      expect(era?.name).toBe("令和");
    });

    it("英語名で元号を取得できる", () => {
      const era = getEraByName("Reiwa");
      expect(era?.name).toBe("令和");
    });

    it("略称で元号を取得できる", () => {
      const era = getEraByName("R");
      expect(era?.name).toBe("令和");
    });

    it("存在しない元号はundefinedを返す", () => {
      const era = getEraByName("未知");
      expect(era).toBeUndefined();
    });
  });

  describe("isValidDate", () => {
    it("有効な日付を検証できる", () => {
      expect(isValidDate(2025, 2, 5)).toBe(true);
      expect(isValidDate(2024, 2, 29)).toBe(true); // 閏年
    });

    it("無効な日付を検出できる", () => {
      expect(isValidDate(2025, 2, 29)).toBe(false); // 閏年でない
      expect(isValidDate(2025, 13, 1)).toBe(false); // 月が無効
      expect(isValidDate(2025, 4, 31)).toBe(false); // 4月31日は存在しない
    });
  });

  describe("isValidWarekiDate", () => {
    it("有効な和暦日付を検証できる", () => {
      const result = isValidWarekiDate("令和", 7, 2, 5);
      expect(result.valid).toBe(true);
    });

    it("元号の範囲外の年を検出できる", () => {
      // 平成32年は存在しない(平成は31年まで)
      const result = isValidWarekiDate("平成", 32, 1, 1);
      expect(result.valid).toBe(false);
      expect(result.errorKey).toBe("eraYearOutOfRange");
    });

    it("存在しない元号を検出できる", () => {
      const result = isValidWarekiDate("未知", 1, 1, 1);
      expect(result.valid).toBe(false);
      expect(result.errorKey).toBe("invalidEra");
    });
  });

  describe("gregorianToWareki", () => {
    it("2025/2/5 → 令和7年2月5日", () => {
      const result = gregorianToWareki(2025, 2, 5);
      expect(result.success).toBe(true);
      expect(result.wareki?.era.name).toBe("令和");
      expect(result.wareki?.year).toBe(7);
      expect(result.wareki?.month).toBe(2);
      expect(result.wareki?.day).toBe(5);
      expect(result.wareki?.formatted).toBe("令和7年2月5日");
    });

    it("2019/5/1 (令和初日) → 令和1年5月1日", () => {
      const result = gregorianToWareki(2019, 5, 1);
      expect(result.success).toBe(true);
      expect(result.wareki?.era.name).toBe("令和");
      expect(result.wareki?.year).toBe(1);
      expect(result.wareki?.formatted).toBe("令和1年5月1日");
    });

    it("2019/4/30 (平成最終日) → 平成31年4月30日", () => {
      const result = gregorianToWareki(2019, 4, 30);
      expect(result.success).toBe(true);
      expect(result.wareki?.era.name).toBe("平成");
      expect(result.wareki?.year).toBe(31);
      expect(result.wareki?.formatted).toBe("平成31年4月30日");
    });

    it("1989/1/8 (平成初日) → 平成1年1月8日", () => {
      const result = gregorianToWareki(1989, 1, 8);
      expect(result.success).toBe(true);
      expect(result.wareki?.era.name).toBe("平成");
      expect(result.wareki?.year).toBe(1);
    });

    it("1989/1/7 (昭和最終日) → 昭和64年1月7日", () => {
      const result = gregorianToWareki(1989, 1, 7);
      expect(result.success).toBe(true);
      expect(result.wareki?.era.name).toBe("昭和");
      expect(result.wareki?.year).toBe(64);
    });

    it("1868/1/25 (明治初日) → 明治1年1月25日", () => {
      const result = gregorianToWareki(1868, 1, 25);
      expect(result.success).toBe(true);
      expect(result.wareki?.era.name).toBe("明治");
      expect(result.wareki?.year).toBe(1);
    });

    it("明治元年より前の日付はエラー", () => {
      const result = gregorianToWareki(1867, 12, 31);
      expect(result.success).toBe(false);
      expect(result.errorKey).toBe("dateOutOfRange");
    });

    it("無効な日付はエラー", () => {
      const result = gregorianToWareki(2025, 2, 29);
      expect(result.success).toBe(false);
      expect(result.errorKey).toBe("invalidDate");
    });

    it("閏年の2月29日は変換できる", () => {
      const result = gregorianToWareki(2024, 2, 29);
      expect(result.success).toBe(true);
      expect(result.wareki?.formatted).toBe("令和6年2月29日");
    });

    it("曜日が正しく計算される", () => {
      // 2025/2/5 は水曜日
      const result = gregorianToWareki(2025, 2, 5);
      expect(result.success).toBe(true);
      expect(result.gregorian?.weekday).toBe(3); // 水曜日
    });
  });

  describe("warekiToGregorian", () => {
    it("令和7年 → 2025年", () => {
      const result = warekiToGregorian("令和", 7, 2, 5);
      expect(result.success).toBe(true);
      expect(result.gregorian?.year).toBe(2025);
      expect(result.gregorian?.month).toBe(2);
      expect(result.gregorian?.day).toBe(5);
    });

    it("平成31年4月30日 → 2019年4月30日", () => {
      const result = warekiToGregorian("平成", 31, 4, 30);
      expect(result.success).toBe(true);
      expect(result.gregorian?.year).toBe(2019);
      expect(result.gregorian?.month).toBe(4);
      expect(result.gregorian?.day).toBe(30);
    });

    it("昭和64年1月7日 → 1989年1月7日", () => {
      const result = warekiToGregorian("昭和", 64, 1, 7);
      expect(result.success).toBe(true);
      expect(result.gregorian?.year).toBe(1989);
    });

    it("平成32年はエラー (範囲外)", () => {
      const result = warekiToGregorian("平成", 32, 1, 1);
      expect(result.success).toBe(false);
      expect(result.errorKey).toBe("eraYearOutOfRange");
    });

    it("英語名でも変換できる", () => {
      const result = warekiToGregorian("Reiwa", 7, 2, 5);
      expect(result.success).toBe(true);
      expect(result.gregorian?.year).toBe(2025);
    });

    it("略称でも変換できる", () => {
      const result = warekiToGregorian("R", 7, 2, 5);
      expect(result.success).toBe(true);
      expect(result.gregorian?.year).toBe(2025);
    });
  });

  describe("getWeekdayNameJa", () => {
    it("曜日の日本語名を取得できる", () => {
      expect(getWeekdayNameJa(0)).toBe("日");
      expect(getWeekdayNameJa(1)).toBe("月");
      expect(getWeekdayNameJa(3)).toBe("水");
      expect(getWeekdayNameJa(6)).toBe("土");
    });

    it("範囲外の値は空文字を返す", () => {
      expect(getWeekdayNameJa(-1)).toBe("");
      expect(getWeekdayNameJa(7)).toBe("");
    });
  });

  describe("getWeekdayNameEn", () => {
    it("曜日の英語名を取得できる", () => {
      expect(getWeekdayNameEn(0)).toBe("Sunday");
      expect(getWeekdayNameEn(1)).toBe("Monday");
      expect(getWeekdayNameEn(3)).toBe("Wednesday");
      expect(getWeekdayNameEn(6)).toBe("Saturday");
    });

    it("範囲外の値は空文字を返す", () => {
      expect(getWeekdayNameEn(-1)).toBe("");
      expect(getWeekdayNameEn(7)).toBe("");
    });
  });
});
