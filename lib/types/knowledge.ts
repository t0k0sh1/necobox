// ノウハウのコードスニペット
export interface CodeSnippet {
  labelEn: string;
  labelJa: string;
  code: string;
  noteEn?: string;
  noteJa?: string;
}

// ノウハウ項目
export interface KnowledgeItem {
  id: string;
  situationEn: string;
  situationJa: string;
  explanationEn: string;
  explanationJa: string;
  snippets: CodeSnippet[];
  hasRelatedCheatsheet?: boolean;
  tags: string[];
}

// ノウハウコンフィグ
export interface KnowledgeConfig {
  items: KnowledgeItem[];
  cheatsheetPath?: string; // デフォルト: "/cheatsheets"
}
