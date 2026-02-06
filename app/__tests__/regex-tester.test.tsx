import { render, screen, fireEvent } from "@testing-library/react";
import RegexTesterPage from "../[locale]/regex-tester/page";

describe("Regex Tester Page", () => {
  it("ページタイトルを表示する", () => {
    render(<RegexTesterPage />);
    expect(
      screen.getByRole("heading", { name: "Regex Tester" })
    ).toBeInTheDocument();
  });

  it("パターン入力欄が表示される", () => {
    render(<RegexTesterPage />);
    expect(
      screen.getByPlaceholderText(/Enter regex pattern/)
    ).toBeInTheDocument();
  });

  it("テスト文字列入力欄が表示される", () => {
    render(<RegexTesterPage />);
    expect(
      screen.getByPlaceholderText(/Enter text to test/)
    ).toBeInTheDocument();
  });

  it("フラグボタンが表示される", () => {
    render(<RegexTesterPage />);
    expect(screen.getByRole("button", { name: /Flag g/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Flag i/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Flag m/i })).toBeInTheDocument();
  });

  it("プリセットボタンが表示される", () => {
    render(<RegexTesterPage />);
    expect(screen.getByRole("button", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "URL" })).toBeInTheDocument();
  });

  it("パターンとテスト文字列を入力するとマッチ数が表示される", () => {
    render(<RegexTesterPage />);

    const patternInput = screen.getByPlaceholderText(/Enter regex pattern/);
    const testInput = screen.getByPlaceholderText(/Enter text to test/);

    fireEvent.change(patternInput, { target: { value: "\\d+" } });
    fireEvent.change(testInput, {
      target: { value: "abc 123 def 456" },
    });

    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
