import { useCallback, useEffect, useRef, useState } from "react";
import {
  type SavedColorScheme,
  type ColorSchemeStorage,
  type WorkingScheme,
  type SchemeColor,
  generateId,
  DEFAULT_SCHEME_NAME,
} from "@/lib/utils/color-scheme-designer";

const STORAGE_KEY = "necobox-color-schemes";
const DRAFT_KEY = "necobox-color-scheme-draft";

// --- 型ガード ---

function isValidSchemeColor(v: unknown): v is SchemeColor {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.hex === "string" &&
    (o.hex2 === undefined || typeof o.hex2 === "string") &&
    typeof o.name === "string" &&
    (o.group === "palette" || o.group === "grayscale")
  );
}

function isValidSavedScheme(v: unknown): v is SavedColorScheme {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.updatedAt === "number" &&
    Array.isArray(o.colors) &&
    o.colors.every(isValidSchemeColor) &&
    typeof o.colorMappings === "object" &&
    o.colorMappings !== null
  );
}

function isValidStorage(v: unknown): v is ColorSchemeStorage {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    o.version === 1 &&
    Array.isArray(o.schemes) &&
    o.schemes.every(isValidSavedScheme) &&
    (o.lastActiveSchemeId === null || typeof o.lastActiveSchemeId === "string")
  );
}

function loadFromStorage(): ColorSchemeStorage {
  const empty: ColorSchemeStorage = {
    version: 1,
    schemes: [],
    lastActiveSchemeId: null,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed: unknown = JSON.parse(raw);
    if (isValidStorage(parsed)) return parsed;
    return empty;
  } catch {
    return empty;
  }
}

function saveToStorage(data: ColorSchemeStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ストレージエラーは無視
  }
}

// --- ワーキングドラフト ---

interface DraftData {
  scheme: WorkingScheme;
  activeSchemeId: string | null;
}

function isValidWorkingScheme(v: unknown): v is WorkingScheme {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.name === "string" &&
    Array.isArray(o.colors) &&
    o.colors.every(isValidSchemeColor) &&
    typeof o.colorMappings === "object" &&
    o.colorMappings !== null
  );
}

function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const o = parsed as Record<string, unknown>;
    if (!isValidWorkingScheme(o.scheme)) return null;
    if (o.activeSchemeId !== null && typeof o.activeSchemeId !== "string") return null;
    return { scheme: o.scheme as WorkingScheme, activeSchemeId: o.activeSchemeId as string | null };
  } catch {
    return null;
  }
}

function saveDraft(data: DraftData): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    // ストレージエラーは無視
  }
}

function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ストレージエラーは無視
  }
}

export interface UseColorSchemeStorageReturn {
  savedSchemes: SavedColorScheme[];
  isInitialized: boolean;
  activeSchemeId: string | null;
  setActiveSchemeId: (id: string | null) => void;

  saveScheme: (current: WorkingScheme) => string;
  saveAsNewScheme: (current: WorkingScheme) => string;
  loadScheme: (id: string) => WorkingScheme | null;
  deleteScheme: (id: string) => void;

  checkDirty: (current: WorkingScheme) => boolean;
  markAsSaved: (current: WorkingScheme) => void;
  getLastActiveScheme: () => WorkingScheme | null;

  saveDraftState: (current: WorkingScheme) => void;
  loadDraftState: () => DraftData | null;
  clearDraftState: () => void;
}

