import type { KnowledgeItem } from "@/lib/types/knowledge";

// Java Stream APIノウハウデータ
export const JAVA_STREAM_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: "stream-basics",
    situationEn: "Basic stream transformations",
    situationJa: "ストリームの基本変換を知りたい",
    explanationEn:
      "Streams provide a declarative way to process collections. map() transforms elements, filter() selects elements, and sorted() orders them. Streams are lazy — intermediate operations only execute when a terminal operation is called.",
    explanationJa:
      "ストリームはコレクション処理の宣言的な方法を提供します。map() で変換、filter() で選択、sorted() でソートします。ストリームは遅延評価で、中間操作は終端操作が呼ばれた時にのみ実行されます。",
    snippets: [
      {
        labelEn: "filter + map",
        labelJa: "filter + map",
        code: "List<String> names = users.stream()\n    .filter(u -> u.getAge() >= 18)\n    .map(User::getName)\n    .collect(Collectors.toList());",
      },
      {
        labelEn: "sorted with Comparator",
        labelJa: "Comparatorでソート",
        code: "List<User> sorted = users.stream()\n    .sorted(Comparator.comparing(User::getName))\n    .collect(Collectors.toList());",
      },
      {
        labelEn: "distinct + limit",
        labelJa: "重複排除 + 件数制限",
        code: "List<String> top5 = items.stream()\n    .distinct()\n    .limit(5)\n    .collect(Collectors.toList());",
      },
    ],
    tags: ["map", "filter", "sorted", "Stream"],
  },
  {
    id: "stream-collect",
    situationEn: "Collecting and aggregating stream results",
    situationJa: "ストリームの結果を集約・コレクトしたい",
    explanationEn:
      "Terminal operations like collect(), reduce(), count(), and toList() (Java 16+) produce the final result. Collectors provides joining, counting, summarizing, and more.",
    explanationJa:
      "collect(), reduce(), count(), toList()（Java 16+）などの終端操作が最終結果を生成します。Collectors はjoining, counting, summarizing などを提供します。",
    snippets: [
      {
        labelEn: "toList (Java 16+)",
        labelJa: "toList（Java 16+）",
        code: "List<String> names = users.stream()\n    .map(User::getName)\n    .toList();",
        noteEn: "Returns an unmodifiable list. Use collect(Collectors.toList()) for mutable",
        noteJa: "変更不可リストを返す。変更可能にはcollect(Collectors.toList())を使用",
      },
      {
        labelEn: "joining strings",
        labelJa: "文字列の結合",
        code: "String csv = names.stream()\n    .collect(Collectors.joining(\", \"));",
      },
      {
        labelEn: "reduce for sum",
        labelJa: "reduceで合計",
        code: "int total = prices.stream()\n    .reduce(0, Integer::sum);",
      },
      {
        labelEn: "summarizing statistics",
        labelJa: "統計情報の集計",
        code: "IntSummaryStatistics stats = users.stream()\n    .collect(Collectors.summarizingInt(User::getAge));\n// stats.getAverage(), stats.getMax(), stats.getCount()",
      },
    ],
    tags: ["collect", "reduce", "toList", "count"],
  },
  {
    id: "stream-grouping",
    situationEn: "Grouping stream elements",
    situationJa: "ストリームでグループ化したい",
    explanationEn:
      "Collectors.groupingBy() groups elements by a classifier function. It can nest with downstream collectors for counting, summing, or further grouping. partitioningBy() splits into two groups by a predicate.",
    explanationJa:
      "Collectors.groupingBy() は分類関数で要素をグループ化します。ダウンストリームコレクタとネストしてカウント、合計、さらなるグループ化が可能です。partitioningBy() は述語で2グループに分割します。",
    snippets: [
      {
        labelEn: "Group by property",
        labelJa: "プロパティでグループ化",
        code: "Map<String, List<User>> byDept = users.stream()\n    .collect(Collectors.groupingBy(User::getDepartment));",
      },
      {
        labelEn: "Group and count",
        labelJa: "グループ化してカウント",
        code: "Map<String, Long> counts = users.stream()\n    .collect(Collectors.groupingBy(\n        User::getDepartment,\n        Collectors.counting()\n    ));",
      },
      {
        labelEn: "partitioningBy (true/false split)",
        labelJa: "partitioningBy（true/falseで分割）",
        code: "Map<Boolean, List<User>> partitioned = users.stream()\n    .collect(Collectors.partitioningBy(\n        u -> u.getAge() >= 18\n    ));",
        noteEn: "partitioned.get(true) = adults, partitioned.get(false) = minors",
        noteJa: "partitioned.get(true) = 成人, partitioned.get(false) = 未成年",
      },
    ],
    tags: ["groupingBy", "partitioningBy", "Collectors"],
  },
  {
    id: "stream-optional",
    situationEn: "Combining Optional with streams",
    situationJa: "Optional とストリームを組み合わせたい",
    explanationEn:
      "Optional avoids null checks. Use orElse() for defaults, orElseThrow() for required values. Since Java 9, Optional.stream() bridges Optional to Stream for flatMap composition.",
    explanationJa:
      "Optional はnullチェックを回避します。orElse() でデフォルト値、orElseThrow() で必須値に使います。Java 9以降、Optional.stream() でOptionalをStreamに変換し、flatMap合成が可能です。",
    snippets: [
      {
        labelEn: "findFirst with Optional",
        labelJa: "findFirst と Optional",
        code: "String name = users.stream()\n    .filter(u -> u.getId() == targetId)\n    .map(User::getName)\n    .findFirst()\n    .orElse(\"Unknown\");",
      },
      {
        labelEn: "orElseThrow for required values",
        labelJa: "orElseThrow で必須値",
        code: "User user = users.stream()\n    .filter(u -> u.getId() == id)\n    .findFirst()\n    .orElseThrow(() -> new NotFoundException(\"User not found\"));",
      },
      {
        labelEn: "Optional.stream() for flatMap (Java 9+)",
        labelJa: "Optional.stream() で flatMap（Java 9+）",
        code: "List<Address> addresses = users.stream()\n    .map(User::getAddress)  // Stream<Optional<Address>>\n    .flatMap(Optional::stream)\n    .collect(Collectors.toList());",
        noteEn: "Filters out empty Optionals automatically",
        noteJa: "空のOptionalを自動的に除外",
      },
    ],
    tags: ["Optional", "orElse", "stream", "flatMap"],
  },
  {
    id: "stream-flatmap",
    situationEn: "Flattening nested collections",
    situationJa: "ネストしたコレクションをフラットにしたい",
    explanationEn:
      "flatMap() transforms each element into a stream and flattens the results into a single stream. Essential when each element contains a collection you want to process as one sequence.",
    explanationJa:
      "flatMap() は各要素をストリームに変換し、結果を1つのストリームにフラット化します。各要素がコレクションを含み、それを1つのシーケンスとして処理したい場合に必須です。",
    snippets: [
      {
        labelEn: "Flatten nested lists",
        labelJa: "ネストしたリストをフラット化",
        code: "List<String> allTags = articles.stream()\n    .flatMap(a -> a.getTags().stream())\n    .distinct()\n    .collect(Collectors.toList());",
      },
      {
        labelEn: "Stream.of for multiple values",
        labelJa: "Stream.of で複数の値",
        code: "List<String> all = Stream.of(list1, list2, list3)\n    .flatMap(Collection::stream)\n    .collect(Collectors.toList());",
      },
      {
        labelEn: "flatMap with array",
        labelJa: "配列での flatMap",
        code: "String[] words = lines.stream()\n    .flatMap(line -> Arrays.stream(line.split(\"\\\\s+\")))\n    .toArray(String[]::new);",
      },
    ],
    tags: ["flatMap", "Stream.of"],
  },
  {
    id: "stream-tomap",
    situationEn: "Converting a stream to a Map",
    situationJa: "ストリームからMapに変換したい",
    explanationEn:
      "Collectors.toMap() converts a stream to a Map. You must handle duplicate keys with a merge function. toUnmodifiableMap() (Java 10+) returns an immutable map.",
    explanationJa:
      "Collectors.toMap() はストリームをMapに変換します。重複キーにはマージ関数での処理が必須です。toUnmodifiableMap()（Java 10+）は変更不可Mapを返します。",
    snippets: [
      {
        labelEn: "Basic toMap",
        labelJa: "基本的な toMap",
        code: "Map<Long, User> byId = users.stream()\n    .collect(Collectors.toMap(User::getId, u -> u));",
        noteEn: "Throws IllegalStateException on duplicate keys",
        noteJa: "重複キーがあると IllegalStateException が発生",
      },
      {
        labelEn: "toMap with merge function",
        labelJa: "マージ関数付き toMap",
        code: "Map<String, Integer> scores = entries.stream()\n    .collect(Collectors.toMap(\n        Entry::getName,\n        Entry::getScore,\n        Integer::sum  // マージ: 合計\n    ));",
      },
      {
        labelEn: "toUnmodifiableMap (Java 10+)",
        labelJa: "toUnmodifiableMap（Java 10+）",
        code: "Map<Long, String> nameById = users.stream()\n    .collect(Collectors.toUnmodifiableMap(\n        User::getId,\n        User::getName\n    ));",
      },
    ],
    tags: ["toMap", "toUnmodifiableMap", "merge"],
  },
  {
    id: "stream-debug",
    situationEn: "Debugging stream pipelines",
    situationJa: "ストリームの中間結果をデバッグしたい",
    explanationEn:
      "peek() lets you observe elements as they flow through the pipeline without modifying them. It's intended for debugging — avoid side effects in production code. Consider logging frameworks over System.out.",
    explanationJa:
      "peek() はパイプラインを流れる要素を変更せずに観察できます。デバッグ目的で使用し、本番コードでの副作用は避けてください。System.out よりロギングフレームワークの使用を検討してください。",
    snippets: [
      {
        labelEn: "peek for debugging",
        labelJa: "peek でデバッグ",
        code: "List<String> result = items.stream()\n    .filter(i -> i.getPrice() > 100)\n    .peek(i -> log.debug(\"after filter: {}\", i))\n    .map(Item::getName)\n    .peek(n -> log.debug(\"after map: {}\", n))\n    .collect(Collectors.toList());",
      },
      {
        labelEn: "Count elements at each stage",
        labelJa: "各ステージの要素数を確認",
        code: "long count = items.stream()\n    .peek(i -> System.out.println(\"before: \" + i))\n    .filter(i -> i.isActive())\n    .peek(i -> System.out.println(\"after filter: \" + i))\n    .count();",
        noteEn: "Remove peek calls before committing to production",
        noteJa: "本番コミット前にpeek呼び出しを削除する",
      },
      {
        labelEn: "forEach for final inspection",
        labelJa: "forEach で最終確認",
        code: "users.stream()\n    .filter(u -> u.getAge() > 30)\n    .forEach(u -> System.out.println(u.getName()));",
        noteEn: "forEach is a terminal operation — the stream cannot be reused after this",
        noteJa: "forEachは終端操作 — これ以降ストリームは再利用不可",
      },
    ],
    tags: ["peek", "forEach", "logging"],
  },
];
