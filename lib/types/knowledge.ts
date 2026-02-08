// プレースホルダーの説明
export interface PlaceholderDescription {
  descriptionEn: string;
  descriptionJa: string;
}

// ノウハウのコードスニペット
export interface CodeSnippet {
  labelEn: string;
  labelJa: string;
  code: string;
  noteEn?: string;
  noteJa?: string;
  placeholders?: Record<string, PlaceholderDescription>;
}

// ノウハウ項目
export interface KnowledgeItem {
  id: string;
  situationEn: string;
  situationJa: string;
  warningEn?: string;
  warningJa?: string;
  explanationEn: string;
  explanationJa: string;
  snippets: CodeSnippet[];
  tags: string[];
}

// ノウハウコンフィグ
export interface KnowledgeConfig {
  items: KnowledgeItem[];
}
