import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { CopyButton } from "../CopyButton";

// Mock clipboard API
const mockWriteText = jest.fn();
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
});

describe("CopyButton", () => {
  beforeEach(() => {
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders copy icon by default", () => {
    render(<CopyButton text="test text" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("copies text to clipboard when clicked", async () => {
    render(<CopyButton text="test text" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(mockWriteText).toHaveBeenCalledWith("test text");
  });

  it("shows check icon after copying", async () => {
    render(<CopyButton text="test text" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveClass("bg-green-50");
    });
  });

  it("reverts to copy icon after 2 seconds", async () => {
    render(<CopyButton text="test text" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveClass("bg-green-50");
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByRole("button")).not.toHaveClass("bg-green-50");
    });
  });

  it("calls onCopy callback when provided", async () => {
    const onCopy = jest.fn();
    render(<CopyButton text="test text" onCopy={onCopy} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    await waitFor(() => {
      expect(onCopy).toHaveBeenCalled();
    });
  });

  it("displays label when provided", () => {
    render(<CopyButton text="test text" label="Copy Text" />);

    expect(screen.getByText("Copy Text")).toBeInTheDocument();
  });

  it("displays copiedLabel when copied", async () => {
    render(<CopyButton text="test text" label="Copy" copiedLabel="Copied" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    await waitFor(() => {
      expect(screen.getByText("Copied")).toBeInTheDocument();
    });
  });

  it("applies custom className", () => {
    render(<CopyButton text="test text" className="custom-class" />);

    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("handles clipboard error gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockWriteText.mockRejectedValue(new Error("Clipboard error"));

    render(<CopyButton text="test text" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to copy text:",
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});
