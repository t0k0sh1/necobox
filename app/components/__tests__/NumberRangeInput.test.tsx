import { render, screen, fireEvent } from "@testing-library/react";
import { NumberRangeInput } from "../NumberRangeInput";

describe("NumberRangeInput", () => {
  it("renders min and max input fields", () => {
    render(
      <NumberRangeInput
        minValue="1"
        maxValue="100"
        onMinChange={jest.fn()}
        onMaxChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText("Minimum Value")).toBeInTheDocument();
    expect(screen.getByLabelText("Maximum Value")).toBeInTheDocument();
  });

  it("displays correct initial values", () => {
    render(
      <NumberRangeInput
        minValue="10"
        maxValue="1000"
        onMinChange={jest.fn()}
        onMaxChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText("Minimum Value")).toHaveValue(10);
    expect(screen.getByLabelText("Maximum Value")).toHaveValue(1000);
  });

  it("calls onMinChange when min value changes", () => {
    const onMinChange = jest.fn();
    render(
      <NumberRangeInput
        minValue="1"
        maxValue="100"
        onMinChange={onMinChange}
        onMaxChange={jest.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Minimum Value"), {
      target: { value: "50" },
    });

    expect(onMinChange).toHaveBeenCalledWith("50");
  });

  it("calls onMaxChange when max value changes", () => {
    const onMaxChange = jest.fn();
    render(
      <NumberRangeInput
        minValue="1"
        maxValue="100"
        onMinChange={jest.fn()}
        onMaxChange={onMaxChange}
      />
    );

    fireEvent.change(screen.getByLabelText("Maximum Value"), {
      target: { value: "200" },
    });

    expect(onMaxChange).toHaveBeenCalledWith("200");
  });

  it("calls onMinBlur when min field loses focus", () => {
    const onMinBlur = jest.fn();
    render(
      <NumberRangeInput
        minValue="1"
        maxValue="100"
        onMinChange={jest.fn()}
        onMaxChange={jest.fn()}
        onMinBlur={onMinBlur}
      />
    );

    fireEvent.blur(screen.getByLabelText("Minimum Value"));

    expect(onMinBlur).toHaveBeenCalled();
  });

  it("calls onMaxBlur when max field loses focus", () => {
    const onMaxBlur = jest.fn();
    render(
      <NumberRangeInput
        minValue="1"
        maxValue="100"
        onMinChange={jest.fn()}
        onMaxChange={jest.fn()}
        onMaxBlur={onMaxBlur}
      />
    );

    fireEvent.blur(screen.getByLabelText("Maximum Value"));

    expect(onMaxBlur).toHaveBeenCalled();
  });

  it("renders custom labels when provided", () => {
    render(
      <NumberRangeInput
        minValue="1"
        maxValue="100"
        onMinChange={jest.fn()}
        onMaxChange={jest.fn()}
        minLabel="Start Value"
        maxLabel="End Value"
      />
    );

    expect(screen.getByLabelText("Start Value")).toBeInTheDocument();
    expect(screen.getByLabelText("End Value")).toBeInTheDocument();
  });

  it("has number input type", () => {
    render(
      <NumberRangeInput
        minValue="1"
        maxValue="100"
        onMinChange={jest.fn()}
        onMaxChange={jest.fn()}
      />
    );

    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs).toHaveLength(2);
  });
});
