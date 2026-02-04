/**
 * filter-sort.ts のユニットテスト
 */

import {
  applyFilters,
  applySort,
  computeDisplayIndices,
  toggleSort,
  displayToDataIndex,
  dataToDisplayIndex,
  INITIAL_SORT_STATE,
  type FilterState,
  type SortState,
} from "../filter-sort";
import type { CsvData } from "../types";

describe("applyFilters", () => {
  const rows = [
    ["Alice", "30", "Tokyo"],
    ["Bob", "25", "Osaka"],
    ["Charlie", "35", "Tokyo"],
    ["David", "40", "Nagoya"],
    ["Eve", "28", "Tokyo"],
  ];

  it("フィルターがない場合は全行を返す", () => {
    const filters: FilterState = new Map();
    const result = applyFilters(rows, filters);
    expect(result).toEqual([0, 1, 2, 3, 4]);
  });

  it("文字列フィルターで部分一致検索ができる", () => {
    const filters: FilterState = new Map([
      [2, { type: "string", value: "Tokyo" }],
    ]);
    const result = applyFilters(rows, filters);
    expect(result).toEqual([0, 2, 4]);
  });

  it("文字列フィルターは大文字小文字を区別しない", () => {
    const filters: FilterState = new Map([
      [0, { type: "string", value: "alice" }],
    ]);
    const result = applyFilters(rows, filters);
    expect(result).toEqual([0]);
  });

  it("数値フィルターで等しい条件が使える", () => {
    const filters: FilterState = new Map([
      [1, { type: "number", operator: "=", value: 30 }],
    ]);
    const result = applyFilters(rows, filters);
    expect(result).toEqual([0]);
  });

  it("数値フィルターで大なり条件が使える", () => {
    const filters: FilterState = new Map([
      [1, { type: "number", operator: ">", value: 30 }],
    ]);
    const result = applyFilters(rows, filters);
    expect(result).toEqual([2, 3]);
  });

  it("数値フィルターで小なり条件が使える", () => {
    const filters: FilterState = new Map([
      [1, { type: "number", operator: "<", value: 30 }],
    ]);
    const result = applyFilters(rows, filters);
    expect(result).toEqual([1, 4]);
  });

  it("数値フィルターで以上条件が使える", () => {
    const filters: FilterState = new Map([
      [1, { type: "number", operator: ">=", value: 30 }],
    ]);
    const result = applyFilters(rows, filters);
    expect(result).toEqual([0, 2, 3]);
  });

  it("数値フィルターで以下条件が使える", () => {
    const filters: FilterState = new Map([
      [1, { type: "number", operator: "<=", value: 30 }],
    ]);
    const result = applyFilters(rows, filters);
    expect(result).toEqual([0, 1, 4]);
  });

  it("数値フィルターで等しくない条件が使える", () => {
    const filters: FilterState = new Map([
      [1, { type: "number", operator: "!=", value: 30 }],
    ]);
    const result = applyFilters(rows, filters);
    expect(result).toEqual([1, 2, 3, 4]);
  });

  it("複数フィルターはAND条件で組み合わされる", () => {
    const filters: FilterState = new Map([
      [2, { type: "string", value: "Tokyo" }],
      [1, { type: "number", operator: ">", value: 29 }],
    ]);
    const result = applyFilters(rows, filters);
    expect(result).toEqual([0, 2]);
  });
});

