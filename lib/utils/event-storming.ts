/**
 * イベントストーミングツール - 型定義・定数・ユーティリティ
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

/** フロー間の矢印 */
export interface FlowConnection {
  id: string;
  fromFlowId: string;
  toFlowId: string;
  label?: string;
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
export interface EventStormingBoard {
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
  board: EventStormingBoard;
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
}

/** BMCボード全体 */
export interface BmcBoard {
  blocks: Record<BmcBlockType, BmcNote[]>;
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
  return {
    blocks: {
      keyPartners: [],
      keyActivities: [],
      keyResources: [],
      valuePropositions: [],
      customerRelationships: [],
      channels: [],
      customerSegments: [],
      costStructure: [],
      revenueStreams: [],
    },
  };
}

/** BMC付箋を生成 */
export function createBmcNote(text = ""): BmcNote {
  return { id: generateId(), text };
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

/** 空のボードを生成 */
export function createEmptyBoard(name = "Untitled"): EventStormingBoard {
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
export function exportBoard(board: EventStormingBoard): string {
  const data: ExportData = {
    version: 2,
    board,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}
