import { render, screen, fireEvent } from "@testing-library/react";
import { CharacterTypeSelector } from "../CharacterTypeSelector";

const defaultOptions = [
  { value: "alphanumeric", label: "Alphanumeric Only" },
  { value: "japanese-full", label: "Full-width Hiragana, Katakana, Kanji" },
  { value: "mixed", label: "Mixed Full/Half-width" },
];

describe("CharacterTypeSelector", () => {
  it("renders title correctly", () => {
    render(
      <CharacterTypeSelector
        value="alphanumeric"
        onValueChange={jest.fn()}
        options={defaultOptions}
      />
    );

    expect(screen.getByText("Character Type")).toBeInTheDocument();
  });

  it("renders custom title when provided", () => {
    render(
      <CharacterTypeSelector
        value="alphanumeric"
        onValueChange={jest.fn()}
        options={defaultOptions}
        title="Select Type"
      />
    );

    expect(screen.getByText("Select Type")).toBeInTheDocument();
  });

  it("renders all options", () => {
    render(
      <CharacterTypeSelector
        value="alphanumeric"
        onValueChange={jest.fn()}
        options={defaultOptions}
      />
    );

    expect(screen.getByLabelText("Alphanumeric Only")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Full-width Hiragana, Katakana, Kanji")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Mixed Full/Half-width")).toBeInTheDocument();
  });

  it("selects the correct option based on value", () => {
    render(
      <CharacterTypeSelector
        value="japanese-full"
        onValueChange={jest.fn()}
        options={defaultOptions}
      />
    );

    const selectedRadio = screen.getByRole("radio", {
      name: "Full-width Hiragana, Katakana, Kanji",
    });
    expect(selectedRadio).toHaveAttribute("data-state", "checked");
  });

  it("calls onValueChange when option is selected", () => {
    const onValueChange = jest.fn();
    render(
      <CharacterTypeSelector
        value="alphanumeric"
        onValueChange={onValueChange}
        options={defaultOptions}
      />
    );

    fireEvent.click(
      screen.getByLabelText("Full-width Hiragana, Katakana, Kanji")
    );

    expect(onValueChange).toHaveBeenCalledWith("japanese-full");
  });

  it("renders correct number of radio buttons", () => {
    render(
      <CharacterTypeSelector
        value="alphanumeric"
        onValueChange={jest.fn()}
        options={defaultOptions}
      />
    );

    const radioButtons = screen.getAllByRole("radio");
    expect(radioButtons).toHaveLength(3);
  });

  it("handles empty options array", () => {
    render(
      <CharacterTypeSelector
        value=""
        onValueChange={jest.fn()}
        options={[]}
      />
    );

    expect(screen.getByText("Character Type")).toBeInTheDocument();
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });
});
