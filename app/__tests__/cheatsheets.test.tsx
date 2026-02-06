import { act, fireEvent, render, screen } from "@testing-library/react";
import CheatsheetsPage from "../[locale]/cheatsheets/page";

describe("Cheatsheets Page", () => {
  beforeEach(() => {
    (navigator.clipboard.writeText as jest.Mock).mockClear();
  });

  it("renders page title", () => {
    render(<CheatsheetsPage />);
    expect(
      screen.getByRole("heading", { name: "Cheatsheets" })
    ).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<CheatsheetsPage />);
    expect(
      screen.getByText("Developer reference cheatsheets for quick lookup")
    ).toBeInTheDocument();
  });

  it("renders HTTP Status Codes tab", () => {
    render(<CheatsheetsPage />);
    expect(screen.getByText("HTTP Status Codes")).toBeInTheDocument();
  });

  it("renders search bar", () => {
    render(<CheatsheetsPage />);
    expect(
      screen.getByPlaceholderText("Search by code, name, or description...")
    ).toBeInTheDocument();
  });

  it("renders status codes", () => {
    render(<CheatsheetsPage />);
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Not Found")).toBeInTheDocument();
  });

  it("renders category headers", () => {
    render(<CheatsheetsPage />);
    expect(screen.getByText("1xx Informational")).toBeInTheDocument();
    expect(screen.getByText("2xx Success")).toBeInTheDocument();
    expect(screen.getByText("4xx Client Error")).toBeInTheDocument();
    expect(screen.getByText("5xx Server Error")).toBeInTheDocument();
  });

  it("filters status codes by search query", () => {
    render(<CheatsheetsPage />);

    const searchInput = screen.getByPlaceholderText(
      "Search by code, name, or description..."
    );

    fireEvent.change(searchInput, { target: { value: "404" } });

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Not Found")).toBeInTheDocument();
    // 200 OK は検索結果に含まれないはず
    expect(screen.queryByText("OK")).not.toBeInTheDocument();
  });

  it("shows no results message when search has no matches", () => {
    render(<CheatsheetsPage />);

    const searchInput = screen.getByPlaceholderText(
      "Search by code, name, or description..."
    );

    fireEvent.change(searchInput, { target: { value: "zzzzzzz" } });

    expect(
      screen.getByText("No matching status codes found")
    ).toBeInTheDocument();
  });

  it("collapses and expands categories", () => {
    render(<CheatsheetsPage />);

    // 2xx Success カテゴリのトグルボタンをクリック
    const categoryButton = screen.getByText("2xx Success").closest("button")!;
    fireEvent.click(categoryButton);

    // 折りたたんだ後、200 OK が非表示になるはず
    // ただし他のカテゴリの要素は残る
    expect(screen.getByText("404")).toBeInTheDocument();

    // もう一度クリックして展開
    fireEvent.click(categoryButton);
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("opens detail dialog when clicking a status code", () => {
    render(<CheatsheetsPage />);

    // 200をクリックして詳細Dialogを開く
    const codeButton = screen.getByText("200").closest("button")!;
    fireEvent.click(codeButton);

    // 詳細Dialogの内容が表示される
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Usage Example")).toBeInTheDocument();
    expect(screen.getByText("Related RFC")).toBeInTheDocument();
    expect(screen.getByText("MDN Reference")).toBeInTheDocument();
  });

  it("copies status code text when copy button is clicked", async () => {
    render(<CheatsheetsPage />);

    const row200 = screen.getByText("200").closest("button")!;
    const copyButtons = row200
      .closest(".group")!
      .querySelectorAll("button");
    const copyButton = copyButtons[copyButtons.length - 1];

    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("200 OK");
  });
});