describe("applySort", () => {
  const rows = [
    ["Alice", "30", "Tokyo"],
    ["Bob", "25", "Osaka"],
    ["Charlie", "35", "Tokyo"],
    ["David", "40", "Nagoya"],
    ["Eve", "28", "Tokyo"],
  ];

  const columnTypes: ("auto" | "string" | "number")[] = ["string", "number", "string"];

  it("ソートなしの場合は元のインデックスを返す", () => {
    const indices = [0, 1, 2, 3, 4];
    const sortState: SortState = { columnIndex: null, direction: null };
    const result = applySort(indices, rows, sortState, columnTypes);
    expect(result).toEqual([0, 1, 2, 3, 4]);
  });

  it("文字列列を昇順でソートできる", () => {
    const indices = [0, 1, 2, 3, 4];
    const sortState: SortState = { columnIndex: 0, direction: "asc" };
    const result = applySort(indices, rows, sortState, columnTypes);
    expect(result).toEqual([0, 1, 2, 3, 4]); // Alice, Bob, Charlie, David, Eve
  });

  it("文字列列を降順でソートできる", () => {
    const indices = [0, 1, 2, 3, 4];
    const sortState: SortState = { columnIndex: 0, direction: "desc" };
    const result = applySort(indices, rows, sortState, columnTypes);
    expect(result).toEqual([4, 3, 2, 1, 0]); // Eve, David, Charlie, Bob, Alice
  });

  it("数値列を昇順でソートできる", () => {
    const indices = [0, 1, 2, 3, 4];
    const sortState: SortState = { columnIndex: 1, direction: "asc" };
    const result = applySort(indices, rows, sortState, columnTypes);
    expect(result).toEqual([1, 4, 0, 2, 3]); // 25, 28, 30, 35, 40
  });

  it("数値列を降順でソートできる", () => {
    const indices = [0, 1, 2, 3, 4];
    const sortState: SortState = { columnIndex: 1, direction: "desc" };
    const result = applySort(indices, rows, sortState, columnTypes);
    expect(result).toEqual([3, 2, 0, 4, 1]); // 40, 35, 30, 28, 25
  });

  it("フィルター後のインデックスに対してソートできる", () => {
    const indices = [0, 2, 4]; // フィルターでTokyo行のみ
    const sortState: SortState = { columnIndex: 1, direction: "asc" };
    const result = applySort(indices, rows, sortState, columnTypes);
    expect(result).toEqual([4, 0, 2]); // 28 (Eve), 30 (Alice), 35 (Charlie)
  });

  it("空値は末尾に配置される", () => {
    const rowsWithEmpty = [
      ["Alice", "", "Tokyo"],
      ["Bob", "25", "Osaka"],
      ["Charlie", "35", ""],
    ];
    const indices = [0, 1, 2];
    const sortState: SortState = { columnIndex: 1, direction: "asc" };
    const result = applySort(indices, rowsWithEmpty, sortState, columnTypes);
    expect(result).toEqual([1, 2, 0]); // 25, 35, (empty)
  });
});

describe("computeDisplayIndices", () => {
  const csvData: CsvData = {
    headers: ["Name", "Age", "City"],
    rows: [
      ["Alice", "30", "Tokyo"],
      ["Bob", "25", "Osaka"],
      ["Charlie", "35", "Tokyo"],
    ],
    hasHeader: true,
    columnTypes: ["string", "number", "string"],
  };

  it("フィルターとソートを組み合わせて適用できる", () => {
    const filters: FilterState = new Map([
      [2, { type: "string", value: "Tokyo" }],
    ]);
    const sortState: SortState = { columnIndex: 1, direction: "desc" };
    const result = computeDisplayIndices(csvData, filters, sortState);
    expect(result).toEqual([2, 0]); // Charlie (35), Alice (30) - Tokyoのみ、Age降順
  });
});

describe("toggleSort", () => {
  it("別の列をクリックすると昇順になる", () => {
    const current: SortState = { columnIndex: 0, direction: "asc" };
    const result = toggleSort(current, 1);
    expect(result).toEqual({ columnIndex: 1, direction: "asc" });
  });

  it("同じ列のなしをクリックすると昇順になる", () => {
    const current: SortState = { columnIndex: 0, direction: null };
    const result = toggleSort(current, 0);
    expect(result).toEqual({ columnIndex: 0, direction: "asc" });
  });

  it("同じ列の昇順をクリックすると降順になる", () => {
    const current: SortState = { columnIndex: 0, direction: "asc" };
    const result = toggleSort(current, 0);
    expect(result).toEqual({ columnIndex: 0, direction: "desc" });
  });

  it("同じ列の降順をクリックするとなしになる", () => {
    const current: SortState = { columnIndex: 0, direction: "desc" };
    const result = toggleSort(current, 0);
    expect(result).toEqual({ columnIndex: null, direction: null });
  });
});

describe("displayToDataIndex / dataToDisplayIndex", () => {
  const displayRowIndices = [2, 0, 4]; // フィルター・ソート後のインデックス

  it("表示インデックスから元データインデックスに変換できる", () => {
    expect(displayToDataIndex(0, displayRowIndices)).toBe(2);
    expect(displayToDataIndex(1, displayRowIndices)).toBe(0);
    expect(displayToDataIndex(2, displayRowIndices)).toBe(4);
  });

  it("範囲外の表示インデックスは-1を返す", () => {
    expect(displayToDataIndex(3, displayRowIndices)).toBe(-1);
    expect(displayToDataIndex(-1, displayRowIndices)).toBe(-1);
  });

  it("元データインデックスから表示インデックスに変換できる", () => {
    expect(dataToDisplayIndex(2, displayRowIndices)).toBe(0);
    expect(dataToDisplayIndex(0, displayRowIndices)).toBe(1);
    expect(dataToDisplayIndex(4, displayRowIndices)).toBe(2);
  });

  it("表示されていないデータインデックスは-1を返す", () => {
    expect(dataToDisplayIndex(1, displayRowIndices)).toBe(-1);
    expect(dataToDisplayIndex(3, displayRowIndices)).toBe(-1);
  });
});

describe("INITIAL_SORT_STATE", () => {
  it("初期状態は columnIndex と direction が null", () => {
    expect(INITIAL_SORT_STATE).toEqual({
      columnIndex: null,
      direction: null,
    });
  });
});
