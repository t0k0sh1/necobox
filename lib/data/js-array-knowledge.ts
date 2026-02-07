import type { KnowledgeItem } from "@/lib/types/knowledge";

// JS/TS 配列メソッドノウハウデータ
export const JS_ARRAY_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: "array-filter",
    situationEn: "Extracting elements that match a condition",
    situationJa: "条件に合う要素だけ取り出したい",
    explanationEn:
      "filter() creates a new array with elements that pass a test. find() returns the first match (or undefined). findIndex() returns the index of the first match (or -1).",
    explanationJa:
      "filter() はテスト関数を通過した要素で新しい配列を作成します。find() は最初の一致要素を返し（なければundefined）、findIndex() は最初の一致のインデックスを返します（なければ-1）。",
    snippets: [
      {
        labelEn: "filter — keep matching elements",
        labelJa: "filter — 条件に合う要素を抽出",
        code: "const adults = users.filter(u => u.age >= 18);",
      },
      {
        labelEn: "find — get first match",
        labelJa: "find — 最初の一致を取得",
        code: "const admin = users.find(u => u.role === 'admin');",
        noteEn: "Returns undefined if no match found",
        noteJa: "一致がなければundefinedを返す",
      },
      {
        labelEn: "findIndex — get index of first match",
        labelJa: "findIndex — 最初の一致のインデックス",
        code: "const idx = items.findIndex(item => item.id === targetId);",
      },
      {
        labelEn: "Type guard with filter",
        labelJa: "型ガード付きfilter",
        code: "const strings = mixed.filter((x): x is string => typeof x === 'string');",
        noteEn: "TypeScript narrows the array type automatically",
        noteJa: "TypeScriptが配列の型を自動的に絞り込む",
      },
    ],
    tags: ["filter", "find", "findIndex"],
  },
  {
    id: "array-transform",
    situationEn: "Transforming each element in an array",
    situationJa: "配列の各要素を変換したい",
    explanationEn:
      "map() transforms each element and returns a new array of the same length. flatMap() maps then flattens one level — useful when each element maps to multiple results.",
    explanationJa:
      "map() は各要素を変換し、同じ長さの新しい配列を返します。flatMap() はマップ後に1段階フラット化します。各要素が複数の結果にマッピングされる場合に便利です。",
    snippets: [
      {
        labelEn: "map — transform each element",
        labelJa: "map — 各要素を変換",
        code: "const names = users.map(u => u.name);",
      },
      {
        labelEn: "map with index",
        labelJa: "map — インデックス付き",
        code: "const numbered = items.map((item, i) => `${i + 1}. ${item}`);",
      },
      {
        labelEn: "flatMap — map then flatten",
        labelJa: "flatMap — マップしてフラット化",
        code: "const words = sentences.flatMap(s => s.split(' '));",
        noteEn: "Equivalent to .map(fn).flat(1) but more efficient",
        noteJa: ".map(fn).flat(1) と同等だがより効率的",
      },
    ],
    tags: ["map", "flatMap"],
  },
  {
    id: "array-reduce",
    situationEn: "Folding an array into a single value",
    situationJa: "配列を1つの値に畳み込みたい",
    explanationEn:
      "reduce() iterates over elements, accumulating a result. Always provide an initial value to avoid errors on empty arrays. For simple sums, consider if map + filter is more readable.",
    explanationJa:
      "reduce() は要素を反復処理して結果を蓄積します。空配列でのエラーを避けるため、初期値を必ず指定してください。単純な合計にはmap + filterの方が可読性が高い場合があります。",
    snippets: [
      {
        labelEn: "Sum values",
        labelJa: "合計値を計算",
        code: "const total = prices.reduce((sum, p) => sum + p, 0);",
      },
      {
        labelEn: "Count occurrences",
        labelJa: "出現回数をカウント",
        code: "const counts = words.reduce<Record<string, number>>((acc, w) => {\n  acc[w] = (acc[w] ?? 0) + 1;\n  return acc;\n}, {});",
      },
      {
        labelEn: "Build object from array",
        labelJa: "配列からオブジェクトを構築",
        code: "const byId = users.reduce<Record<string, User>>((acc, u) => {\n  acc[u.id] = u;\n  return acc;\n}, {});",
        noteEn: "Consider Object.fromEntries(users.map(u => [u.id, u])) as alternative",
        noteJa: "代替: Object.fromEntries(users.map(u => [u.id, u]))",
      },
    ],
    tags: ["reduce", "accumulate"],
  },
  {
    id: "array-group",
    situationEn: "Grouping array elements",
    situationJa: "配列をグループ化したい",
    explanationEn:
      "Object.groupBy() (ES2024) groups elements by a key returned from a callback. For older environments, use reduce or Map. The result is a null-prototype object (no inherited properties).",
    explanationJa:
      "Object.groupBy()（ES2024）はコールバックから返されたキーで要素をグループ化します。古い環境では reduce や Map を使います。結果はnullプロトタイプオブジェクト（継承プロパティなし）です。",
    snippets: [
      {
        labelEn: "Object.groupBy (ES2024)",
        labelJa: "Object.groupBy（ES2024）",
        code: "const grouped = Object.groupBy(users, u => u.department);",
        noteEn: "Returns { department1: [...], department2: [...] }",
        noteJa: "{ department1: [...], department2: [...] } を返す",
      },
      {
        labelEn: "Map.groupBy (ES2024, preserves key type)",
        labelJa: "Map.groupBy（ES2024、キー型を保持）",
        code: "const grouped = Map.groupBy(items, item => item.category);",
      },
      {
        labelEn: "Fallback with reduce",
        labelJa: "reduce でのフォールバック",
        code: "const grouped = items.reduce<Record<string, Item[]>>((acc, item) => {\n  const key = item.category;\n  (acc[key] ??= []).push(item);\n  return acc;\n}, {});",
      },
    ],
    tags: ["groupBy", "Map", "Object.groupBy"],
  },
  {
    id: "array-sort",
    situationEn: "Sorting arrays (including immutable sorting)",
    situationJa: "配列をソートしたい（イミュータブル含む）",
    explanationEn:
      "sort() mutates the original array. toSorted() (ES2023) returns a new sorted array without mutation. Always provide a compare function for numbers to avoid lexicographic sorting.",
    explanationJa:
      "sort() は元の配列を変更します。toSorted()（ES2023）はミューテーションなしで新しいソート済み配列を返します。数値ソートでは辞書順ソートを避けるため、比較関数を必ず指定してください。",
    snippets: [
      {
        labelEn: "Sort numbers ascending",
        labelJa: "数値を昇順ソート",
        code: "const sorted = numbers.toSorted((a, b) => a - b);",
        noteEn: "toSorted() does not mutate the original array (ES2023)",
        noteJa: "toSorted() は元の配列を変更しない（ES2023）",
      },
      {
        labelEn: "Sort strings (locale-aware)",
        labelJa: "文字列をロケール対応ソート",
        code: "const sorted = names.toSorted((a, b) => a.localeCompare(b));",
      },
      {
        labelEn: "Sort objects by property",
        labelJa: "プロパティでオブジェクトをソート",
        code: "const sorted = users.toSorted((a, b) => a.age - b.age);",
      },
      {
        labelEn: "Sort in place (mutating)",
        labelJa: "インプレースソート（破壊的）",
        code: "items.sort((a, b) => a.name.localeCompare(b.name));",
        noteEn: "Mutates the original array. Use toSorted() if you need immutability",
        noteJa: "元の配列を変更する。イミュータブルが必要なら toSorted() を使用",
      },
    ],
    tags: ["sort", "toSorted", "localeCompare"],
  },
  {
    id: "array-unique",
    situationEn: "Removing duplicates from an array",
    situationJa: "配列の重複を排除したい",
    explanationEn:
      "For primitives, Set is the simplest and fastest. For objects, use filter with a seen Set, or Map/reduce keyed by a unique property.",
    explanationJa:
      "プリミティブ値にはSetが最もシンプルで高速です。オブジェクトにはfilterとSeenセット、またはユニークプロパティをキーにしたMap/reduceを使います。",
    snippets: [
      {
        labelEn: "Unique primitives with Set",
        labelJa: "Setでプリミティブ値の重複排除",
        code: "const unique = [...new Set(items)];",
      },
      {
        labelEn: "Unique objects by property",
        labelJa: "プロパティでオブジェクトの重複排除",
        code: "const unique = items.filter((item, i, arr) =>\n  arr.findIndex(x => x.id === item.id) === i\n);",
      },
      {
        labelEn: "Using Map for O(n) performance",
        labelJa: "MapでO(n)パフォーマンス",
        code: "const unique = [\n  ...new Map(items.map(item => [item.id, item])).values()\n];",
        noteEn: "Keeps the last occurrence of each duplicate",
        noteJa: "重複の最後の出現を保持",
      },
    ],
    tags: ["Set", "filter", "indexOf"],
  },
  {
    id: "array-check",
    situationEn: "Checking if elements exist in an array",
    situationJa: "配列に特定の要素が存在するか確認したい",
    explanationEn:
      "includes() checks for primitive values. some() tests if at least one element passes a condition. every() tests if all elements pass. These short-circuit for efficiency.",
    explanationJa:
      "includes() はプリミティブ値の存在確認に使います。some() は1つでも条件を満たす要素があるかテスト。every() は全要素が条件を満たすかテストします。どれも条件確定時に早期終了します。",
    snippets: [
      {
        labelEn: "includes — check primitive value",
        labelJa: "includes — プリミティブ値の確認",
        code: "const hasBanana = fruits.includes('banana');",
      },
      {
        labelEn: "some — at least one matches",
        labelJa: "some — 1つでも条件を満たすか",
        code: "const hasAdmin = users.some(u => u.role === 'admin');",
      },
      {
        labelEn: "every — all elements match",
        labelJa: "every — 全要素が条件を満たすか",
        code: "const allValid = inputs.every(i => i.trim().length > 0);",
      },
      {
        labelEn: "Negation pattern",
        labelJa: "否定パターン",
        code: "const hasNoErrors = !results.some(r => r.status === 'error');",
        noteEn: "Equivalent to results.every(r => r.status !== 'error')",
        noteJa: "results.every(r => r.status !== 'error') と同等",
      },
    ],
    tags: ["includes", "some", "every"],
  },
];
