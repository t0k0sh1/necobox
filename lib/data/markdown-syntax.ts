import { groupByCategory } from "./utils";

// Markdown構文のカテゴリ
export type MarkdownCategory =
  | "headings"
  | "emphasis"
  | "lists"
  | "links_images"
  | "code"
  | "tables"
  | "blockquotes"
  | "gfm_extensions";

// Markdown構文の型
export interface MarkdownSyntax {
  syntax: string;
  nameEn: string;
  nameJa: string;
  category: MarkdownCategory;
  descriptionEn: string;
  descriptionJa: string;
  markdownSource: string;
  renderedHtml: string;
}

// カテゴリの表示順
export const MARKDOWN_CATEGORY_ORDER: MarkdownCategory[] = [
  "headings",
  "emphasis",
  "lists",
  "links_images",
  "code",
  "tables",
  "blockquotes",
  "gfm_extensions",
];

// Markdown構文一覧
export const MARKDOWN_SYNTAXES: MarkdownSyntax[] = [
  // 見出し (headings)
  {
    syntax: "# Heading 1",
    nameEn: "Heading 1",
    nameJa: "見出し1",
    category: "headings",
    descriptionEn: "Creates a top-level heading.",
    descriptionJa: "最上位レベルの見出しを作成します。",
    markdownSource: "# Heading 1",
    renderedHtml: "<h1>Heading 1</h1>",
  },
  {
    syntax: "## Heading 2",
    nameEn: "Heading 2",
    nameJa: "見出し2",
    category: "headings",
    descriptionEn: "Creates a second-level heading.",
    descriptionJa: "第2レベルの見出しを作成します。",
    markdownSource: "## Heading 2",
    renderedHtml: "<h2>Heading 2</h2>",
  },
  {
    syntax: "### Heading 3",
    nameEn: "Heading 3",
    nameJa: "見出し3",
    category: "headings",
    descriptionEn: "Creates a third-level heading.",
    descriptionJa: "第3レベルの見出しを作成します。",
    markdownSource: "### Heading 3",
    renderedHtml: "<h3>Heading 3</h3>",
  },
  {
    syntax: "#### ~ ###### Heading 4-6",
    nameEn: "Heading 4-6",
    nameJa: "見出し4〜6",
    category: "headings",
    descriptionEn: "Creates headings of level 4 through 6.",
    descriptionJa: "レベル4から6の見出しを作成します。",
    markdownSource: "#### Heading 4\n##### Heading 5\n###### Heading 6",
    renderedHtml: "<h4>Heading 4</h4><h5>Heading 5</h5><h6>Heading 6</h6>",
  },

  // 強調 (emphasis)
  {
    syntax: "*italic* / _italic_",
    nameEn: "Italic",
    nameJa: "イタリック",
    category: "emphasis",
    descriptionEn: "Makes text italic.",
    descriptionJa: "テキストをイタリック体にします。",
    markdownSource: "*italic text*",
    renderedHtml: "<em>italic text</em>",
  },
  {
    syntax: "**bold** / __bold__",
    nameEn: "Bold",
    nameJa: "太字",
    category: "emphasis",
    descriptionEn: "Makes text bold.",
    descriptionJa: "テキストを太字にします。",
    markdownSource: "**bold text**",
    renderedHtml: "<strong>bold text</strong>",
  },
  {
    syntax: "***bold italic***",
    nameEn: "Bold Italic",
    nameJa: "太字イタリック",
    category: "emphasis",
    descriptionEn: "Makes text both bold and italic.",
    descriptionJa: "テキストを太字かつイタリック体にします。",
    markdownSource: "***bold italic text***",
    renderedHtml: "<strong><em>bold italic text</em></strong>",
  },
  {
    syntax: "~~strikethrough~~",
    nameEn: "Strikethrough",
    nameJa: "取り消し線",
    category: "emphasis",
    descriptionEn: "Adds a strikethrough to text.",
    descriptionJa: "テキストに取り消し線を追加します。",
    markdownSource: "~~deleted text~~",
    renderedHtml: "<del>deleted text</del>",
  },

  // リスト (lists)
  {
    syntax: "- item / * item",
    nameEn: "Unordered List",
    nameJa: "箇条書きリスト",
    category: "lists",
    descriptionEn: "Creates an unordered (bulleted) list.",
    descriptionJa: "箇条書き（番号なし）リストを作成します。",
    markdownSource: "- Item 1\n- Item 2\n  - Nested item\n- Item 3",
    renderedHtml: "<ul><li>Item 1</li><li>Item 2<ul><li>Nested item</li></ul></li><li>Item 3</li></ul>",
  },
  {
    syntax: "1. item",
    nameEn: "Ordered List",
    nameJa: "番号付きリスト",
    category: "lists",
    descriptionEn: "Creates an ordered (numbered) list.",
    descriptionJa: "番号付きリストを作成します。",
    markdownSource: "1. First item\n2. Second item\n3. Third item",
    renderedHtml: "<ol><li>First item</li><li>Second item</li><li>Third item</li></ol>",
  },
  {
    syntax: "- [ ] / - [x]",
    nameEn: "Task List",
    nameJa: "タスクリスト",
    category: "lists",
    descriptionEn: "Creates a task list with checkboxes.",
    descriptionJa: "チェックボックス付きのタスクリストを作成します。",
    markdownSource: "- [x] Completed task\n- [ ] Incomplete task\n- [ ] Another task",
    renderedHtml: "<ul><li><input type=\"checkbox\" checked disabled> Completed task</li><li><input type=\"checkbox\" disabled> Incomplete task</li><li><input type=\"checkbox\" disabled> Another task</li></ul>",
  },

  // リンク・画像 (links_images)
  {
    syntax: "[text](url)",
    nameEn: "Link",
    nameJa: "リンク",
    category: "links_images",
    descriptionEn: "Creates a hyperlink.",
    descriptionJa: "ハイパーリンクを作成します。",
    markdownSource: "[Example](https://example.com)",
    renderedHtml: "<a href=\"https://example.com\">Example</a>",
  },
  {
    syntax: "![alt](url)",
    nameEn: "Image",
    nameJa: "画像",
    category: "links_images",
    descriptionEn: "Embeds an image.",
    descriptionJa: "画像を埋め込みます。",
    markdownSource: "![Alt text](https://example.com/image.png)",
    renderedHtml: "<img src=\"https://example.com/image.png\" alt=\"Alt text\">",
  },
  {
    syntax: "[text](url \"title\")",
    nameEn: "Link with Title",
    nameJa: "タイトル付きリンク",
    category: "links_images",
    descriptionEn: "Creates a hyperlink with a tooltip title.",
    descriptionJa: "ツールチップタイトル付きのハイパーリンクを作成します。",
    markdownSource: "[Example](https://example.com \"Tooltip\")",
    renderedHtml: "<a href=\"https://example.com\" title=\"Tooltip\">Example</a>",
  },
  {
    syntax: "<url>",
    nameEn: "Auto Link",
    nameJa: "自動リンク",
    category: "links_images",
    descriptionEn: "Automatically converts a URL into a clickable link.",
    descriptionJa: "URLを自動的にクリック可能なリンクに変換します。",
    markdownSource: "<https://example.com>",
    renderedHtml: "<a href=\"https://example.com\">https://example.com</a>",
  },

  // コード (code)
  {
    syntax: "`inline code`",
    nameEn: "Inline Code",
    nameJa: "インラインコード",
    category: "code",
    descriptionEn: "Formats text as inline code.",
    descriptionJa: "テキストをインラインコードとしてフォーマットします。",
    markdownSource: "Use `console.log()` to debug",
    renderedHtml: "Use <code>console.log()</code> to debug",
  },
  {
    syntax: "```language\\ncode\\n```",
    nameEn: "Code Block",
    nameJa: "コードブロック",
    category: "code",
    descriptionEn: "Creates a fenced code block with optional syntax highlighting.",
    descriptionJa: "オプションのシンタックスハイライト付きコードブロックを作成します。",
    markdownSource: "```javascript\nconst x = 42;\nconsole.log(x);\n```",
    renderedHtml: "<pre><code class=\"language-javascript\">const x = 42;\nconsole.log(x);</code></pre>",
  },

  // テーブル (tables)
  {
    syntax: "| col | col |",
    nameEn: "Table",
    nameJa: "テーブル",
    category: "tables",
    descriptionEn: "Creates a table with headers and rows.",
    descriptionJa: "ヘッダーと行を持つテーブルを作成します。",
    markdownSource: "| Name | Age |\n|------|-----|\n| Alice | 30 |\n| Bob | 25 |",
    renderedHtml: "<table><thead><tr><th>Name</th><th>Age</th></tr></thead><tbody><tr><td>Alice</td><td>30</td></tr><tr><td>Bob</td><td>25</td></tr></tbody></table>",
  },
  {
    syntax: ":--- / :---: / ---:",
    nameEn: "Table Alignment",
    nameJa: "テーブルの配置",
    category: "tables",
    descriptionEn: "Align table columns left, center, or right.",
    descriptionJa: "テーブルの列を左、中央、右に揃えます。",
    markdownSource: "| Left | Center | Right |\n|:-----|:------:|------:|\n| L    |   C    |     R |",
    renderedHtml: "<table><thead><tr><th style=\"text-align:left\">Left</th><th style=\"text-align:center\">Center</th><th style=\"text-align:right\">Right</th></tr></thead><tbody><tr><td style=\"text-align:left\">L</td><td style=\"text-align:center\">C</td><td style=\"text-align:right\">R</td></tr></tbody></table>",
  },

  // 引用 (blockquotes)
  {
    syntax: "> quote",
    nameEn: "Blockquote",
    nameJa: "引用",
    category: "blockquotes",
    descriptionEn: "Creates a blockquote.",
    descriptionJa: "引用ブロックを作成します。",
    markdownSource: "> This is a blockquote.\n>\n> It can span multiple lines.",
    renderedHtml: "<blockquote><p>This is a blockquote.</p><p>It can span multiple lines.</p></blockquote>",
  },
  {
    syntax: "---",
    nameEn: "Horizontal Rule",
    nameJa: "水平線",
    category: "blockquotes",
    descriptionEn: "Creates a horizontal rule (thematic break).",
    descriptionJa: "水平線（テーマの区切り）を作成します。",
    markdownSource: "---",
    renderedHtml: "<hr>",
  },

  // GFM拡張 (gfm_extensions)
  {
    syntax: "Footnote[^1]",
    nameEn: "Footnote",
    nameJa: "脚注",
    category: "gfm_extensions",
    descriptionEn: "Adds a footnote reference and definition.",
    descriptionJa: "脚注の参照と定義を追加します。",
    markdownSource: "Text with footnote[^1].\n\n[^1]: Footnote definition.",
    renderedHtml: "<p>Text with footnote<sup>1</sup>.</p><p><small>1. Footnote definition.</small></p>",
  },
  {
    syntax: "> [!NOTE]",
    nameEn: "GitHub Alerts",
    nameJa: "GitHubアラート",
    category: "gfm_extensions",
    descriptionEn: "Creates styled alert boxes (NOTE, TIP, IMPORTANT, WARNING, CAUTION).",
    descriptionJa: "スタイル付きアラートボックスを作成します（NOTE, TIP, IMPORTANT, WARNING, CAUTION）。",
    markdownSource: "> [!NOTE]\n> This is a note alert.\n\n> [!WARNING]\n> This is a warning alert.",
    renderedHtml: "<blockquote><p><strong>Note</strong></p><p>This is a note alert.</p></blockquote><blockquote><p><strong>Warning</strong></p><p>This is a warning alert.</p></blockquote>",
  },
  {
    syntax: "```mermaid",
    nameEn: "Mermaid Diagrams",
    nameJa: "Mermaidダイアグラム",
    category: "gfm_extensions",
    descriptionEn: "Embed diagrams using Mermaid syntax (supported by GitHub).",
    descriptionJa: "Mermaid構文を使ってダイアグラムを埋め込みます（GitHub対応）。",
    markdownSource: "```mermaid\ngraph LR\n  A --> B\n  B --> C\n```",
    renderedHtml: "<pre><code>graph LR\n  A --&gt; B\n  B --&gt; C</code></pre>",
  },
  {
    syntax: "$math$ / $$math$$",
    nameEn: "Math (LaTeX)",
    nameJa: "数式（LaTeX）",
    category: "gfm_extensions",
    descriptionEn: "Render mathematical expressions using LaTeX syntax (supported by GitHub).",
    descriptionJa: "LaTeX構文で数式をレンダリングします（GitHub対応）。",
    markdownSource: "Inline: $E = mc^2$\n\nBlock:\n$$\n\\sum_{i=1}^{n} x_i\n$$",
    renderedHtml: "<p>Inline: <code>E = mc²</code></p><p>Block:</p><pre><code>∑(i=1 to n) xᵢ</code></pre>",
  },
];

// カテゴリごとにグループ化
export function getMarkdownSyntaxByCategory(): Map<MarkdownCategory, MarkdownSyntax[]> {
  return groupByCategory(MARKDOWN_SYNTAXES, MARKDOWN_CATEGORY_ORDER);
}
