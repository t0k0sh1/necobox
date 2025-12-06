import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import DummyTextPage from "../[locale]/dummy-text/page";

describe("Dummy Text Page", () => {
  beforeEach(() => {
    (navigator.clipboard.writeText as jest.Mock).mockClear();
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

  it("renders length mode options", () => {
    render(<DummyTextPage />);

    expect(screen.getByLabelText("Fixed Length")).toBeInTheDocument();
    expect(screen.getByLabelText("Length Range")).toBeInTheDocument();
  });

  it("renders single length input with default value", () => {
    render(<DummyTextPage />);

    const lengthInputs = screen.getAllByRole("spinbutton");
    const singleLengthInput = lengthInputs.find((input) => (input as HTMLInputElement).value === "10");
    expect(singleLengthInput).toBeInTheDocument();
  });

  it("renders number of texts input", () => {
    render(<DummyTextPage />);

    const lengthInputs = screen.getAllByRole("spinbutton");
    const numberOfTextsInput = lengthInputs.find((input) => (input as HTMLInputElement).value === "1");
    expect(numberOfTextsInput).toBeInTheDocument();
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

  it("allows changing single length", () => {
    render(<DummyTextPage />);

    const lengthInputs = screen.getAllByRole("spinbutton");
    const singleLengthInput = lengthInputs.find((input) => (input as HTMLInputElement).value === "10");
    if (singleLengthInput) {
      fireEvent.change(singleLengthInput, { target: { value: "20" } });
      expect(singleLengthInput).toHaveValue(20);
    }
  });

  it("allows switching to range mode", () => {
    render(<DummyTextPage />);

    const rangeOption = screen.getByRole("radio", { name: "Length Range" });
    fireEvent.click(rangeOption);

    expect(rangeOption).toHaveAttribute("data-state", "checked");
    expect(screen.getByLabelText("Minimum Length")).toBeInTheDocument();
    expect(screen.getByLabelText("Maximum Length")).toBeInTheDocument();
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

    const copyButtons = screen.getAllByRole("button", { name: "Copy" });
    expect(copyButtons.length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.click(copyButtons[0]);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it("shows copy all button after generating", async () => {
    render(<DummyTextPage />);

    const generateButton = screen.getByRole("button", { name: "Generate" });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Copy All/i })
      ).toBeInTheDocument();
    });
  });

  it("allows copying all generated texts", async () => {
    render(<DummyTextPage />);

    const generateButton = screen.getByRole("button", { name: "Generate" });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText("Generated Texts")).toBeInTheDocument();
    });

    const copyAllButton = screen.getByRole("button", { name: /Copy All/i });
    await act(async () => {
      fireEvent.click(copyAllButton);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it("defaults to alphanumeric character type", () => {
    render(<DummyTextPage />);

    const alphanumericOption = screen.getByRole("radio", { name: "Alphanumeric Only" });
    expect(alphanumericOption).toHaveAttribute("data-state", "checked");
  });

  it("allows changing min and max length in range mode", () => {
    render(<DummyTextPage />);

    const rangeOption = screen.getByRole("radio", { name: "Length Range" });
    fireEvent.click(rangeOption);

    const minLengthInput = screen.getByLabelText("Minimum Length");
    const maxLengthInput = screen.getByLabelText("Maximum Length");

    fireEvent.change(minLengthInput, { target: { value: "10" } });
    fireEvent.change(maxLengthInput, { target: { value: "20" } });

    expect(minLengthInput).toHaveValue(10);
    expect(maxLengthInput).toHaveValue(20);
  });

  it("generates multiple texts when numberOfTexts is greater than 1", async () => {
    render(<DummyTextPage />);

    const lengthInputs = screen.getAllByRole("spinbutton");
    const numberOfTextsInput = lengthInputs.find((input) => (input as HTMLInputElement).value === "1");

    if (numberOfTextsInput) {
      fireEvent.change(numberOfTextsInput, { target: { value: "5" } });
    }

    const generateButton = screen.getByRole("button", { name: "Generate" });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText("Generated Texts")).toBeInTheDocument();
    });

    const copyButtons = screen.getAllByRole("button", { name: "Copy" });
    expect(copyButtons.length).toBe(5);
  });

  it("generates texts with correct length in single mode", async () => {
    render(<DummyTextPage />);

    const lengthInputs = screen.getAllByRole("spinbutton");
    const singleLengthInput = lengthInputs.find((input) => (input as HTMLInputElement).value === "10");

    if (singleLengthInput) {
      fireEvent.change(singleLengthInput, { target: { value: "15" } });
    }

    const generateButton = screen.getByRole("button", { name: "Generate" });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText("Generated Texts")).toBeInTheDocument();
    });

    const charLabels = screen.getAllByText(/15 chars$/);
    expect(charLabels.length).toBeGreaterThan(0);
  });

  it("generates texts with length within range in range mode", async () => {
    render(<DummyTextPage />);

    const rangeOption = screen.getByRole("radio", { name: "Length Range" });
    fireEvent.click(rangeOption);

    const minLengthInput = screen.getByLabelText("Minimum Length");
    const maxLengthInput = screen.getByLabelText("Maximum Length");

    fireEvent.change(minLengthInput, { target: { value: "5" } });
    fireEvent.change(maxLengthInput, { target: { value: "10" } });

    const lengthInputs = screen.getAllByRole("spinbutton");
    const numberOfTextsInput = lengthInputs.find((input) => {
      const val = (input as HTMLInputElement).value;
      return val === "1" || val === "";
    });

    if (numberOfTextsInput) {
      fireEvent.change(numberOfTextsInput, { target: { value: "10" } });
    }

    const generateButton = screen.getByRole("button", { name: "Generate" });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText("Generated Texts")).toBeInTheDocument();
    });

    // Check that all generated texts have lengths within the range
    const charLabels = screen.getAllByText(/(\d+) chars$/);
    charLabels.forEach((label) => {
      const match = label.textContent?.match(/(\d+) chars$/);
      if (match) {
        const length = parseInt(match[1], 10);
        expect(length).toBeGreaterThanOrEqual(5);
        expect(length).toBeLessThanOrEqual(10);
      }
    });
  });

  it("copies all texts separated by newlines when copy all is clicked", async () => {
    render(<DummyTextPage />);

    const lengthInputs = screen.getAllByRole("spinbutton");
    const numberOfTextsInput = lengthInputs.find((input) => (input as HTMLInputElement).value === "1");

    if (numberOfTextsInput) {
      fireEvent.change(numberOfTextsInput, { target: { value: "3" } });
    }

    const generateButton = screen.getByRole("button", { name: "Generate" });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText("Generated Texts")).toBeInTheDocument();
    });

    const copyAllButton = screen.getByRole("button", { name: /Copy All/i });
    await act(async () => {
      fireEvent.click(copyAllButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    const copiedText = (navigator.clipboard.writeText as jest.Mock).mock.calls[0][0];
    const lines = copiedText.split('\n');
    expect(lines.length).toBe(3);
  });

  it("shows copied state on copy all button after clicking", async () => {
    jest.useFakeTimers();
    render(<DummyTextPage />);

    const generateButton = screen.getByRole("button", { name: "Generate" });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText("Generated Texts")).toBeInTheDocument();
    });

    const copyAllButton = screen.getByRole("button", { name: /Copy All/i });
    await act(async () => {
      fireEvent.click(copyAllButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Copied All/i)).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByText(/Copy All/i)).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it("shows error message for invalid count", async () => {
    render(<DummyTextPage />);

    const lengthInputs = screen.getAllByRole("spinbutton");
    const numberOfTextsInput = lengthInputs.find((input) => (input as HTMLInputElement).value === "1");
    
    if (numberOfTextsInput) {
      fireEvent.change(numberOfTextsInput, { target: { value: "0" } });
    }

    const generateButton = screen.getByRole("button", { name: "Generate" });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Number of texts to generate must be between 1 and 100/i)).toBeInTheDocument();
    });
  });

  it("shows error message for invalid single length", async () => {
    render(<DummyTextPage />);

    const lengthInputs = screen.getAllByRole("spinbutton");
    const singleLengthInput = lengthInputs.find((input) => (input as HTMLInputElement).value === "10");
    
    if (singleLengthInput) {
      fireEvent.change(singleLengthInput, { target: { value: "0" } });
    }

    const generateButton = screen.getByRole("button", { name: "Generate" });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid length/i)).toBeInTheDocument();
    });
  });

  it("shows error message for invalid range", async () => {
    render(<DummyTextPage />);

    const rangeOption = screen.getByRole("radio", { name: "Length Range" });
    fireEvent.click(rangeOption);

    const minLengthInput = screen.getByLabelText("Minimum Length");
    const maxLengthInput = screen.getByLabelText("Maximum Length");

    fireEvent.change(minLengthInput, { target: { value: "20" } });
    fireEvent.change(maxLengthInput, { target: { value: "10" } });

    const generateButton = screen.getByRole("button", { name: "Generate" });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid length range/i)).toBeInTheDocument();
    });
  });
});
