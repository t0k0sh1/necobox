import {
  calcWorkMinutes,
  formatWorkTime,
  isWeekend,
  isHoliday,
  isNonBusinessDay,
  getDaysInMonth,
  calcMonthlyTotal,
  getOrCreateMonth,
  getDefaultSettings,
  loadAttendanceData,
  saveAttendanceData,
  collectTaskSuggestions,
  getMaxTaskCount,
  aggregateTaskCounts,
  getDailyTaskList,
  getTaskPeriods,
  exportAttendanceData,
  validateAttendanceExportData,
  importAttendanceJson,
  type AttendanceData,
  type AttendanceExportData,
  type DailyAttendance,
  type MonthSettings,
} from "../attendance";

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

beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});

describe("calcWorkMinutes", () => {
  it("通常の勤務時間を計算できる", () => {
    expect(calcWorkMinutes("09:00", "18:00", 60)).toBe(480);
  });

  it("日跨ぎの勤務時間を計算できる", () => {
    expect(calcWorkMinutes("22:00", "06:00", 60)).toBe(420);
  });

  it("休憩0分の勤務時間を計算できる", () => {
    expect(calcWorkMinutes("09:00", "18:00", 0)).toBe(540);
  });

  it("短い勤務時間を計算できる", () => {
    expect(calcWorkMinutes("10:00", "12:30", 0)).toBe(150);
  });

  it("休憩が勤務時間を超える場合は0を返す", () => {
    expect(calcWorkMinutes("10:00", "11:00", 120)).toBe(0);
  });
});

describe("formatWorkTime", () => {
  it("8時間を正しくフォーマットする", () => {
    expect(formatWorkTime(480)).toBe("8:00");
  });

  it("9時間30分を正しくフォーマットする", () => {
    expect(formatWorkTime(570)).toBe("9:30");
  });

  it("0分を正しくフォーマットする", () => {
    expect(formatWorkTime(0)).toBe("0:00");
  });

  it("30分を正しくフォーマットする", () => {
    expect(formatWorkTime(30)).toBe("0:30");
  });

  it("1分を正しくフォーマットする", () => {
    expect(formatWorkTime(1)).toBe("0:01");
  });
});

describe("isWeekend", () => {
  it("土曜日をtrueと判定する", () => {
    expect(isWeekend(new Date(2026, 2, 14))).toBe(true);
  });

  it("日曜日をtrueと判定する", () => {
    expect(isWeekend(new Date(2026, 2, 15))).toBe(true);
  });

  it("平日をfalseと判定する", () => {
    expect(isWeekend(new Date(2026, 2, 16))).toBe(false);
  });
});

describe("isHoliday", () => {
  it("元日を祝日と判定する", () => {
    expect(isHoliday(new Date(2026, 0, 1))).toBe(true);
  });

  it("憲法記念日を祝日と判定する", () => {
    expect(isHoliday(new Date(2026, 4, 3))).toBe(true);
  });

  it("春分の日を祝日と判定する", () => {
    expect(isHoliday(new Date(2026, 2, 20))).toBe(true);
  });

  it("秋分の日を祝日と判定する", () => {
    expect(isHoliday(new Date(2026, 8, 23))).toBe(true);
  });

  it("成人の日（1月第2月曜）を祝日と判定する", () => {
    expect(isHoliday(new Date(2026, 0, 12))).toBe(true);
  });

  it("海の日（7月第3月曜）を祝日と判定する", () => {
    expect(isHoliday(new Date(2026, 6, 20))).toBe(true);
  });

  it("スポーツの日（10月第2月曜）を祝日と判定する", () => {
    expect(isHoliday(new Date(2026, 9, 12))).toBe(true);
  });

  it("振替休日を祝日と判定する", () => {
    expect(isHoliday(new Date(2026, 4, 6))).toBe(true);
  });

  it("祝日名を返せる（japanese-holidays連携確認）", async () => {
    const JapaneseHolidays = await import("japanese-holidays");
    expect(JapaneseHolidays.default.isHoliday(new Date(2026, 2, 20))).toBe("春分の日");
  });

  it("通常の平日を祝日でないと判定する", () => {
    expect(isHoliday(new Date(2026, 2, 16))).toBe(false);
  });
});

