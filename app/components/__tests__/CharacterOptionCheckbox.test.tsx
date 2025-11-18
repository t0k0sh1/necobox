import { render, screen, fireEvent } from "@testing-library/react";
import { CharacterOptionCheckbox } from "../CharacterOptionCheckbox";

describe("CharacterOptionCheckbox", () => {
  it("renders label correctly", () => {
    render(
      <CharacterOptionCheckbox
        checked={false}
        onCheckedChange={jest.fn()}
        label="Include Numbers"
      />
    );

    expect(screen.getByText("Include Numbers")).toBeInTheDocument();
  });

  it("renders checkbox in unchecked state", () => {
    render(
      <CharacterOptionCheckbox
        checked={false}
        onCheckedChange={jest.fn()}
        label="Include Numbers"
      />
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("renders checkbox in checked state", () => {
    render(
      <CharacterOptionCheckbox
        checked={true}
        onCheckedChange={jest.fn()}
        label="Include Numbers"
      />
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("calls onCheckedChange when clicked", () => {
    const onCheckedChange = jest.fn();
    render(
      <CharacterOptionCheckbox
        checked={false}
        onCheckedChange={onCheckedChange}
        label="Include Numbers"
      />
    );

    fireEvent.click(screen.getByRole("checkbox"));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("renders disabled state correctly", () => {
    render(
      <CharacterOptionCheckbox
        checked={false}
        onCheckedChange={jest.fn()}
        label="Include Numbers"
        disabled={true}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
    expect(checkbox).toHaveClass("opacity-50");
  });

  it("renders tooltip when provided", () => {
    render(
      <CharacterOptionCheckbox
        checked={false}
        onCheckedChange={jest.fn()}
        label="Exclude similar"
        tooltip={{
          title: "Excluded characters:",
          items: ["Letters: I, l, O, o", "Numbers: 0, 1"],
        }}
      />
    );

    // Tooltip content should be in the DOM but hidden
    expect(screen.getByText("Excluded characters:")).toBeInTheDocument();
    expect(screen.getByText("Letters: I, l, O, o")).toBeInTheDocument();
    expect(screen.getByText("Numbers: 0, 1")).toBeInTheDocument();
  });

  it("does not render tooltip when not provided", () => {
    render(
      <CharacterOptionCheckbox
        checked={false}
        onCheckedChange={jest.fn()}
        label="Include Numbers"
      />
    );

    expect(screen.queryByText("Excluded characters:")).not.toBeInTheDocument();
  });

  it("applies cursor-not-allowed class when disabled", () => {
    render(
      <CharacterOptionCheckbox
        checked={false}
        onCheckedChange={jest.fn()}
        label="Include Numbers"
        disabled={true}
      />
    );

    const label = screen.getByText("Include Numbers");
    expect(label).toHaveClass("cursor-not-allowed");
  });
});
