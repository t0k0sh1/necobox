import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RandomIntegerPage from "../random-integer/page";

// Mock fetch
global.fetch = jest.fn();

describe("Random Integer Page", () => {
  beforeEach(() => {
    (navigator.clipboard.writeText as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          success: true,
          data: { results: [42, 73, 156] },
        }),
    });
  });

  it("renders page title", () => {
    render(<RandomIntegerPage />);

    expect(screen.getByRole("heading", { name: "Random Integer Generator" })).toBeInTheDocument();
  });

  it("renders min and max input fields", () => {
    render(<RandomIntegerPage />);

    expect(screen.getByText("Minimum Value")).toBeInTheDocument();
    expect(screen.getByText("Maximum Value")).toBeInTheDocument();
  });

  it("has default values for min and max", () => {
    render(<RandomIntegerPage />);

    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs[0]).toHaveValue(1);
    expect(inputs[1]).toHaveValue(10000);
  });

  it("renders distribution options", () => {
    render(<RandomIntegerPage />);

    expect(screen.getByText("Uniform Distribution")).toBeInTheDocument();
    expect(screen.getByText("Normal Distribution")).toBeInTheDocument();
  });

  it("defaults to uniform distribution", () => {
    render(<RandomIntegerPage />);

    const uniformRadio = screen.getByRole("radio", { name: "Uniform Distribution" });
    expect(uniformRadio).toBeChecked();
  });

  it("renders count input", () => {
    render(<RandomIntegerPage />);

    expect(
      screen.getByText("Number of Values to Generate (1-100)")
    ).toBeInTheDocument();
  });

  it("renders seed input", () => {
    render(<RandomIntegerPage />);

    expect(
      screen.getByText("Seed Value (default: -1 for random)")
    ).toBeInTheDocument();
  });

  it("renders generate button", () => {
    render(<RandomIntegerPage />);

    expect(
      screen.getByRole("button", { name: "Generate" })
    ).toBeInTheDocument();
  });

  it("allows changing min value", () => {
    render(<RandomIntegerPage />);

    const inputs = screen.getAllByRole("spinbutton");
    const minInput = inputs[0];
    fireEvent.change(minInput, { target: { value: "100" } });

    expect(minInput).toHaveValue(100);
  });

  it("allows changing max value", () => {
    render(<RandomIntegerPage />);

    const inputs = screen.getAllByRole("spinbutton");
    const maxInput = inputs[1];
    fireEvent.change(maxInput, { target: { value: "5000" } });

    expect(maxInput).toHaveValue(5000);
  });

  it("allows switching distribution type", () => {
    render(<RandomIntegerPage />);

    const normalRadio = screen.getByRole("radio", { name: "Normal Distribution" });
    fireEvent.click(normalRadio);

    expect(normalRadio).toBeChecked();
  });

  it("generates random integers when button is clicked", async () => {
    render(<RandomIntegerPage />);

    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(screen.getByText("Generated Values")).toBeInTheDocument();
    });
  });

  it("displays generated values", async () => {
    render(<RandomIntegerPage />);

    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("73")).toBeInTheDocument();
      expect(screen.getByText("156")).toBeInTheDocument();
    });
  });

  it("calls API with correct parameters", async () => {
    render(<RandomIntegerPage />);

    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/random-integer",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });

  it("shows copy all button after generating", async () => {
    render(<RandomIntegerPage />);

    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Copy All/ })
      ).toBeInTheDocument();
    });
  });

  it("allows copying all values", async () => {
    render(<RandomIntegerPage />);

    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(screen.getByText("Generated Values")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Copy All/ }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("42\n73\n156");
  });

  it("normalizes count value on blur", () => {
    render(<RandomIntegerPage />);

    const inputs = screen.getAllByRole("spinbutton");
    const countInput = inputs[2]; // Third input is count
    fireEvent.change(countInput, { target: { value: "150" } });
    fireEvent.blur(countInput);

    expect(countInput).toHaveValue(100);
  });

  it("normalizes min value on blur", () => {
    render(<RandomIntegerPage />);

    const inputs = screen.getAllByRole("spinbutton");
    const minInput = inputs[0];
    fireEvent.change(minInput, { target: { value: "10.5" } });
    fireEvent.blur(minInput);

    expect(minInput).toHaveValue(10);
  });
});