describe("isNonBusinessDay", () => {
  it("土曜日は非営業日", () => {
    expect(isNonBusinessDay(new Date(2026, 2, 14))).toBe(true);
  });

  it("祝日は非営業日", () => {
    expect(isNonBusinessDay(new Date(2026, 0, 1))).toBe(true);
  });

  it("通常の平日は営業日", () => {
    expect(isNonBusinessDay(new Date(2026, 2, 16))).toBe(false);
  });
});

describe("getDaysInMonth", () => {
  it("2026年3月は31日分のデータを生成する", () => {
    const days = getDaysInMonth(2026, 3);
    expect(days).toHaveLength(31);
    expect(days[0].date).toBe("2026-03-01");
    expect(days[30].date).toBe("2026-03-31");
  });

  it("2026年2月は28日分のデータを生成する", () => {
    const days = getDaysInMonth(2026, 2);
    expect(days).toHaveLength(28);
  });

  it("うるう年の2月は29日分のデータを生成する", () => {
    const days = getDaysInMonth(2024, 2);
    expect(days).toHaveLength(29);
  });

  it("各日のデフォルト値が正しい", () => {
    const days = getDaysInMonth(2026, 1);
    const first = days[0];
    expect(first.startTime).toBeNull();
    expect(first.endTime).toBeNull();
    expect(first.breakMinutes).toBe(60);
    expect(first.tasks).toEqual([]);
  });
});

describe("calcMonthlyTotal", () => {
  const settings: MonthSettings = {
    defaultStartTime: "09:00",
    defaultEndTime: "18:00",
    defaultBreakMinutes: 60,
  };

  it("入力済み日のみで正しく計算する", () => {
    const days: DailyAttendance[] = [
      {
        date: "2026-03-16",
        startTime: "09:00",
        endTime: "18:00",
        breakMinutes: 60,
        tasks: [],
      },
      {
        date: "2026-03-17",
        startTime: "10:00",
        endTime: "19:00",
        breakMinutes: 60,
        tasks: [],
      },
    ];

    const result = calcMonthlyTotal(days, settings);
    expect(result.businessDays).toBe(2);
    expect(result.enteredDays).toBe(2);
    expect(result.totalMinutes).toBe(960);
  });

  it("未入力の平日はデフォルト勤務時間で補完する", () => {
    const days: DailyAttendance[] = [
      {
        date: "2026-03-16",
        startTime: null,
        endTime: null,
        breakMinutes: 60,
        tasks: [],
      },
    ];

    const result = calcMonthlyTotal(days, settings);
    expect(result.businessDays).toBe(1);
    expect(result.enteredDays).toBe(0);
    expect(result.totalMinutes).toBe(480);
  });

  it("未入力の土日は加算しない", () => {
    const days: DailyAttendance[] = [
      {
        date: "2026-03-14",
        startTime: null,
        endTime: null,
        breakMinutes: 60,
        tasks: [],
      },
    ];

    const result = calcMonthlyTotal(days, settings);
    expect(result.businessDays).toBe(0);
    expect(result.enteredDays).toBe(0);
    expect(result.totalMinutes).toBe(0);
  });

  it("入力済みの土日は加算する", () => {
    const days: DailyAttendance[] = [
      {
        date: "2026-03-14",
        startTime: "10:00",
        endTime: "15:00",
        breakMinutes: 60,
        tasks: ["休日出勤"],
      },
    ];

    const result = calcMonthlyTotal(days, settings);
    expect(result.businessDays).toBe(0);
    expect(result.enteredDays).toBe(1);
    expect(result.totalMinutes).toBe(240);
  });
});

