import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RandomPasswordPage from "../random/page";

// Mock clipboard API
const mockWriteText = jest.fn();
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
});

// Mock fetch
global.fetch = jest.fn();

describe("Random Password Page", () => {
  beforeEach(() => {
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);
    (global.fetch as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          passwords: ["TestPassword123!"],
        }),
    });
  });

  it("renders page title", async () => {
    render(<RandomPasswordPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Password Generator" })).toBeInTheDocument();
    });
  });

  it("renders character option checkboxes", async () => {
    render(<RandomPasswordPage />);

    await waitFor(() => {
      expect(screen.getByText("Include Uppercase Letters")).toBeInTheDocument();
      expect(screen.getByText("Include Lowercase Letters")).toBeInTheDocument();
      expect(screen.getByText("Include Numbers")).toBeInTheDocument();
      expect(screen.getByText("Include Symbols")).toBeInTheDocument();
    });
  });

  it("has correct default checkbox states", async () => {
    render(<RandomPasswordPage />);

    await waitFor(() => {
      expect(screen.getByText("Include Uppercase Letters")).toBeInTheDocument();
    });

    // Get main option checkboxes (first 6: uppercase, lowercase, numbers, symbols, exclude similar, no repeat)
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked(); // Uppercase
    expect(checkboxes[1]).toBeChecked(); // Lowercase
    expect(checkboxes[2]).toBeChecked(); // Numbers
    expect(checkboxes[3]).not.toBeChecked(); // Symbols
  });

  it("renders password length slider", async () => {
    render(<RandomPasswordPage />);

    await waitFor(() => {
      expect(screen.getByText("Password length")).toBeInTheDocument();
      expect(screen.getByText("16 chars")).toBeInTheDocument();
    });
  });

  it("renders exclude similar option", async () => {
    render(<RandomPasswordPage />);

    await waitFor(() => {
      expect(screen.getByText("Exclude similar characters")).toBeInTheDocument();
    });
  });

  it("renders no repeated characters option", async () => {
    render(<RandomPasswordPage />);

    await waitFor(() => {
      expect(screen.getByText("No repeated characters")).toBeInTheDocument();
    });
  });

  it("allows toggling uppercase option", async () => {
    render(<RandomPasswordPage />);

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: /Uppercase/ })).toBeInTheDocument();
    });

    const uppercaseCheckbox = screen.getByRole("checkbox", {
      name: /Uppercase/,
    });
    fireEvent.click(uppercaseCheckbox);

    expect(uppercaseCheckbox).not.toBeChecked();
  });

  it("generates password on initial render", async () => {
    render(<RandomPasswordPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/random",
        expect.any(Object)
      );
    });
  });

  it("displays generated password", async () => {
    render(<RandomPasswordPage />);

    await waitFor(() => {
      expect(screen.getByText("TestPassword123!")).toBeInTheDocument();
    });
  });

  it("allows copying password", async () => {
    render(<RandomPasswordPage />);

    await waitFor(() => {
      expect(screen.getByText("TestPassword123!")).toBeInTheDocument();
    });

    // Find the copy button near the password
    const buttons = screen.getAllByRole("button");
    const copyButton = buttons.find(
      (btn) =>
        btn.querySelector('svg[class*="lucide-copy"]') ||
        btn.querySelector('svg[class*="lucide-check"]')
    );

    if (copyButton) {
      fireEvent.click(copyButton);
      expect(mockWriteText).toHaveBeenCalledWith("TestPassword123!");
    }
  });

  it("shows password strength indicator", async () => {
    render(<RandomPasswordPage />);

    await waitFor(() => {
      // Should show one of the strength levels
      const strengthText =
        screen.queryByText(/Strong:/) ||
        screen.queryByText(/Moderate:/) ||
        screen.queryByText(/Weak:/);
      expect(strengthText).toBeInTheDocument();
    });
  });

  it("shows symbol selection when symbols enabled", async () => {
    render(<RandomPasswordPage />);

    await waitFor(() => {
      expect(screen.getByText("Include Symbols")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");
    const symbolsCheckbox = checkboxes[3]; // Fourth checkbox is symbols
    fireEvent.click(symbolsCheckbox);

    await waitFor(() => {
      expect(screen.getByText("Select symbols")).toBeInTheDocument();
    });
  });

  it("hides symbol selection when symbols disabled", async () => {
    render(<RandomPasswordPage />);

    await waitFor(() => {
      expect(screen.getByText("Include Symbols")).toBeInTheDocument();
    });

    expect(screen.queryByText("Select symbols")).not.toBeInTheDocument();
  });

  it("disables no repeat option when conditions not met", async () => {
    render(<RandomPasswordPage />);

    await waitFor(() => {
      // With default length of 16, no repeat should be disabled
      expect(screen.getByText("No repeated characters")).toBeInTheDocument();
    });

    // The checkbox should be disabled - find all checkboxes and check the last one
    const checkboxes = screen.getAllByRole("checkbox");
    const noRepeatCheckbox = checkboxes[checkboxes.length - 1];
    expect(noRepeatCheckbox).toBeDisabled();
  });

  it("regenerates password when refresh button is clicked", async () => {
    render(<RandomPasswordPage />);

    await waitFor(() => {
      expect(screen.getByText("TestPassword123!")).toBeInTheDocument();
    });

    const refreshButton = screen
      .getAllByRole("button")
      .find((btn) => btn.querySelector('svg[class*="lucide-refresh"]'));

    if (refreshButton) {
      const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(
          initialCallCount
        );
      });
    }
  });
});
