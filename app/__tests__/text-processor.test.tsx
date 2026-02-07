import { render, screen, fireEvent } from "@testing-library/react";
import TextProcessorPage from "../[locale]/text-processor/page";

describe("Text Processor Page", () => {
  it("ページタイトルを表示する", () => {
    render(<TextProcessorPage />);
    expect(
      screen.getByRole("heading", { name: "Text Processor" })
    ).toBeInTheDocument();
  });

  it("入力・出力テキストエリアが表示される", () => {
    render(<TextProcessorPage />);
    expect(screen.getByLabelText("Input")).toBeInTheDocument();
    expect(screen.getByLabelText("Output")).toBeInTheDocument();
  });

  it("統計情報が表示される", () => {
    render(<TextProcessorPage />);
    expect(screen.getByText("Characters:")).toBeInTheDocument();
    expect(screen.getByText("Words:")).toBeInTheDocument();
    expect(screen.getByText("Lines:")).toBeInTheDocument();
  });

  it("テキスト入力時に統計が更新される", () => {
    render(<TextProcessorPage />);
    const input = screen.getByLabelText("Input");
    fireEvent.change(input, { target: { value: "hello world" } });

    expect(screen.getByText(/Words:/).textContent).toContain("2");
  });

  it("操作を追加してパイプラインで出力が更新される", () => {
    render(<TextProcessorPage />);
    const input = screen.getByLabelText("Input");
    fireEvent.change(input, { target: { value: "hello_world" } });

    // Case Convert ボタンをクリックしてパイプラインに追加
    const caseConvertBtn = screen.getByRole("button", {
      name: "Case Convert",
    });
    fireEvent.click(caseConvertBtn);

    // デフォルト camelCase で変換される
    const output = screen.getByLabelText("Output") as HTMLTextAreaElement;
    expect(output.value).toBe("helloWorld");
  });

  it("複数操作をパイプラインで連鎖できる", () => {
    render(<TextProcessorPage />);
    const input = screen.getByLabelText("Input");
    fireEvent.change(input, {
      target: { value: "apple\nbanana\ncherry" },
    });

    // 1. Wrap Lines を追加（デフォルトはシングルクォート）
    const wrapBtn = screen.getByRole("button", { name: "Wrap Lines" });
    fireEvent.click(wrapBtn);

    // 2. Join Lines を追加（デフォルトはカンマ）
    const joinBtn = screen.getByRole("button", { name: "Join Lines" });
    fireEvent.click(joinBtn);

    // パイプライン結果: 各行をシングルクォートで囲み→カンマ結合
    const output = screen.getByLabelText("Output") as HTMLTextAreaElement;
    expect(output.value).toBe("'apple', 'banana', 'cherry'");
  });

  it("ツールバーのボタンが表示される", () => {
    render(<TextProcessorPage />);
    expect(screen.getByRole("button", { name: /Copy/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Output → Input/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clear/ })).toBeInTheDocument();
  });

  it("出力→入力ボタンで出力を入力にコピーする", () => {
    render(<TextProcessorPage />);
    const input = screen.getByLabelText("Input") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "hello_world" } });

    // Case Convert を追加して出力を生成
    const caseConvertBtn = screen.getByRole("button", {
      name: "Case Convert",
    });
    fireEvent.click(caseConvertBtn);

    // 出力は "helloWorld" のはず
    const outputToInputBtn = screen.getByRole("button", {
      name: /Output → Input/,
    });
    fireEvent.click(outputToInputBtn);

    // 入力が "helloWorld" に更新される
    expect(input.value).toBe("helloWorld");
  });

  it("クリアボタンで入力をクリアする", () => {
    render(<TextProcessorPage />);
    const input = screen.getByLabelText("Input") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "hello" } });

    const clearBtn = screen.getByRole("button", { name: /Clear/ });
    fireEvent.click(clearBtn);

    expect(input.value).toBe("");
  });

  it("パイプラインからステップを削除できる", () => {
    render(<TextProcessorPage />);
    const input = screen.getByLabelText("Input") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "hello_world" } });

    // Case Convert を追加
    const caseConvertBtn = screen.getByRole("button", {
      name: "Case Convert",
    });
    fireEvent.click(caseConvertBtn);
    expect(
      (screen.getByLabelText("Output") as HTMLTextAreaElement).value
    ).toBe("helloWorld");

    // ステップの × ボタンで削除
    const removeBtn = screen.getByRole("button", { name: "Remove step" });
    fireEvent.click(removeBtn);

    // パイプラインが空になり出力もクリア
    expect(
      (screen.getByLabelText("Output") as HTMLTextAreaElement).value
    ).toBe("");
  });

  it("パイプラインの全クリアボタンで全ステップを削除する", () => {
    render(<TextProcessorPage />);
    const input = screen.getByLabelText("Input") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "test" } });

    // 2つの操作を追加
    fireEvent.click(screen.getByRole("button", { name: "Case Convert" }));
    fireEvent.click(screen.getByRole("button", { name: "Trim Lines" }));

    // Pipeline の Clear All ボタン
    const clearAllBtn = screen.getByRole("button", { name: "Clear All" });
    fireEvent.click(clearAllBtn);

    // 出力がクリアされる
    expect(
      (screen.getByLabelText("Output") as HTMLTextAreaElement).value
    ).toBe("");
  });

  it("操作がない初期状態では出力が空になる", () => {
    render(<TextProcessorPage />);
    const input = screen.getByLabelText("Input") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "hello_world" } });

    // パイプラインに操作を追加していないので出力は空
    const output = screen.getByLabelText("Output") as HTMLTextAreaElement;
    expect(output.value).toBe("");
  });
});