describe("collectTaskSuggestions", () => {
  it("全月からタスク名を収集する", () => {
    const data: AttendanceData = {
      months: {
        "2026-03": {
          yearMonth: "2026-03",
          settings: getDefaultSettings(),
          days: [
            { date: "2026-03-01", startTime: null, endTime: null, breakMinutes: 60, tasks: ["開発", "レビュー"] },
            { date: "2026-03-02", startTime: null, endTime: null, breakMinutes: 60, tasks: ["開発"] },
          ],
        },
      },
    };
    expect(collectTaskSuggestions(data)).toEqual(["レビュー", "開発"]);
  });
});

describe("getMaxTaskCount", () => {
  it("最大タスク数を返す", () => {
    const days: DailyAttendance[] = [
      { date: "2026-03-01", startTime: null, endTime: null, breakMinutes: 60, tasks: ["A"] },
      { date: "2026-03-02", startTime: null, endTime: null, breakMinutes: 60, tasks: ["A", "B", "C"] },
      { date: "2026-03-03", startTime: null, endTime: null, breakMinutes: 60, tasks: [] },
    ];
    expect(getMaxTaskCount(days)).toBe(3);
  });

  it("タスクがない場合は1を返す", () => {
    const days: DailyAttendance[] = [
      { date: "2026-03-01", startTime: null, endTime: null, breakMinutes: 60, tasks: [] },
    ];
    expect(getMaxTaskCount(days)).toBe(1);
  });
});

describe("aggregateTaskCounts", () => {
  it("タスク名ごとの作業日数を集計し日数降順で返す", () => {
    const days: DailyAttendance[] = [
      { date: "2026-03-01", startTime: null, endTime: null, breakMinutes: 60, tasks: ["開発", "レビュー"] },
      { date: "2026-03-02", startTime: null, endTime: null, breakMinutes: 60, tasks: ["開発"] },
      { date: "2026-03-03", startTime: null, endTime: null, breakMinutes: 60, tasks: ["テスト", "レビュー"] },
    ];
    const result = aggregateTaskCounts(days);
    expect(result).toEqual([
      { task: "開発", days: 2 },
      { task: "レビュー", days: 2 },
      { task: "テスト", days: 1 },
    ]);
  });

  it("同じ日に同じタスクが複数あっても1日としてカウントする", () => {
    const days: DailyAttendance[] = [
      { date: "2026-03-01", startTime: null, endTime: null, breakMinutes: 60, tasks: ["開発", "開発"] },
    ];
    const result = aggregateTaskCounts(days);
    expect(result).toEqual([{ task: "開発", days: 1 }]);
  });

  it("タスクがない場合は空配列を返す", () => {
    const days: DailyAttendance[] = [
      { date: "2026-03-01", startTime: null, endTime: null, breakMinutes: 60, tasks: [] },
    ];
    expect(aggregateTaskCounts(days)).toEqual([]);
  });
});

describe("getDailyTaskList", () => {
  it("タスクがある日のみ抽出する", () => {
    const days: DailyAttendance[] = [
      { date: "2026-03-01", startTime: null, endTime: null, breakMinutes: 60, tasks: ["開発"] },
      { date: "2026-03-02", startTime: null, endTime: null, breakMinutes: 60, tasks: [] },
      { date: "2026-03-03", startTime: null, endTime: null, breakMinutes: 60, tasks: ["テスト", "レビュー"] },
    ];
    const result = getDailyTaskList(days);
    expect(result).toEqual([
      { date: "2026-03-01", tasks: ["開発"] },
      { date: "2026-03-03", tasks: ["テスト", "レビュー"] },
    ]);
  });

  it("タスクがない場合は空配列を返す", () => {
    const days: DailyAttendance[] = [
      { date: "2026-03-01", startTime: null, endTime: null, breakMinutes: 60, tasks: [] },
    ];
    expect(getDailyTaskList(days)).toEqual([]);
  });

  it("空文字のタスクはフィルタリングされる", () => {
    const days: DailyAttendance[] = [
      { date: "2026-03-01", startTime: null, endTime: null, breakMinutes: 60, tasks: ["", "開発"] },
      { date: "2026-03-02", startTime: null, endTime: null, breakMinutes: 60, tasks: [""] },
    ];
    const result = getDailyTaskList(days);
    expect(result).toEqual([
      { date: "2026-03-01", tasks: ["開発"] },
    ]);
  });
});