export function useColorSchemeStorage(): UseColorSchemeStorageReturn {
  const [schemes, setSchemes] = useState<SavedColorScheme[]>([]);
  const [activeSchemeId, setActiveSchemeId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializedRef = useRef(false);
  // 最後に保存した状態の JSON 文字列を記録し、未保存検知に使用
  const savedSnapshotRef = useRef<string>("");

  // SSR-safe 初期化（クライアントサイドでのみ localStorage から復元）
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const data = loadFromStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe 初期化パターンのため effect 内で setState が必要
    setSchemes(data.schemes);
    setActiveSchemeId(data.lastActiveSchemeId);
    setIsInitialized(true);
  }, []);

  // schemes / activeSchemeId 変更時に localStorage へ書き込み
  useEffect(() => {
    if (!isInitialized) return;
    saveToStorage({
      version: 1,
      schemes,
      lastActiveSchemeId: activeSchemeId,
    });
  }, [schemes, activeSchemeId, isInitialized]);

  const workingToSnapshot = useCallback((w: WorkingScheme): string => {
    return JSON.stringify({
      name: w.name,
      colors: w.colors,
      colorMappings: w.colorMappings,
    });
  }, []);

  const saveAsNewScheme = useCallback(
    (current: WorkingScheme): string => {
      const id = generateId();
      const newScheme: SavedColorScheme = {
        id,
        name: current.name,
        colors: current.colors,
        colorMappings: current.colorMappings,
        updatedAt: Date.now(),
      };
      setSchemes((prev) => [...prev, newScheme]);
      setActiveSchemeId(id);
      savedSnapshotRef.current = workingToSnapshot(current);
      return id;
    },
    [workingToSnapshot]
  );

  const saveScheme = useCallback(
    (current: WorkingScheme): string => {
      if (activeSchemeId) {
        // 既存スキームを上書き
        setSchemes((prev) =>
          prev.map((s) =>
            s.id === activeSchemeId
              ? {
                  ...s,
                  name: current.name,
                  colors: current.colors,
                  colorMappings: current.colorMappings,
                  updatedAt: Date.now(),
                }
              : s
          )
        );
        savedSnapshotRef.current = workingToSnapshot(current);
        return activeSchemeId;
      }
      // activeSchemeId がない場合は新規保存
      return saveAsNewScheme(current);
    },
    [activeSchemeId, workingToSnapshot, saveAsNewScheme]
  );

  const loadScheme = useCallback(
    (id: string): WorkingScheme | null => {
      const found = schemes.find((s) => s.id === id);
      if (!found) return null;
      return {
        name: found.name,
        colors: found.colors,
        colorMappings: found.colorMappings,
      };
    },
    [schemes]
  );

  const deleteScheme = useCallback(
    (id: string) => {
      setSchemes((prev) => prev.filter((s) => s.id !== id));
      if (activeSchemeId === id) {
        setActiveSchemeId(null);
        savedSnapshotRef.current = "";
      }
    },
    [activeSchemeId]
  );

  const checkDirty = useCallback(
    (current: WorkingScheme): boolean => {
      if (!savedSnapshotRef.current) {
        // 一度も保存していない場合、色があれば dirty
        return current.colors.length > 0 || current.name !== DEFAULT_SCHEME_NAME;
      }
      return workingToSnapshot(current) !== savedSnapshotRef.current;
    },
    [workingToSnapshot]
  );

  const markAsSaved = useCallback(
    (current: WorkingScheme) => {
      savedSnapshotRef.current = workingToSnapshot(current);
    },
    [workingToSnapshot]
  );

  const getLastActiveScheme = useCallback((): WorkingScheme | null => {
    if (!activeSchemeId) return null;
    const found = schemes.find((s) => s.id === activeSchemeId);
    if (!found) return null;
    return {
      name: found.name,
      colors: found.colors,
      colorMappings: found.colorMappings,
    };
  }, [activeSchemeId, schemes]);

  const saveDraftState = useCallback(
    (current: WorkingScheme) => {
      saveDraft({ scheme: current, activeSchemeId });
    },
    [activeSchemeId]
  );

  const loadDraftState = useCallback((): DraftData | null => {
    return loadDraft();
  }, []);

  const clearDraftState = useCallback(() => {
    clearDraft();
  }, []);

  return {
    savedSchemes: schemes,
    isInitialized,
    activeSchemeId,
    setActiveSchemeId,
    saveScheme,
    saveAsNewScheme,
    loadScheme,
    deleteScheme,
    checkDirty,
    markAsSaved,
    getLastActiveScheme,
    saveDraftState,
    loadDraftState,
    clearDraftState,
  };
}
