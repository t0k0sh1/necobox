import {
  getConnectionDirection,
  getFlowExitPoint,
  getFlowEntryPoint,
  buildManhattanPath,
  getMidpointOfPath,
  type EventFlow,
  type ConnectionDirection,
} from "../domain-modeling";

/** テスト用の最小限 EventFlow を生成するヘルパー */
function makeFlow(x: number, y: number): EventFlow {
  return {
    id: "test-flow",
    position: { x, y },
    slots: {
      views: [],
      actors: [],
      commands: [],
      aggregates: [],
      events: [{ id: "e1", text: "テストイベント" }],
      externalSystems: [],
      policies: [],
    },
    createdAt: new Date().toISOString(),
  };
}

describe("getConnectionDirection", () => {
  it("右側にあるフローへは right を返す", () => {
    const from = makeFlow(0, 0);
    const to = makeFlow(300, 0);
    expect(getConnectionDirection(from, to)).toBe("right");
  });

  it("左側にあるフローへは left を返す", () => {
    const from = makeFlow(300, 0);
    const to = makeFlow(0, 0);
    expect(getConnectionDirection(from, to)).toBe("left");
  });

  it("下側にあるフローへは down を返す", () => {
    const from = makeFlow(0, 0);
    const to = makeFlow(0, 300);
    expect(getConnectionDirection(from, to)).toBe("down");
  });

  it("上側にあるフローへは up を返す", () => {
    const from = makeFlow(0, 300);
    const to = makeFlow(0, 0);
    expect(getConnectionDirection(from, to)).toBe("up");
  });

  it("水平距離と垂直距離が等しい場合は水平方向を優先する", () => {
    const from = makeFlow(0, 0);
    // dx == dy の場合は水平方向（right）
    const to = makeFlow(200, 200);
    expect(getConnectionDirection(from, to)).toBe("right");
  });

  it("斜め右上でも水平距離が大きければ right を返す", () => {
    const from = makeFlow(0, 100);
    const to = makeFlow(400, 0); // dx=400 > dy=100
    expect(getConnectionDirection(from, to)).toBe("right");
  });

  it("斜めで垂直距離が大きければ down を返す", () => {
    const from = makeFlow(0, 0);
    const to = makeFlow(100, 400); // dy=400 > dx=100
    expect(getConnectionDirection(from, to)).toBe("down");
  });
});

describe("getFlowExitPoint", () => {
  it("right方向は右端中央を返す", () => {
    const flow = makeFlow(100, 100);
    const pt = getFlowExitPoint(flow, "right");
    expect(pt.x).toBeGreaterThan(100); // 右端
    expect(pt.y).toBeGreaterThan(100); // 中央y（高さの半分）
  });

  it("left方向は左端中央を返す", () => {
    const flow = makeFlow(100, 100);
    const pt = getFlowExitPoint(flow, "left");
    expect(pt.x).toBe(100); // 左端
  });

  it("down方向は下端中央を返す", () => {
    const flow = makeFlow(100, 100);
    const pt = getFlowExitPoint(flow, "down");
    expect(pt.y).toBeGreaterThan(100); // 下端
  });

  it("up方向は上端中央を返す", () => {
    const flow = makeFlow(100, 100);
    const pt = getFlowExitPoint(flow, "up");
    expect(pt.y).toBe(100); // 上端
  });
});

describe("getFlowEntryPoint", () => {
  it("right方向の入口は左端中央（出口の反対）を返す", () => {
    const flow = makeFlow(200, 100);
    const pt = getFlowEntryPoint(flow, "right");
    expect(pt.x).toBe(200); // 左端
  });

  it("left方向の入口は右端中央（出口の反対）を返す", () => {
    const flow = makeFlow(200, 100);
    const pt = getFlowEntryPoint(flow, "left");
    expect(pt.x).toBeGreaterThan(200); // 右端
  });

  it("down方向の入口は上端中央（出口の反対）を返す", () => {
    const flow = makeFlow(100, 200);
    const pt = getFlowEntryPoint(flow, "down");
    expect(pt.y).toBe(200); // 上端
  });

  it("up方向の入口は下端中央（出口の反対）を返す", () => {
    const flow = makeFlow(100, 200);
    const pt = getFlowEntryPoint(flow, "up");
    expect(pt.y).toBeGreaterThan(200); // 下端
  });
});

describe("buildManhattanPath", () => {
  const exit = { x: 0, y: 50 };
  const entry = { x: 200, y: 150 };

  it("right方向は H-V-H パスを生成する", () => {
    const path = buildManhattanPath(exit, entry, "right");
    expect(path).toBe("M 0 50 L 100 50 L 100 150 L 200 150");
  });

  it("left方向も H-V-H パスを生成する", () => {
    const path = buildManhattanPath(entry, exit, "left");
    expect(path).toBe("M 200 150 L 100 150 L 100 50 L 0 50");
  });

  it("down方向は V-H-V パスを生成する", () => {
    const ex = { x: 100, y: 0 };
    const en = { x: 300, y: 200 };
    const path = buildManhattanPath(ex, en, "down");
    expect(path).toBe("M 100 0 L 100 100 L 300 100 L 300 200");
  });

  it("up方向も V-H-V パスを生成する", () => {
    const ex = { x: 300, y: 200 };
    const en = { x: 100, y: 0 };
    const path = buildManhattanPath(ex, en, "up");
    expect(path).toBe("M 300 200 L 300 100 L 100 100 L 100 0");
  });

  it("同じ座標でも有効なパスを生成する", () => {
    const pt = { x: 100, y: 100 };
    const path = buildManhattanPath(pt, pt, "right");
    expect(path).toBe("M 100 100 L 100 100 L 100 100 L 100 100");
  });
});

describe("getMidpointOfPath", () => {
  it("2点の中点を返す", () => {
    const exit = { x: 0, y: 0 };
    const entry = { x: 200, y: 100 };
    const mid = getMidpointOfPath(exit, entry);
    expect(mid.x).toBe(100);
    expect(mid.y).toBe(50);
  });

  it("同じ座標の場合はその座標を返す", () => {
    const pt = { x: 50, y: 75 };
    const mid = getMidpointOfPath(pt, pt);
    expect(mid.x).toBe(50);
    expect(mid.y).toBe(75);
  });

  it("負の座標でも正しく計算する", () => {
    const exit = { x: -100, y: -50 };
    const entry = { x: 100, y: 50 };
    const mid = getMidpointOfPath(exit, entry);
    expect(mid.x).toBe(0);
    expect(mid.y).toBe(0);
  });
});

describe("getConnectionDirection と getFlowExitPoint/EntryPoint の整合性", () => {
  it("exit と entry は常に対応する辺から出入りする", () => {
    const directions: ConnectionDirection[] = ["right", "left", "down", "up"];
    const flow = makeFlow(100, 100);

    for (const dir of directions) {
      const exit = getFlowExitPoint(flow, dir);
      const entry = getFlowEntryPoint(flow, dir);

      // exit と entry は方向によって異なる軸で変化する
      if (dir === "right" || dir === "left") {
        expect(exit.y).toBe(entry.y); // 水平方向: y は同じ（中心）
      } else {
        expect(exit.x).toBe(entry.x); // 垂直方向: x は同じ（中心）
      }
    }
  });
});