describe("getTaskPeriods", () => {
  it("タスクごとの開始日・終了日・出現日数を開始日昇順で返す", () => {
    const days: DailyAttendance[] = [
      { date: "2026-03-01", startTime: null, endTime: null, breakMinutes: 60, tasks: ["開発"] },
      { date: "2026-03-02", startTime: null, endTime: null, breakMinutes: 60, tasks: ["レビュー"] },
      { date: "2026-03-03", startTime: null, endTime: null, breakMinutes: 60, tasks: ["開発", "レビュー"] },
      { date: "2026-03-05", startTime: null, endTime: null, breakMinutes: 60, tasks: ["開発"] },
    ];
    const result = getTaskPeriods(days);
    expect(result).toEqual([
      { task: "開発", startDate: "2026-03-01", endDate: "2026-03-05", days: 3 },
      { task: "レビュー", startDate: "2026-03-02", endDate: "2026-03-03", days: 2 },
    ]);
  });

  it("1日のみのタスクは開始日と終了日が同じになる", () => {
    const days: DailyAttendance[] = [
      { date: "2026-03-10", startTime: null, endTime: null, breakMinutes: 60, tasks: ["ミーティング"] },
    ];
    const result = getTaskPeriods(days);
    expect(result).toEqual([
      { task: "ミーティング", startDate: "2026-03-10", endDate: "2026-03-10", days: 1 },
    ]);
  });

  it("タスクがない場合は空配列を返す", () => {
    const days: DailyAttendance[] = [
      { date: "2026-03-01", startTime: null, endTime: null, breakMinutes: 60, tasks: [] },
    ];
    expect(getTaskPeriods(days)).toEqual([]);
  });
});

describe("getOrCreateMonth", () => {
  it("既存の月データを返す", () => {
    const data: AttendanceData = {
      months: {
        "2026-03": {
          yearMonth: "2026-03",
          settings: getDefaultSettings(),
          days: getDaysInMonth(2026, 3),
        },
      },
    };

    const result = getOrCreateMonth(data, "2026-03");
    expect(result.yearMonth).toBe("2026-03");
    expect(result.days).toHaveLength(31);
  });

  it("存在しない月を前月設定を引き継いで生成する", () => {
    const customSettings: MonthSettings = {
      defaultStartTime: "10:00",
      defaultEndTime: "19:00",
      defaultBreakMinutes: 45,
    };

    const data: AttendanceData = {
      months: {
        "2026-02": {
          yearMonth: "2026-02",
          settings: customSettings,
          days: getDaysInMonth(2026, 2),
        },
      },
    };

    const result = getOrCreateMonth(data, "2026-03");
    expect(result.yearMonth).toBe("2026-03");
    expect(result.settings.defaultStartTime).toBe("10:00");
    expect(result.settings.defaultEndTime).toBe("19:00");
    expect(result.settings.defaultBreakMinutes).toBe(45);
    expect(result.days).toHaveLength(31);
    expect(data.months["2026-03"]).toBeDefined();
  });

  it("前月データがない場合はデフォルト設定で生成する", () => {
    const data: AttendanceData = { months: {} };

    const result = getOrCreateMonth(data, "2026-03");
    expect(result.settings).toEqual(getDefaultSettings());
    expect(result.days).toHaveLength(31);
  });

  it("1月の場合は前年12月の設定を引き継ぐ", () => {
    const customSettings: MonthSettings = {
      defaultStartTime: "08:30",
      defaultEndTime: "17:30",
      defaultBreakMinutes: 45,
    };

    const data: AttendanceData = {
      months: {
        "2025-12": {
          yearMonth: "2025-12",
          settings: customSettings,
          days: getDaysInMonth(2025, 12),
        },
      },
    };

    const result = getOrCreateMonth(data, "2026-01");
    expect(result.settings.defaultStartTime).toBe("08:30");
    expect(result.days).toHaveLength(31);
  });
});

