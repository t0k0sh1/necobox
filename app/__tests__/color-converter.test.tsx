import { render, screen } from "@testing-library/react";
import ColorConverterPage from "../[locale]/color-converter/page";

describe("Color Converter Page", () => {
  it("ページタイトルを表示する", () => {
    render(<ColorConverterPage />);
    expect(
      screen.getByRole("heading", { name: "Color Converter" })
    ).toBeInTheDocument();
  });

  it("HEX入力欄が表示される", () => {
    render(<ColorConverterPage />);
    const hexInputs = screen.getAllByDisplayValue("#3b82f6");
    // カラーピッカーとテキスト入力の両方
    expect(hexInputs.length).toBeGreaterThanOrEqual(1);
  });

  it("RGB入力欄が表示される", () => {
    render(<ColorConverterPage />);
    expect(screen.getByDisplayValue("59")).toBeInTheDocument();
    expect(screen.getByDisplayValue("130")).toBeInTheDocument();
    expect(screen.getByDisplayValue("246")).toBeInTheDocument();
  });

  it("HSL入力欄が表示される", () => {
    render(<ColorConverterPage />);
    expect(screen.getByDisplayValue("217")).toBeInTheDocument();
    expect(screen.getByDisplayValue("91")).toBeInTheDocument();
    expect(screen.getByDisplayValue("60")).toBeInTheDocument();
  });

  it("コントラストチェッカーが表示される", () => {
    render(<ColorConverterPage />);
    expect(screen.getByText("Contrast Checker")).toBeInTheDocument();
  });

  it("関連色セクションが表示される", () => {
    render(<ColorConverterPage />);
    expect(screen.getByText("Related Colors")).toBeInTheDocument();
  });

  it("WCAG判定が表示される", () => {
    render(<ColorConverterPage />);
    expect(screen.getByText("AA")).toBeInTheDocument();
    expect(screen.getByText("AAA")).toBeInTheDocument();
  });
});
