import {
  convertTimeZone,
  getAvailableTimeZones,
  getAvailableTimeZonesWithInfo,
} from "../time-zone-converter";

describe("time-zone-converter", () => {
  describe("convertTimeZone", () => {
    it("東京からニューヨークへの変換が正しい", () => {
      // 2024-01-15 12:00 JST → EST (UTC-5, 冬時間)
      // JST は UTC+9 なので 12:00 JST = 03:00 UTC (2024-01-15)
      // EST は UTC-5 なので 03:00 UTC = 22:00 EST (2024-01-14)
      const result = convertTimeZone({
        year: 2024,
        month: 1,
        day: 15,
        hour: 12,
        minute: 0,
        fromTimeZone: "Asia/Tokyo",
        toTimeZone: "America/New_York",
      });
      expect(result.year).toBe(2024);
      expect(result.month).toBe(1);
      expect(result.day).toBe(14);
      expect(result.hour).toBe(22);
      expect(result.minute).toBe(0);
    });

    it("同じタイムゾーン間の変換は元の時刻と同じ", () => {
      const result = convertTimeZone({
        year: 2024,
        month: 6,
        day: 15,
        hour: 10,
        minute: 30,
        fromTimeZone: "Asia/Tokyo",
        toTimeZone: "Asia/Tokyo",
      });
      expect(result.year).toBe(2024);
      expect(result.month).toBe(6);
      expect(result.day).toBe(15);
      expect(result.hour).toBe(10);
      expect(result.minute).toBe(30);
    });

    it("UTCからの変換が正しい", () => {
      const result = convertTimeZone({
        year: 2024,
        month: 3,
        day: 1,
        hour: 0,
        minute: 0,
        fromTimeZone: "UTC",
        toTimeZone: "Asia/Tokyo",
      });
      // UTC 0:00 → JST 9:00
      expect(result.hour).toBe(9);
      expect(result.minute).toBe(0);
    });

    it("不正な月でエラーをスローする", () => {
      expect(() =>
        convertTimeZone({
          year: 2024,
          month: 13,
          day: 1,
          hour: 0,
          minute: 0,
          fromTimeZone: "UTC",
          toTimeZone: "Asia/Tokyo",
        })
      ).toThrow("Month must be between 1 and 12");
    });

    it("不正な日でエラーをスローする", () => {
      expect(() =>
        convertTimeZone({
          year: 2024,
          month: 2,
          day: 30,
          hour: 0,
          minute: 0,
          fromTimeZone: "UTC",
          toTimeZone: "Asia/Tokyo",
        })
      ).toThrow("Invalid day for the given month and year");
    });

    it("不正な時でエラーをスローする", () => {
      expect(() =>
        convertTimeZone({
          year: 2024,
          month: 1,
          day: 1,
          hour: 24,
          minute: 0,
          fromTimeZone: "UTC",
          toTimeZone: "Asia/Tokyo",
        })
      ).toThrow("Hour must be between 0 and 23");
    });

    it("不正な分でエラーをスローする", () => {
      expect(() =>
        convertTimeZone({
          year: 2024,
          month: 1,
          day: 1,
          hour: 0,
          minute: 60,
          fromTimeZone: "UTC",
          toTimeZone: "Asia/Tokyo",
        })
      ).toThrow("Minute must be between 0 and 59");
    });

    it("タイムゾーン未指定でエラーをスローする", () => {
      expect(() =>
        convertTimeZone({
          year: 2024,
          month: 1,
          day: 1,
          hour: 0,
          minute: 0,
          fromTimeZone: "",
          toTimeZone: "Asia/Tokyo",
        })
      ).toThrow("Time zones are required");
    });

    it("変換結果にweekday、timeZoneAbbr、formattedが含まれる", () => {
      const result = convertTimeZone({
        year: 2024,
        month: 1,
        day: 15,
        hour: 12,
        minute: 0,
        fromTimeZone: "Asia/Tokyo",
        toTimeZone: "Asia/Tokyo",
      });
      expect(result.weekday).toBeTruthy();
      expect(result.timeZoneAbbr).toBe("JST");
      expect(result.formatted).toBeTruthy();
      expect(result.utcOffset).toBeTruthy();
    });
  });

  describe("getAvailableTimeZones", () => {
    it("タイムゾーンリストを返す", () => {
      const zones = getAvailableTimeZones();
      expect(Array.isArray(zones)).toBe(true);
      expect(zones.length).toBeGreaterThan(0);
    });

    it("UTCが含まれる", () => {
      const zones = getAvailableTimeZones();
      expect(zones).toContain("UTC");
    });

    it("主要タイムゾーンが含まれる", () => {
      const zones = getAvailableTimeZones();
      expect(zones).toContain("Asia/Tokyo");
      expect(zones).toContain("America/New_York");
    });
  });

  describe("getAvailableTimeZonesWithInfo", () => {
    it("情報オブジェクトの構造が正しい", () => {
      const zones = getAvailableTimeZonesWithInfo();
      expect(zones.length).toBeGreaterThan(0);
      const first = zones[0];
      expect(first).toHaveProperty("ianaName");
      expect(first).toHaveProperty("abbreviation");
      expect(first).toHaveProperty("offset");
      expect(first).toHaveProperty("displayName");
    });

    it("優先タイムゾーンが先頭に配置される", () => {
      const zones = getAvailableTimeZonesWithInfo();
      const ianaNames = zones.map((z) => z.ianaName);
      const utcIndex = ianaNames.indexOf("UTC");
      const tokyoIndex = ianaNames.indexOf("Asia/Tokyo");
      const nyIndex = ianaNames.indexOf("America/New_York");

      expect(utcIndex).toBeLessThan(tokyoIndex);
      expect(tokyoIndex).toBeLessThan(nyIndex);
    });
  });
});