describe("loadAttendanceData / saveAttendanceData", () => {
  it("データがない場合はnullを返す", () => {
    expect(loadAttendanceData()).toBeNull();
  });

  it("保存したデータを読み込める", () => {
    const data: AttendanceData = {
      months: {
        "2026-03": {
          yearMonth: "2026-03",
          settings: getDefaultSettings(),
          days: getDaysInMonth(2026, 3),
        },
      },
    };

    saveAttendanceData(data);
    const loaded = loadAttendanceData();
    expect(loaded).toEqual(data);
  });

  it("不正なJSONの場合はnullを返す", () => {
    localStorageMock.setItem("necobox-attendance", "invalid json");
    localStorageMock.getItem.mockReturnValueOnce("invalid json");
    expect(loadAttendanceData()).toBeNull();
  });

  it("旧形式（note）のデータを tasks に移行する", () => {
    const oldData = {
      months: {
        "2026-03": {
          yearMonth: "2026-03",
          settings: getDefaultSettings(),
          days: [
            { date: "2026-03-01", startTime: "09:00", endTime: "18:00", breakMinutes: 60, note: "作業A" },
            { date: "2026-03-02", startTime: null, endTime: null, breakMinutes: 60, note: "" },
          ],
        },
      },
    };
    localStorageMock.setItem("necobox-attendance", JSON.stringify(oldData));
    const loaded = loadAttendanceData();
    expect(loaded!.months["2026-03"].days[0].tasks).toEqual(["作業A"]);
    expect(loaded!.months["2026-03"].days[1].tasks).toEqual([]);
  });

  it("旧形式（TaskEntry配列）のデータを string[] に移行する", () => {
    const oldData = {
      months: {
        "2026-03": {
          yearMonth: "2026-03",
          settings: getDefaultSettings(),
          days: [
            { date: "2026-03-01", startTime: "09:00", endTime: "18:00", breakMinutes: 60, tasks: [{ task: "開発", status: "完了" }, { task: "レビュー", status: "順調" }] },
            { date: "2026-03-02", startTime: null, endTime: null, breakMinutes: 60, tasks: [{ task: "テスト" }] },
          ],
        },
      },
    };
    localStorageMock.setItem("necobox-attendance", JSON.stringify(oldData));
    const loaded = loadAttendanceData();
    expect(loaded!.months["2026-03"].days[0].tasks).toEqual(["開発", "レビュー"]);
    expect(loaded!.months["2026-03"].days[1].tasks).toEqual(["テスト"]);
  });

  it("旧データにcheckedがない場合はfalseで補完する", () => {
    const oldData = {
      months: {
        "2026-03": {
          yearMonth: "2026-03",
          settings: getDefaultSettings(),
          days: [
            { date: "2026-03-01", startTime: "09:00", endTime: "18:00", breakMinutes: 60, tasks: ["開発"] },
          ],
        },
      },
    };
    localStorageMock.setItem("necobox-attendance", JSON.stringify(oldData));
    const loaded = loadAttendanceData();
    expect(loaded!.months["2026-03"].days[0].checked).toBe(false);
  });

  it("旧データにcheckboxLabelがない場合は空文字で補完する", () => {
    const oldData = {
      months: {
        "2026-03": {
          yearMonth: "2026-03",
          settings: { defaultStartTime: "09:00", defaultEndTime: "18:00", defaultBreakMinutes: 60 },
          days: [
            { date: "2026-03-01", startTime: null, endTime: null, breakMinutes: 60, tasks: [] },
          ],
        },
      },
    };
    localStorageMock.setItem("necobox-attendance", JSON.stringify(oldData));
    const loaded = loadAttendanceData();
    expect(loaded!.months["2026-03"].settings.checkboxLabel).toBe("");
  });

  it("旧形式でbreakMinutesが欠落している場合はデフォルト60を補完する", () => {
    const oldData = {
      months: {
        "2026-03": {
          yearMonth: "2026-03",
          settings: getDefaultSettings(),
          days: [
            { date: "2026-03-01", startTime: "09:00", endTime: "18:00", tasks: [{ task: "開発", status: "" }] },
          ],
        },
      },
    };
    localStorageMock.setItem("necobox-attendance", JSON.stringify(oldData));
    const loaded = loadAttendanceData();
    expect(loaded!.months["2026-03"].days[0].breakMinutes).toBe(60);
  });
});

