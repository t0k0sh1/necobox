import { render, screen, fireEvent } from "@testing-library/react";
import { GeneratedResultCard, getValueFontSize } from "../GeneratedResultCard";

// Mock clipboard API
const mockWriteText = jest.fn();
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
});

describe("GeneratedResultCard", () => {
  beforeEach(() => {
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);
  });

  it("renders string value correctly", () => {
    render(<GeneratedResultCard value="test value" />);

    expect(screen.getByText("test value")).toBeInTheDocument();
  });

  it("renders number value correctly", () => {
    render(<GeneratedResultCard value={12345} />);

    expect(screen.getByText("12345")).toBeInTheDocument();
  });

  it("renders copy button", () => {
    render(<GeneratedResultCard value="test value" />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("copies value when copy button is clicked", () => {
    render(<GeneratedResultCard value="test value" />);

    fireEvent.click(screen.getByRole("button"));

    expect(mockWriteText).toHaveBeenCalledWith("test value");
  });

  it("converts number to string when copying", () => {
    render(<GeneratedResultCard value={12345} />);

    fireEvent.click(screen.getByRole("button"));

    expect(mockWriteText).toHaveBeenCalledWith("12345");
  });

  it("applies custom font size", () => {
    render(<GeneratedResultCard value="test" fontSize="text-sm" />);

    const valueElement = screen.getByText("test");
    expect(valueElement).toHaveClass("text-sm");
  });

  it("applies default font size when not specified", () => {
    render(<GeneratedResultCard value="test" />);

    const valueElement = screen.getByText("test");
    expect(valueElement).toHaveClass("text-lg");
  });

  it("applies break-all class for long values", () => {
    render(<GeneratedResultCard value="verylongvaluestring" />);

    const valueElement = screen.getByText("verylongvaluestring");
    expect(valueElement).toHaveClass("break-all");
  });
});

describe("getValueFontSize", () => {
  it("returns text-lg for values with 5 or fewer digits", () => {
    expect(getValueFontSize(12345)).toBe("text-lg");
    expect(getValueFontSize(1)).toBe("text-lg");
  });

  it("returns text-base for values with 6-10 digits", () => {
    expect(getValueFontSize(123456)).toBe("text-base");
    expect(getValueFontSize(1234567890)).toBe("text-base");
  });

  it("returns text-sm for values with 11-15 digits", () => {
    expect(getValueFontSize(12345678901)).toBe("text-sm");
    expect(getValueFontSize(123456789012345)).toBe("text-sm");
  });

  it("returns text-xs for values with more than 15 digits", () => {
    expect(getValueFontSize(1234567890123456)).toBe("text-xs");
  });

  it("handles negative numbers", () => {
    expect(getValueFontSize(-12345)).toBe("text-base"); // 6 chars including minus
  });
});
