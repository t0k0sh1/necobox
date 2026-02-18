/**
 * ドメインモデリングツール - 型定義・定数・ユーティリティ
 */

import { nanoid } from "nanoid";

// ============================================================
// 型定義
// ============================================================

/** フロー内のノート */
export interface FlowNote {
  id: string;
  text: string;
}

/** スロット種別 */
export type SlotType =
  | "views"
  | "actors"
  | "commands"
  | "aggregates"
  | "events"
  | "externalSystems"
  | "policies";

/** フロー: 横一列の付箋ストリップ */
export interface EventFlow {
  id: string;
  position: { x: number; y: number };
  slots: {
    views: FlowNote[];
    actors: FlowNote[];
    commands: FlowNote[];
    aggregates: FlowNote[];
    events: FlowNote[];
    externalSystems: FlowNote[];
    policies: FlowNote[];
  };
  createdAt: string;
}

/** 境界づけられたコンテキスト */
export interface BoundedContext {
  id: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

/** ドメイン種別 */
export type DomainType = "core" | "supporting" | "generic";

/** ドメイン */
export interface Domain {
  id: string;
  name: string;
  type: DomainType;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

/** コンテキストマッピングパターン */
export type ContextMappingPattern =
  | "partnership"
  | "sharedKernel"
  | "customerSupplier"
  | "conformist"
  | "acl"
  | "ohsPl";

/** コンテキストマッピングカテゴリ */
export type ContextMappingCategory =
  | "collaboration"
  | "customerSupplier"
  | "protectionTranslation";

/** 接続方向 */
export type ConnectionDirection = "right" | "left" | "down" | "up";

/** フロー間の矢印 */
export interface FlowConnection {
  id: string;
  fromFlowId: string;
  toFlowId: string;
  label?: string;
  pattern?: ContextMappingPattern;
}

/** ホットスポット（吹き出し型注釈） */
export interface Hotspot {
  id: string;
  text: string;
  position: { x: number; y: number };
}

/** キャンバスのビューポート状態 */
export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

/** ボード全体の状態 */
export interface DomainModelingBoard {
  id: string;
  name: string;
  flows: EventFlow[];
  contexts: BoundedContext[];
  domains: Domain[];
  connections: FlowConnection[];
  hotspots: Hotspot[];
  viewport: CanvasViewport;
  bmc?: BmcBoard;
  exampleMapping?: ExampleMappingBoard;
  createdAt: string;
  updatedAt: string;
}

/** エクスポートフォーマット */
export interface ExportData {
  version: 1 | 2;
  board: DomainModelingBoard;
  exportedAt: string;
}

// ============================================================
// BMC（ビジネスモデルキャンバス）型定義
// ============================================================

/** BMCの9ブロック種別 */
export type BmcBlockType =
  | "keyPartners"
  | "keyActivities"
  | "keyResources"
  | "valuePropositions"
  | "customerRelationships"
  | "channels"
  | "customerSegments"
  | "costStructure"
  | "revenueStreams";

/** BMC付箋 */
export interface BmcNote {
  id: string;
  text: string;
  blockType: BmcBlockType;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

/** BMCボード全体 */
export interface BmcBoard {
  notes: BmcNote[];
  layoutScale?: number;
}

/** 旧形式のBMCボード（マイグレーション用） */
export interface LegacyBmcBoard {
  blocks: Record<BmcBlockType, { id: string; text: string }[]>;
}

// ============================================================
// 実例マッピング（Example Mapping）型定義
// ============================================================

/** 実例マッピングのカード */
export interface ExampleMappingNote {
  id: string;
  text: string;
}

/** ルール列（ルール1つ + 配下の具体例群） */
export interface ExampleMappingRule {
  id: string;
  text: string;
  examples: ExampleMappingNote[];
}

/** 実例マッピングボード */
export interface ExampleMappingBoard {
  story: ExampleMappingNote;
  rules: ExampleMappingRule[];
  questions: ExampleMappingNote[];
}

// ============================================================
// ユーザーストーリーマッピング型定義
// ============================================================

/** ストーリーポイント（フィボナッチ数列） */
export type StoryPoint = 1 | 2 | 3 | 5 | 8 | 13 | 21;
export const STORY_POINTS: StoryPoint[] = [1, 2, 3, 5, 8, 13, 21];

/** タスク列幅の定数 */
export const DEFAULT_TASK_COLUMN_WIDTH = 160;
export const MIN_TASK_COLUMN_WIDTH = 120;
export const MAX_TASK_COLUMN_WIDTH = 400;

/** ストーリーマッピングのストーリーノート */
export interface StoryMappingNote {
  id: string;
  text: string;
  releaseId: string;
  memo?: string;
  storyPoints?: StoryPoint;
}

/** ストーリーマッピングのタスク */
export interface StoryMappingTask {
  id: string;
  text: string;
  stories: StoryMappingNote[];
  memo?: string;
}

/** ストーリーマッピングのアクティビティ */
export interface StoryMappingActivity {
  id: string;
  text: string;
  tasks: StoryMappingTask[];
  memo?: string;
}

/** ストーリーマッピングのリリース */
export interface StoryMappingRelease {
  id: string;
  name: string;
}

/** ストーリーマッピングボード */
export interface StoryMappingBoard {
  activities: StoryMappingActivity[];
  releases: StoryMappingRelease[];
  taskColumnWidths?: Record<string, number>;
}

/** ツールバーモード */
export type ToolMode =
  | "select"
  | "addFlow"
  | "addContext"
  | "addDomain"
  | "addConnection"
  | "addHotspot";

// ============================================================
// 定数
// ============================================================

/** 付箋の色（イベントストーミング標準） */
export const SLOT_COLORS: Record<SlotType | "hotspot", { bg: string; text: string }> = {
  events: { bg: "#FF8C00", text: "#000000" },
  commands: { bg: "#4A90D9", text: "#FFFFFF" },
  aggregates: { bg: "#FFD700", text: "#000000" },
  actors: { bg: "#FFEC8B", text: "#000000" },
  policies: { bg: "#C8A2C8", text: "#000000" },
  views: { bg: "#90EE90", text: "#000000" },
  externalSystems: { bg: "#FFB6C1", text: "#000000" },
  hotspot: { bg: "#FF4444", text: "#FFFFFF" },
};

/** スロットの表示順序（左→右） */
export const SLOT_ORDER: SlotType[] = [
  "views",
  "actors",
  "commands",
  "aggregates",
  "externalSystems",
  "events",
];

/** セルサイズ（全スロット共通） */
export const CELL_SIZE = { width: 140, height: 90 };

/** ズーム範囲 */
export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 2.0;
export const ZOOM_STEP = 0.1;

/** コンテキストマッピングパターン → カテゴリのマッピング */
export const CONTEXT_MAPPING_PATTERN_TO_CATEGORY: Record<ContextMappingPattern, ContextMappingCategory> = {
  partnership: "collaboration",
  sharedKernel: "collaboration",
  customerSupplier: "customerSupplier",
  conformist: "customerSupplier",
  acl: "protectionTranslation",
  ohsPl: "protectionTranslation",
};

/** コンテキストマッピングパターンの略称 */
export const CONTEXT_MAPPING_PATTERN_ABBR: Record<ContextMappingPattern, string> = {
  partnership: "PRT",
  sharedKernel: "SK",
  customerSupplier: "C/S",
  conformist: "CF",
  acl: "ACL",
  ohsPl: "OHS",
};

/** コンテキストマッピングカテゴリの色 */
export const CONTEXT_MAPPING_CATEGORY_COLORS: Record<ContextMappingCategory, string> = {
  collaboration: "#14b8a6",
  customerSupplier: "#3b82f6",
  protectionTranslation: "#f97316",
};

/** ドメイン種別のラベル色 */
export const DOMAIN_TYPE_COLORS: Record<DomainType, string> = {
  core: "#E74C3C",
  supporting: "#3498DB",
  generic: "#95A5A6",
};

/** コンテキスト矩形のデフォルトサイズ */
export const DEFAULT_CONTEXT_SIZE = { width: 500, height: 300 };
/** ドメイン矩形のデフォルトサイズ */
export const DEFAULT_DOMAIN_SIZE = { width: 700, height: 450 };

/** BMCブロックの表示順序 */
export const BMC_BLOCK_ORDER: BmcBlockType[] = [
  "keyPartners",
  "keyActivities",
  "keyResources",
  "valuePropositions",
  "customerRelationships",
  "channels",
  "customerSegments",
  "costStructure",
  "revenueStreams",
];

/** 実例マッピングのカード色 */
export const EXAMPLE_MAPPING_COLORS = {
  story:    { bg: "#FEF3C7", header: "#D97706" },
  rule:     { bg: "#DBEAFE", header: "#2563EB" },
  example:  { bg: "#D1FAE5", header: "#059669" },
  question: { bg: "#FCE7F3", header: "#DB2777" },
} as const;

/** ストーリーマッピングの色 */
export const STORY_MAPPING_COLORS = {
  activity: { bg: "#EDE9FE", header: "#7C3AED" },
  task:     { bg: "#DBEAFE", header: "#2563EB" },
  story:    { bg: "#FEF9C3", text: "#713F12" },
  release:  { bg: "#FEE2E2", border: "#EF4444" },
} as const;

/** BMCブロックのキャンバス座標レイアウト */
export const BMC_BLOCK_LAYOUT: Record<BmcBlockType, { x: number; y: number; width: number; height: number }> = {
  keyPartners:           { x: 0,    y: 0,   width: 240, height: 400 },
  keyActivities:         { x: 240,  y: 0,   width: 240, height: 200 },
  keyResources:          { x: 240,  y: 200, width: 240, height: 200 },
  valuePropositions:     { x: 480,  y: 0,   width: 240, height: 400 },
  customerRelationships: { x: 720,  y: 0,   width: 240, height: 200 },
  channels:              { x: 720,  y: 200, width: 240, height: 200 },
  customerSegments:      { x: 960,  y: 0,   width: 240, height: 400 },
  costStructure:         { x: 0,    y: 400, width: 600, height: 200 },
  revenueStreams:        { x: 600,  y: 400, width: 600, height: 200 },
};

/** BMCレイアウトのベースサイズ（スケール1.0時の右下座標） */
export const BMC_LAYOUT_BASE_WIDTH = 1200;
export const BMC_LAYOUT_BASE_HEIGHT = 600;

/** BMCレイアウトスケールの範囲 */
export const BMC_LAYOUT_SCALE_MIN = 0.5;
export const BMC_LAYOUT_SCALE_MAX = 3.0;

/** スケール適用済みのブロックレイアウトを取得 */
export function getScaledBlockLayout(
  blockType: BmcBlockType,
  scale: number
): { x: number; y: number; width: number; height: number } {
  const base = BMC_BLOCK_LAYOUT[blockType];
  return {
    x: base.x * scale,
    y: base.y * scale,
    width: base.width * scale,
    height: base.height * scale,
  };
}

/** BMC付箋のデフォルトサイズ */
export const BMC_NOTE_DEFAULT_SIZE = { width: 120, height: 80 };

/** BMC付箋の最小サイズ */
export const BMC_NOTE_MIN_SIZE = { width: 80, height: 50 };

/** BMCブロックヘッダーの高さ */
export const BMC_BLOCK_HEADER_HEIGHT = 28;

/** BMCブロックの色（背景・ヘッダー） */
export const BMC_BLOCK_COLORS: Record<BmcBlockType, { bg: string; header: string }> = {
  keyPartners:           { bg: "#EDE9FE", header: "#7C3AED" },
  keyActivities:         { bg: "#DBEAFE", header: "#2563EB" },
  keyResources:          { bg: "#DBEAFE", header: "#2563EB" },
  valuePropositions:     { bg: "#FEF3C7", header: "#D97706" },
  customerRelationships: { bg: "#D1FAE5", header: "#059669" },
  channels:              { bg: "#D1FAE5", header: "#059669" },
  customerSegments:      { bg: "#FCE7F3", header: "#DB2777" },
  costStructure:         { bg: "#F3F4F6", header: "#4B5563" },
  revenueStreams:        { bg: "#FEE2E2", header: "#DC2626" },
};

// ============================================================
// ユーティリティ関数
// ============================================================

/** ID生成 */
export function generateId(): string {
  return nanoid(10);
}

/** 空のBMCボードを生成 */
export function createEmptyBmcBoard(): BmcBoard {
  return { notes: [] };
}

/** 中心座標からBMCブロック所属を判定 */
export function detectBmcBlock(centerX: number, centerY: number, scale = 1): BmcBlockType {
  for (const blockType of BMC_BLOCK_ORDER) {
    const layout = getScaledBlockLayout(blockType, scale);
    if (
      centerX >= layout.x &&
      centerX < layout.x + layout.width &&
      centerY >= layout.y &&
      centerY < layout.y + layout.height
    ) {
      return blockType;
    }
  }
  // 範囲外の場合、最も近いブロックを返す
  let minDist = Infinity;
  let nearest: BmcBlockType = "valuePropositions";
  for (const blockType of BMC_BLOCK_ORDER) {
    const layout = getScaledBlockLayout(blockType, scale);
    const cx = layout.x + layout.width / 2;
    const cy = layout.y + layout.height / 2;
    const dist = Math.hypot(centerX - cx, centerY - cy);
    if (dist < minDist) {
      minDist = dist;
      nearest = blockType;
    }
  }
  return nearest;
}

/** ブロック内の空き位置を計算 */
export function findBmcNotePosition(
  blockType: BmcBlockType,
  existingNotes: BmcNote[],
  scale = 1
): { x: number; y: number } {
  const layout = getScaledBlockLayout(blockType, scale);
  const blockNotes = existingNotes.filter((n) => n.blockType === blockType);
  const padding = 8;
  const headerH = BMC_BLOCK_HEADER_HEIGHT * scale;
  const startX = layout.x + padding;
  const startY = layout.y + headerH + padding;
  const cols = Math.floor((layout.width - padding * 2) / (BMC_NOTE_DEFAULT_SIZE.width + padding));
  const maxCols = Math.max(1, cols);
  const idx = blockNotes.length;
  const col = idx % maxCols;
  const row = Math.floor(idx / maxCols);
  return {
    x: startX + col * (BMC_NOTE_DEFAULT_SIZE.width + padding),
    y: startY + row * (BMC_NOTE_DEFAULT_SIZE.height + padding),
  };
}

/** BMC付箋を生成（ブロック所属・位置計算付き） */
export function createBmcNote(
  blockType: BmcBlockType,
  existingNotes: BmcNote[],
  text = "",
  scale = 1
): BmcNote {
  const position = findBmcNotePosition(blockType, existingNotes, scale);
  return {
    id: generateId(),
    text,
    blockType,
    position,
    size: { ...BMC_NOTE_DEFAULT_SIZE },
  };
}

/** 旧形式のBMCボードかどうかを判定 */
export function isLegacyBmcBoard(bmc: unknown): bmc is LegacyBmcBoard {
  if (typeof bmc !== "object" || bmc === null) return false;
  const obj = bmc as Record<string, unknown>;
  return "blocks" in obj && typeof obj.blocks === "object" && !("notes" in obj);
}

/** 旧blocks形式 → 新notes配列形式へのマイグレーション */
export function migrateBmcBoard(legacy: LegacyBmcBoard): BmcBoard {
  const notes: BmcNote[] = [];
  for (const blockType of BMC_BLOCK_ORDER) {
    const legacyNotes = legacy.blocks[blockType] ?? [];
    for (const legacyNote of legacyNotes) {
      const position = findBmcNotePosition(blockType, notes);
      notes.push({
        id: legacyNote.id,
        text: legacyNote.text,
        blockType,
        position,
        size: { ...BMC_NOTE_DEFAULT_SIZE },
      });
    }
  }
  return { notes };
}

/** 空の実例マッピングボードを生成 */
export function createEmptyExampleMappingBoard(): ExampleMappingBoard {
  return {
    story: { id: generateId(), text: "" },
    rules: [],
    questions: [],
  };
}

/** 実例マッピングのノートを生成 */
export function createExampleMappingNote(text = ""): ExampleMappingNote {
  return { id: generateId(), text };
}

/** 実例マッピングのルール列を生成 */
export function createExampleMappingRule(text = ""): ExampleMappingRule {
  return { id: generateId(), text, examples: [] };
}

/** 空のストーリーマッピングボードを生成 */
export function createEmptyStoryMappingBoard(): StoryMappingBoard {
  return {
    activities: [],
    releases: [],
  };
}

/** ストーリーマッピングのアクティビティを生成 */
export function createStoryMappingActivity(text = ""): StoryMappingActivity {
  return { id: generateId(), text, tasks: [] };
}

/** ストーリーマッピングのタスクを生成 */
export function createStoryMappingTask(text = ""): StoryMappingTask {
  return { id: generateId(), text, stories: [] };
}

/** ストーリーマッピングのストーリーノートを生成 */
export function createStoryMappingNote(text = "", releaseId = ""): StoryMappingNote {
  return { id: generateId(), text, releaseId };
}

/** ストーリーマッピングのリリースを生成 */
export function createStoryMappingRelease(name: string): StoryMappingRelease {
  return { id: generateId(), name };
}

/** 空のボードを生成 */
export function createEmptyBoard(name = "Untitled"): DomainModelingBoard {
  return {
    id: generateId(),
    name,
    flows: [],
    contexts: [],
    domains: [],
    connections: [],
    hotspots: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    bmc: createEmptyBmcBoard(),
    exampleMapping: createEmptyExampleMappingBoard(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** 空のフローを生成（ドメインイベント1つから開始） */
export function createEmptyFlow(x: number, y: number): EventFlow {
  return {
    id: generateId(),
    position: { x, y },
    slots: {
      views: [],
      actors: [],
      commands: [],
      aggregates: [],
      events: [{ id: generateId(), text: "" }],
      externalSystems: [],
      policies: [],
    },
    createdAt: new Date().toISOString(),
  };
}

/** フローノートを生成 */
export function createFlowNote(text = ""): FlowNote {
  return { id: generateId(), text };
}

/** 境界づけられたコンテキストを生成 */
export function createBoundedContext(
  x: number,
  y: number,
  width = DEFAULT_CONTEXT_SIZE.width,
  height = DEFAULT_CONTEXT_SIZE.height
): BoundedContext {
  return {
    id: generateId(),
    name: "",
    position: { x, y },
    size: { width, height },
  };
}

/** ドメインを生成 */
export function createDomain(
  x: number,
  y: number,
  width = DEFAULT_DOMAIN_SIZE.width,
  height = DEFAULT_DOMAIN_SIZE.height,
  type: DomainType = "core"
): Domain {
  return {
    id: generateId(),
    name: "",
    type,
    position: { x, y },
    size: { width, height },
  };
}

/** ホットスポットを生成 */
export function createHotspot(x: number, y: number): Hotspot {
  return {
    id: generateId(),
    text: "",
    position: { x, y },
  };
}

/** フロー接続を生成 */
export function createFlowConnection(
  fromFlowId: string,
  toFlowId: string
): FlowConnection {
  return {
    id: generateId(),
    fromFlowId,
    toFlowId,
  };
}

/** クライアント座標をキャンバス座標に変換 */
export function clientToCanvas(
  clientX: number,
  clientY: number,
  viewport: CanvasViewport,
  containerRect: DOMRect
): { x: number; y: number } {
  return {
    x: (clientX - containerRect.left - viewport.x) / viewport.zoom,
    y: (clientY - containerRect.top - viewport.y) / viewport.zoom,
  };
}

/** フローの描画幅を計算 */
export function getFlowWidth(flow: EventFlow): number {
  let width = 0;
  for (const slot of SLOT_ORDER) {
    if (flow.slots[slot].length > 0) {
      width += CELL_SIZE.width;
    }
  }
  // 空のスロットでも最低限 events は表示
  return Math.max(width, CELL_SIZE.width);
}

/** フローの描画高さを計算 */
export function getFlowHeight(flow: EventFlow): number {
  let maxH = CELL_SIZE.height;
  for (const slot of SLOT_ORDER) {
    const notes = flow.slots[slot];
    if (notes.length > 1) {
      maxH = Math.max(maxH, notes.length * CELL_SIZE.height);
    }
  }
  // ポリシーがある場合は下に追加
  if (flow.slots.policies.length > 0) {
    maxH += CELL_SIZE.height * 0.6;
  }
  return maxH;
}

/** フローの中心座標を取得 */
export function getFlowCenter(flow: EventFlow): { x: number; y: number } {
  const w = getFlowWidth(flow);
  const h = getFlowHeight(flow);
  return {
    x: flow.position.x + w / 2,
    y: flow.position.y + h / 2,
  };
}

/** 2つのフローの相対位置から接続方向を決定する */
export function getConnectionDirection(fromFlow: EventFlow, toFlow: EventFlow): ConnectionDirection {
  const from = getFlowCenter(fromFlow);
  const to = getFlowCenter(toFlow);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  } else {
    return dy >= 0 ? "down" : "up";
  }
}

/** フローの出口座標（指定方向の面の中央）を返す */
export function getFlowExitPoint(flow: EventFlow, direction: ConnectionDirection): { x: number; y: number } {
  const w = getFlowWidth(flow);
  const h = getFlowHeight(flow);
  const cx = flow.position.x + w / 2;
  const cy = flow.position.y + h / 2;
  switch (direction) {
    case "right": return { x: flow.position.x + w, y: cy };
    case "left":  return { x: flow.position.x, y: cy };
    case "down":  return { x: cx, y: flow.position.y + h };
    case "up":    return { x: cx, y: flow.position.y };
  }
}

/** フローの入口座標（出口の反対側の面の中央）を返す */
export function getFlowEntryPoint(flow: EventFlow, direction: ConnectionDirection): { x: number; y: number } {
  const w = getFlowWidth(flow);
  const h = getFlowHeight(flow);
  const cx = flow.position.x + w / 2;
  const cy = flow.position.y + h / 2;
  switch (direction) {
    case "right": return { x: flow.position.x, y: cy };
    case "left":  return { x: flow.position.x + w, y: cy };
    case "down":  return { x: cx, y: flow.position.y };
    case "up":    return { x: cx, y: flow.position.y + h };
  }
}

/** マンハッタンルーティングのSVGパス文字列を生成する */
export function buildManhattanPath(
  exit: { x: number; y: number },
  entry: { x: number; y: number },
  direction: ConnectionDirection
): string {
  if (direction === "right" || direction === "left") {
    // 水平→垂直→水平
    const midX = (exit.x + entry.x) / 2;
    return `M ${exit.x} ${exit.y} L ${midX} ${exit.y} L ${midX} ${entry.y} L ${entry.x} ${entry.y}`;
  } else {
    // 垂直→水平→垂直
    const midY = (exit.y + entry.y) / 2;
    return `M ${exit.x} ${exit.y} L ${exit.x} ${midY} L ${entry.x} ${midY} L ${entry.x} ${entry.y}`;
  }
}

/** パスの中点座標を返す（バッジ・ポップアップ位置計算用） */
export function getMidpointOfPath(
  exit: { x: number; y: number },
  entry: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: (exit.x + entry.x) / 2,
    y: (exit.y + entry.y) / 2,
  };
}

/** 配列の各要素が id: string を持つことを検証 */
function hasStringIdArray(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.every((item) => {
    if (typeof item !== "object" || item === null) return false;
    const rec = item as Record<string, unknown>;
    return typeof rec.id === "string";
  });
}

/** エクスポートデータのバリデーション */
export function validateExportData(data: unknown): data is ExportData {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  if (d.version !== 1 && d.version !== 2) return false;
  if (typeof d.board !== "object" || d.board === null) return false;
  const board = d.board as Record<string, unknown>;
  return (
    typeof board.id === "string" &&
    typeof board.name === "string" &&
    hasStringIdArray(board.flows) &&
    hasStringIdArray(board.contexts) &&
    hasStringIdArray(board.domains) &&
    hasStringIdArray(board.connections) &&
    hasStringIdArray(board.hotspots)
  );
}

/** ボードをエクスポート用JSONに変換 */
export function exportBoard(board: DomainModelingBoard): string {
  const data: ExportData = {
    version: 2,
    board,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}