describe("exportAttendanceData", () => {
  it("正しいエクスポート形式のJSON文字列を生成する", () => {
    const data: AttendanceData = {
      months: {
        "2026-03": {
          yearMonth: "2026-03",
          settings: getDefaultSettings(),
          days: [{ date: "2026-03-01", startTime: "09:00", endTime: "18:00", breakMinutes: 60, tasks: ["開発"] }],
        },
      },
    };
    const json = exportAttendanceData(data);
    const parsed = JSON.parse(json) as AttendanceExportData;
    expect(parsed.version).toBe(1);
    expect(typeof parsed.exportedAt).toBe("string");
    expect(parsed.data.months["2026-03"].days[0].tasks).toEqual(["開発"]);
  });
});

describe("validateAttendanceExportData", () => {
  const validData: AttendanceExportData = {
    version: 1,
    exportedAt: "2026-03-14T00:00:00.000Z",
    data: {
      months: {
        "2026-03": {
          yearMonth: "2026-03",
          settings: getDefaultSettings(),
          days: [{ date: "2026-03-01", startTime: "09:00", endTime: "18:00", breakMinutes: 60, tasks: [] }],
        },
      },
    },
  };

  it("正しいデータを受け入れる", () => {
    expect(validateAttendanceExportData(validData)).toBe(true);
  });

  it("nullを拒否する", () => {
    expect(validateAttendanceExportData(null)).toBe(false);
  });

  it("versionが異なるデータを拒否する", () => {
    expect(validateAttendanceExportData({ ...validData, version: 2 })).toBe(false);
  });

  it("exportedAtが欠落しているデータを拒否する", () => {
    expect(validateAttendanceExportData({ version: 1, data: validData.data })).toBe(false);
  });

  it("dataが欠落しているデータを拒否する", () => {
    expect(validateAttendanceExportData({ version: 1, exportedAt: "2026-01-01" })).toBe(false);
  });

  it("日付フィールドが不正なデータを拒否する", () => {
    const bad = {
      version: 1,
      exportedAt: "2026-01-01",
      data: {
        months: {
          "2026-03": {
            yearMonth: "2026-03",
            settings: getDefaultSettings(),
            days: [{ date: 123, startTime: null, endTime: null, breakMinutes: 60, tasks: [] }],
          },
        },
      },
    };
    expect(validateAttendanceExportData(bad)).toBe(false);
  });

  it("settingsのdefaultStartTimeが欠落しているデータを拒否する", () => {
    const bad = {
      version: 1,
      exportedAt: "2026-01-01",
      data: {
        months: {
          "2026-03": {
            yearMonth: "2026-03",
            settings: { defaultEndTime: "18:00", defaultBreakMinutes: 60 },
            days: [],
          },
        },
      },
    };
    expect(validateAttendanceExportData(bad)).toBe(false);
  });

  it("settingsのdefaultBreakMinutesが文字列のデータを拒否する", () => {
    const bad = {
      version: 1,
      exportedAt: "2026-01-01",
      data: {
        months: {
          "2026-03": {
            yearMonth: "2026-03",
            settings: { defaultStartTime: "09:00", defaultEndTime: "18:00", defaultBreakMinutes: "60" },
            days: [],
          },
        },
      },
    };
    expect(validateAttendanceExportData(bad)).toBe(false);
  });

  it("breakMinutesが文字列のデータを拒否する", () => {
    const bad = {
      version: 1,
      exportedAt: "2026-01-01",
      data: {
        months: {
          "2026-03": {
            yearMonth: "2026-03",
            settings: getDefaultSettings(),
            days: [{ date: "2026-03-01", startTime: null, endTime: null, breakMinutes: "60", tasks: [] }],
          },
        },
      },
    };
    expect(validateAttendanceExportData(bad)).toBe(false);
  });

  it("tasksがオブジェクトのデータを拒否する", () => {
    const bad = {
      version: 1,
      exportedAt: "2026-01-01",
      data: {
        months: {
          "2026-03": {
            yearMonth: "2026-03",
            settings: getDefaultSettings(),
            days: [{ date: "2026-03-01", startTime: null, endTime: null, breakMinutes: 60, tasks: "invalid" }],
          },
        },
      },
    };
    expect(validateAttendanceExportData(bad)).toBe(false);
  });
});

