import {
  calculateAgeDetails,
  calculateDaysUntilNextBirthday,
  calculateAgeFromGregorian,
  calculateAgeFromWareki,
} from "../age-calculator";

describe("age-calculator", () => {
  describe("calculateAgeDetails", () => {
    it("正確な年齢を年・月・日で計算できる", () => {
      const birthDate = new Date(1990, 0, 15); // 1990年1月15日
      const targetDate = new Date(2025, 1, 5); // 2025年2月5日
      const result = calculateAgeDetails(birthDate, targetDate);

      expect(result.years).toBe(35);
      expect(result.months).toBe(0);
      expect(result.days).toBe(21);
    });

    it("誕生日当日は正確に計算される", () => {
      const birthDate = new Date(2000, 5, 15); // 2000年6月15日
      const targetDate = new Date(2025, 5, 15); // 2025年6月15日（誕生日当日）
      const result = calculateAgeDetails(birthDate, targetDate);

      expect(result.years).toBe(25);
      expect(result.months).toBe(0);
      expect(result.days).toBe(0);
    });

    it("月またぎを正確に計算できる", () => {
      const birthDate = new Date(2000, 0, 31); // 2000年1月31日
      const targetDate = new Date(2000, 1, 15); // 2000年2月15日
      const result = calculateAgeDetails(birthDate, targetDate);

      expect(result.years).toBe(0);
      expect(result.months).toBe(0);
      expect(result.days).toBe(15);
    });
  });

  describe("calculateDaysUntilNextBirthday", () => {
    it("今年の誕生日が未来の場合、正しい日数を返す", () => {
      const today = new Date(2025, 0, 1); // 2025年1月1日
      const days = calculateDaysUntilNextBirthday(6, 15, today); // 6月15日
      expect(days).toBe(165); // 1月1日から6月15日まで
    });

    it("今年の誕生日が過ぎている場合、来年までの日数を返す", () => {
      const today = new Date(2025, 6, 1); // 2025年7月1日
      const days = calculateDaysUntilNextBirthday(6, 15, today); // 6月15日
      // 2026年6月15日まで
      expect(days).toBeGreaterThan(300);
    });

    it("誕生日当日は次の誕生日まで0日を返す", () => {
      const today = new Date(2025, 5, 15); // 2025年6月15日
      const days = calculateDaysUntilNextBirthday(6, 15, today);
      // 誕生日当日は0日
      expect(days).toBe(0);
    });

    it("2月29日生まれで閏年でない場合は3月1日として計算", () => {
      const today = new Date(2025, 0, 1); // 2025年1月1日（閏年でない）
      const days = calculateDaysUntilNextBirthday(2, 29, today);
      // 2025年3月1日まで
      expect(days).toBe(59); // 1月1日から3月1日まで
    });
  });

  describe("calculateAgeFromGregorian", () => {
    it("西暦から正しく年齢を計算できる", () => {
      const today = new Date(2025, 1, 5); // 2025年2月5日
      const result = calculateAgeFromGregorian(1990, 1, 15, today);

      expect(result.success).toBe(true);
      expect(result.currentAge?.years).toBe(35);
      expect(result.ageThisYear).toBe(35);
    });

    it("和暦も含めて返す", () => {
      const today = new Date(2025, 1, 5);
      const result = calculateAgeFromGregorian(1990, 1, 15, today);

      expect(result.success).toBe(true);
      expect(result.birthDate?.wareki?.era.name).toBe("平成");
      expect(result.birthDate?.wareki?.year).toBe(2); // 平成2年
    });

    it("今年の誕生日情報を含む", () => {
      const today = new Date(2025, 1, 5); // 2月5日
      const result = calculateAgeFromGregorian(1990, 6, 15, today); // 6月15日生まれ

      expect(result.success).toBe(true);
      expect(result.birthdayThisYear?.isPast).toBe(false);
      expect(result.daysUntilNextBirthday).toBeGreaterThan(0);
    });

    it("無効な日付はエラーを返す", () => {
      const result = calculateAgeFromGregorian(2025, 2, 30);
      expect(result.success).toBe(false);
      expect(result.errorKey).toBe("invalidDate");
    });

    it("明治元年より前はエラーを返す", () => {
      const result = calculateAgeFromGregorian(1867, 1, 1);
      expect(result.success).toBe(false);
      expect(result.errorKey).toBe("dateOutOfRange");
    });

    it("未来の日付はエラーを返す", () => {
      const today = new Date(2025, 1, 5);
      const result = calculateAgeFromGregorian(2030, 1, 1, today);
      expect(result.success).toBe(false);
      expect(result.errorKey).toBe("futureDateError");
    });
  });

  describe("calculateAgeFromWareki", () => {
    it("和暦から正しく年齢を計算できる", () => {
      const today = new Date(2025, 1, 5); // 2025年2月5日
      const result = calculateAgeFromWareki("平成", 2, 1, 15, today); // 平成2年1月15日

      expect(result.success).toBe(true);
      expect(result.birthDate?.year).toBe(1990);
      expect(result.currentAge?.years).toBe(35);
    });

    it("令和でも正しく計算できる", () => {
      const today = new Date(2025, 1, 5);
      const result = calculateAgeFromWareki("令和", 1, 6, 1, today); // 令和1年6月1日

      expect(result.success).toBe(true);
      expect(result.birthDate?.year).toBe(2019);
      expect(result.currentAge?.years).toBe(5);
    });

    it("英語の元号名でも計算できる", () => {
      const today = new Date(2025, 1, 5);
      const result = calculateAgeFromWareki("Heisei", 2, 1, 15, today);

      expect(result.success).toBe(true);
      expect(result.birthDate?.year).toBe(1990);
    });

    it("略称でも計算できる", () => {
      const today = new Date(2025, 1, 5);
      const result = calculateAgeFromWareki("H", 2, 1, 15, today);

      expect(result.success).toBe(true);
      expect(result.birthDate?.year).toBe(1990);
    });

    it("無効な元号はエラーを返す", () => {
      const result = calculateAgeFromWareki("無効", 1, 1, 1);
      expect(result.success).toBe(false);
      expect(result.errorKey).toBe("invalidEra");
    });

    it("元号の範囲外はエラーを返す", () => {
      const result = calculateAgeFromWareki("平成", 32, 1, 1);
      expect(result.success).toBe(false);
      expect(result.errorKey).toBe("eraYearOutOfRange");
    });

    it("未来の日付はエラーを返す", () => {
      const today = new Date(2025, 1, 5);
      const result = calculateAgeFromWareki("令和", 20, 1, 1, today);
      expect(result.success).toBe(false);
      expect(result.errorKey).toBe("futureDateError");
    });
  });
});
