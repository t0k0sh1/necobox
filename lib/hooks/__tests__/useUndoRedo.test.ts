import { renderHook, act } from "@testing-library/react";
import { useUndoRedo } from "../useUndoRedo";

describe("useUndoRedo", () => {
  it("初期状態では undo/redo ともに不可", () => {
    const { result } = renderHook(() => useUndoRedo<string>());
    expect(result.current.canUndo()).toBe(false);
    expect(result.current.canRedo()).toBe(false);
  });

  it("push 後に undo で前の状態を取得できる", () => {
    const { result } = renderHook(() => useUndoRedo<string>());

    act(() => {
      result.current.push("A");
    });
    expect(result.current.canUndo()).toBe(true);

    let prev: string | null = null;
    act(() => {
      prev = result.current.undo("B");
    });
    expect(prev).toBe("A");
  });

  it("undo 後に redo で次の状態を取得できる", () => {
    const { result } = renderHook(() => useUndoRedo<string>());

    act(() => {
      result.current.push("A");
    });
    act(() => {
      result.current.undo("B");
    });

    expect(result.current.canRedo()).toBe(true);
    let next: string | null = null;
    act(() => {
      next = result.current.redo("A");
    });
    expect(next).toBe("B");
  });

  it("push 時に future がクリアされる", () => {
    const { result } = renderHook(() => useUndoRedo<string>());

    act(() => {
      result.current.push("A");
      result.current.push("B");
    });
    act(() => {
      result.current.undo("C");
    });
    expect(result.current.canRedo()).toBe(true);

    // 新しく push すると redo できなくなる
    act(() => {
      result.current.push("D");
    });
    expect(result.current.canRedo()).toBe(false);
  });

  it("MAX_HISTORY（50件）を超えると古い履歴が削除される", () => {
    const { result } = renderHook(() => useUndoRedo<number>());

    // 60件 push
    act(() => {
      for (let i = 0; i < 60; i++) {
        result.current.push(i);
      }
    });

    // 50回 undo できるはず
    let undoCount = 0;
    act(() => {
      let current = 999;
      while (true) {
        const prev = result.current.undo(current);
        if (prev === null) break;
        current = prev;
        undoCount++;
      }
    });
    expect(undoCount).toBe(50);
  });

  it("undo で past が減り future が増える", () => {
    const { result } = renderHook(() => useUndoRedo<string>());

    act(() => {
      result.current.push("A");
      result.current.push("B");
      result.current.push("C");
    });

    // 3回 push したので 3回 undo できる
    expect(result.current.canUndo()).toBe(true);
    act(() => {
      result.current.undo("D");
    });
    expect(result.current.canUndo()).toBe(true);
    expect(result.current.canRedo()).toBe(true);

    act(() => {
      result.current.undo("C");
    });
    act(() => {
      result.current.undo("B");
    });
    // past が空になった
    expect(result.current.canUndo()).toBe(false);
    // future には3つある
    expect(result.current.canRedo()).toBe(true);
  });

  it("redo で future が減り past が増える", () => {
    const { result } = renderHook(() => useUndoRedo<string>());

    act(() => {
      result.current.push("A");
    });
    act(() => {
      result.current.undo("B");
    });
    // redo
    act(() => {
      result.current.redo("A");
    });
    expect(result.current.canRedo()).toBe(false);
    expect(result.current.canUndo()).toBe(true);
  });

  it("clear で履歴が全消去される", () => {
    const { result } = renderHook(() => useUndoRedo<string>());

    act(() => {
      result.current.push("A");
      result.current.push("B");
    });
    expect(result.current.canUndo()).toBe(true);

    act(() => {
      result.current.clear();
    });
    expect(result.current.canUndo()).toBe(false);
    expect(result.current.canRedo()).toBe(false);
  });

  it("past が空のとき undo は null を返す", () => {
    const { result } = renderHook(() => useUndoRedo<string>());

    let prev: string | null = "not-null";
    act(() => {
      prev = result.current.undo("A");
    });
    expect(prev).toBeNull();
  });

  it("future が空のとき redo は null を返す", () => {
    const { result } = renderHook(() => useUndoRedo<string>());

    let next: string | null = "not-null";
    act(() => {
      next = result.current.redo("A");
    });
    expect(next).toBeNull();
  });

  it("返り値のオブジェクト参照が安定している（useMemo）", () => {
    const { result, rerender } = renderHook(() => useUndoRedo<string>());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
