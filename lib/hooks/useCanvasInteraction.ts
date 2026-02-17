/**
 * キャンバスのパン/ズーム制御フック
 *
 * - パン: Space+ドラッグ or ミドルクリックドラッグ
 * - ズーム: ホイール（ZOOM_MIN〜ZOOM_MAX）
 */

import { useCallback, useRef, useState } from "react";
import {
  type CanvasViewport,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_STEP,
} from "@/lib/utils/domain-modeling";

export interface UseCanvasInteractionOptions {
  /** 初期ビューポート */
  initialViewport?: CanvasViewport;
  /** ビューポート変更時のコールバック */
  onViewportChange?: (viewport: CanvasViewport) => void;
}

export interface UseCanvasInteractionReturn {
  viewport: CanvasViewport;
  setViewport: (v: CanvasViewport) => void;
  isPanning: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  handlePointerDown: (e: React.PointerEvent) => void;
  handlePointerMove: (e: React.PointerEvent) => void;
  handlePointerUp: (e: React.PointerEvent) => void;
  handleWheel: (e: React.WheelEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleKeyUp: (e: React.KeyboardEvent) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

export function useCanvasInteraction(
  options: UseCanvasInteractionOptions = {}
): UseCanvasInteractionReturn {
  const { initialViewport = { x: 0, y: 0, zoom: 1 }, onViewportChange } =
    options;

  const [viewport, setViewportState] = useState<CanvasViewport>(initialViewport);
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const spaceHeldRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const viewportAtPanStartRef = useRef<CanvasViewport | null>(null);

  const setViewport = useCallback(
    (v: CanvasViewport) => {
      setViewportState(v);
      onViewportChange?.(v);
    },
    [onViewportChange]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Space+左クリック or ミドルクリックでパン開始
      if (
        (spaceHeldRef.current && e.button === 0) ||
        e.button === 1
      ) {
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY };
        viewportAtPanStartRef.current = { ...viewport };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
    },
    [viewport]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning || !panStartRef.current || !viewportAtPanStartRef.current) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setViewport({
        ...viewportAtPanStartRef.current,
        x: viewportAtPanStartRef.current.x + dx,
        y: viewportAtPanStartRef.current.y + dy,
      });
    },
    [isPanning, setViewport]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning) {
        setIsPanning(false);
        panStartRef.current = null;
        viewportAtPanStartRef.current = null;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      }
    },
    [isPanning]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const direction = e.deltaY > 0 ? -1 : 1;
      const newZoom = Math.min(
        ZOOM_MAX,
        Math.max(ZOOM_MIN, viewport.zoom + direction * ZOOM_STEP)
      );

      if (newZoom === viewport.zoom) return;

      // マウス位置を中心にズーム
      const scale = newZoom / viewport.zoom;
      const newX = mouseX - (mouseX - viewport.x) * scale;
      const newY = mouseY - (mouseY - viewport.y) * scale;

      setViewport({ x: newX, y: newY, zoom: newZoom });
    },
    [viewport, setViewport]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.code === "Space" && !e.repeat) {
      e.preventDefault();
      spaceHeldRef.current = true;
    }
  }, []);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.code === "Space") {
      spaceHeldRef.current = false;
    }
  }, []);

  const zoomIn = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const newZoom = Math.min(ZOOM_MAX, viewport.zoom + ZOOM_STEP);
    const scale = newZoom / viewport.zoom;
    setViewport({
      x: cx - (cx - viewport.x) * scale,
      y: cy - (cy - viewport.y) * scale,
      zoom: newZoom,
    });
  }, [viewport, setViewport]);

  const zoomOut = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const newZoom = Math.max(ZOOM_MIN, viewport.zoom - ZOOM_STEP);
    const scale = newZoom / viewport.zoom;
    setViewport({
      x: cx - (cx - viewport.x) * scale,
      y: cy - (cy - viewport.y) * scale,
      zoom: newZoom,
    });
  }, [viewport, setViewport]);

  const resetView = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  }, [setViewport]);

  return {
    viewport,
    setViewport,
    isPanning,
    containerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleKeyDown,
    handleKeyUp,
    zoomIn,
    zoomOut,
    resetView,
  };
}
