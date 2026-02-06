import { render, screen, fireEvent } from "@testing-library/react";
import DiffViewerPage from "../[locale]/diff-viewer/page";

describe("Diff Viewer Page", () => {
  it("ページタイトルを表示する", () => {
    render(<DiffViewerPage />);
    expect(
      screen.getByRole("heading", { name: "Diff Viewer" })
    ).toBeInTheDocument();
  });

  it("変更前・変更後のテキストエリアが表示される", () => {
    render(<DiffViewerPage />);
    expect(
      screen.getByPlaceholderText(/Enter original text/)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter modified text/)
    ).toBeInTheDocument();
  });

  it("表示モード切替ボタンが表示される", () => {
    render(<DiffViewerPage />);
    expect(
      screen.getByRole("button", { name: "Side by Side" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Inline" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Unified" })
    ).toBeInTheDocument();
  });

  it("テキスト入力前は空状態メッセージを表示する", () => {
    render(<DiffViewerPage />);
    expect(
      screen.getByText(/Enter text in both fields/)
    ).toBeInTheDocument();
  });

  it("テキスト入力後に差分統計が表示される", () => {
    render(<DiffViewerPage />);

    const beforeInput = screen.getByPlaceholderText(/Enter original text/);
    const afterInput = screen.getByPlaceholderText(/Enter modified text/);

    fireEvent.change(beforeInput, { target: { value: "hello\nworld\n" } });
    fireEvent.change(afterInput, { target: { value: "hello\nearth\n" } });

    // 統計が表示される（+1, -1 など）
    expect(screen.getByText(/\+1/)).toBeInTheDocument();
    expect(screen.getByText(/-1/)).toBeInTheDocument();
  });
});
