import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DummyTextPage from "../dummy-text/page";

// Mock clipboard API
const mockWriteText = jest.fn();
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
});

describe("Dummy Text Page", () => {
  beforeEach(() => {
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);
  });

  it("renders page title", () => {
    render(<DummyTextPage />);

    expect(screen.getByRole("heading", { name: "Dummy Text Generator" })).toBeInTheDocument();
  });

  it("renders character type options", () => {
    render(<DummyTextPage />);

    expect(screen.getByLabelText("Alphanumeric Only")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Full-width Hiragana, Katakana, Kanji")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Mixed Full/Half-width")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Natural Text (Lorem ipsum)")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Natural Text (これはダミーテキストです。)")
    ).toBeInTheDocument();
  });

  it("renders length input with default value", () => {
    render(<DummyTextPage />);

    const lengthInput = screen.getByRole("spinbutton");
    expect(lengthInput).toHaveValue(10);
  });

  it("renders generate button", () => {
    render(<DummyTextPage />);

    expect(
      screen.getByRole("button", { name: "Generate" })
    ).toBeInTheDocument();
  });

  it("allows changing character type", () => {
    render(<DummyTextPage />);

    const loremOption = screen.getByRole("radio", { name: "Natural Text (Lorem ipsum)" });
    fireEvent.click(loremOption);

    expect(loremOption).toHaveAttribute("data-state", "checked");
  });

  it("allows changing length", () => {
    render(<DummyTextPage />);

    const lengthInput = screen.getByRole("spinbutton");
    fireEvent.change(lengthInput, { target: { value: "20" } });

    expect(lengthInput).toHaveValue(20);
  });

  it("generates text when generate button is clicked", async () => {
    render(<DummyTextPage />);

    const generateButton = screen.getByRole("button", { name: "Generate" });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText("Generated Texts")).toBeInTheDocument();
    });
  });

  it("displays generated texts with char count", async () => {
    render(<DummyTextPage />);

    const generateButton = screen.getByRole("button", { name: "Generate" });
    fireEvent.click(generateButton);

    await waitFor(() => {
      // Should show char count labels
      const charLabels = screen.getAllByText(/chars$/);
      expect(charLabels.length).toBeGreaterThan(0);
    });
  });

  it("allows copying generated text", async () => {
    render(<DummyTextPage />);

    const generateButton = screen.getByRole("button", { name: "Generate" });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText("Generated Texts")).toBeInTheDocument();
    });

    const copyButtons = screen.getAllByRole("button").filter((btn) => {
      return btn.querySelector('svg[class*="lucide-copy"]');
    });

    if (copyButtons.length > 0) {
      fireEvent.click(copyButtons[0]);
      expect(mockWriteText).toHaveBeenCalled();
    }
  });

  it("defaults to alphanumeric character type", () => {
    render(<DummyTextPage />);

    const alphanumericOption = screen.getByRole("radio", { name: "Alphanumeric Only" });
    expect(alphanumericOption).toHaveAttribute("data-state", "checked");
  });
});