describe("importAttendanceJson", () => {
  function createFile(content: string, size?: number): File {
    const file = new File([content], "test.json", { type: "application/json" });
    if (size !== undefined) {
      Object.defineProperty(file, "size", { value: size });
    }
    // JSDOM環境では File.text() が未実装の場合があるのでモック
    if (!file.text) {
      file.text = () => Promise.resolve(content);
    }
    return file;
  }

  it("正しいJSONファイルからデータをインポートできる", async () => {
    const exportData: AttendanceExportData = {
      version: 1,
      exportedAt: "2026-03-14T00:00:00.000Z",
      data: {
        months: {
          "2026-03": {
            yearMonth: "2026-03",
            settings: getDefaultSettings(),
            days: [{ date: "2026-03-01", startTime: "09:00", endTime: "18:00", breakMinutes: 60, tasks: ["開発"] }],
          },
        },
      },
    };
    const file = createFile(JSON.stringify(exportData));
    const result = await importAttendanceJson(file);
    expect(result).not.toBeNull();
    expect(result!.months["2026-03"].days[0].tasks).toEqual(["開発"]);
  });

  it("不正なJSONファイルの場合はnullを返す", async () => {
    const file = createFile("not valid json");
    const result = await importAttendanceJson(file);
    expect(result).toBeNull();
  });

  it("バリデーション失敗時はnullを返す", async () => {
    const file = createFile(JSON.stringify({ version: 999 }));
    const result = await importAttendanceJson(file);
    expect(result).toBeNull();
  });

  it("10MBを超えるファイルはnullを返す", async () => {
    const file = createFile("{}", 11 * 1024 * 1024);
    const result = await importAttendanceJson(file);
    expect(result).toBeNull();
  });

  it("checked/checkboxLabelがない旧データをインポート時に補完する", async () => {
    const exportData = {
      version: 1,
      exportedAt: "2026-03-14T00:00:00.000Z",
      data: {
        months: {
          "2026-03": {
            yearMonth: "2026-03",
            settings: { defaultStartTime: "09:00", defaultEndTime: "18:00", defaultBreakMinutes: 60 },
            days: [{ date: "2026-03-01", startTime: "09:00", endTime: "18:00", breakMinutes: 60, tasks: ["開発"] }],
          },
        },
      },
    };
    const file = createFile(JSON.stringify(exportData));
    const result = await importAttendanceJson(file);
    expect(result).not.toBeNull();
    expect(result!.months["2026-03"].days[0].checked).toBe(false);
    expect(result!.months["2026-03"].settings.checkboxLabel).toBe("");
  });

  it("旧形式のデータもマイグレーションしてインポートできる", async () => {
    const exportData = {
      version: 1,
      exportedAt: "2026-03-14T00:00:00.000Z",
      data: {
        months: {
          "2026-03": {
            yearMonth: "2026-03",
            settings: getDefaultSettings(),
            days: [{ date: "2026-03-01", startTime: "09:00", endTime: "18:00", note: "作業A" }],
          },
        },
      },
    };
    const file = createFile(JSON.stringify(exportData));
    const result = await importAttendanceJson(file);
    expect(result).not.toBeNull();
    expect(result!.months["2026-03"].days[0].tasks).toEqual(["作業A"]);
    expect(result!.months["2026-03"].days[0].breakMinutes).toBe(60);
  });
});
