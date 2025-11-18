import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ShowGipPage from "../show-gip/page";

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

describe("Show Global IP Page", () => {
  beforeEach(() => {
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders page title", () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ip: "192.168.1.1" }),
    });

    render(<ShowGipPage />);

    expect(screen.getByRole("heading", { name: "Show Global IP" })).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    );

    render(<ShowGipPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("displays IP address after fetching", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ip: "203.0.113.42" }),
    });

    render(<ShowGipPage />);

    await waitFor(() => {
      expect(screen.getByText("203.0.113.42")).toBeInTheDocument();
    });
  });

  it("displays error message on API error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Failed to fetch IP" }),
    });

    render(<ShowGipPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch IP")).toBeInTheDocument();
    });
  });

  it("displays error message on network error", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    render(<ShowGipPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch IP address")).toBeInTheDocument();
    });
  });

  it("fetches IP from correct endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ip: "192.168.1.1" }),
    });

    render(<ShowGipPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/v1/show-gip");
    });
  });

  it("renders copy button when IP is displayed", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ip: "203.0.113.42" }),
    });

    render(<ShowGipPage />);

    await waitFor(() => {
      expect(screen.getByText("203.0.113.42")).toBeInTheDocument();
    });

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("allows copying IP address", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ip: "203.0.113.42" }),
    });

    render(<ShowGipPage />);

    await waitFor(() => {
      expect(screen.getByText("203.0.113.42")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button"));

    expect(mockWriteText).toHaveBeenCalledWith("203.0.113.42");
  });

  it("shows check icon after copying", async () => {
    jest.useFakeTimers();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ip: "203.0.113.42" }),
    });

    render(<ShowGipPage />);

    await waitFor(() => {
      expect(screen.getByText("203.0.113.42")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveClass("bg-green-50");
    });

    jest.useRealTimers();
  });

  it("does not show copy button when error occurs", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Failed to fetch IP" }),
    });

    render(<ShowGipPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch IP")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("displays IP label text", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ip: "203.0.113.42" }),
    });

    render(<ShowGipPage />);

    await waitFor(() => {
      expect(screen.getByText("Your IP Address:")).toBeInTheDocument();
    });
  });
});
