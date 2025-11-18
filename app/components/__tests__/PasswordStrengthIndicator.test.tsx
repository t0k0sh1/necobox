import { render, screen } from "@testing-library/react";
import {
  PasswordStrengthIndicator,
  getPasswordStrength,
} from "../PasswordStrengthIndicator";

describe("getPasswordStrength", () => {
  it("returns null for empty password", () => {
    expect(getPasswordStrength("", 4)).toBeNull();
  });

  it('returns "Weak" for short passwords', () => {
    const result = getPasswordStrength("short123", 3);
    expect(result?.level).toBe("Weak");
  });

  it('returns "Weak" for passwords with few character types', () => {
    const result = getPasswordStrength("verylongpassword", 2);
    expect(result?.level).toBe("Weak");
  });

  it('returns "Moderate" for medium length passwords with multiple types', () => {
    const result = getPasswordStrength("Password123!", 3);
    expect(result?.level).toBe("Moderate");
  });

  it('returns "Strong" for long passwords with many character types', () => {
    const result = getPasswordStrength("VeryStr0ngP@ssword!", 4);
    expect(result?.level).toBe("Strong");
  });

  it('returns "Strong" for 16+ char passwords with 3+ types', () => {
    const result = getPasswordStrength("LongPassword123!", 3);
    expect(result?.level).toBe("Strong");
  });
});

describe("PasswordStrengthIndicator", () => {
  it("renders nothing for empty password", () => {
    const { container } = render(
      <PasswordStrengthIndicator password="" characterTypes={4} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("displays weak strength with red styling", () => {
    render(<PasswordStrengthIndicator password="weak" characterTypes={1} />);

    expect(screen.getByText("Weak:")).toBeInTheDocument();
    expect(screen.getByText(/Too short or too simple/)).toBeInTheDocument();
  });

  it("displays moderate strength with orange styling", () => {
    render(
      <PasswordStrengthIndicator password="Moderate123!" characterTypes={3} />
    );

    expect(screen.getByText("Moderate:")).toBeInTheDocument();
    expect(screen.getByText(/Reasonably secure/)).toBeInTheDocument();
  });

  it("displays strong strength with green styling", () => {
    render(
      <PasswordStrengthIndicator
        password="VeryStr0ngP@ssword!"
        characterTypes={4}
      />
    );

    expect(screen.getByText("Strong:")).toBeInTheDocument();
    expect(screen.getByText(/Long and complex enough/)).toBeInTheDocument();
  });

  it("applies correct background colors", () => {
    const { container, rerender } = render(
      <PasswordStrengthIndicator password="weak" characterTypes={1} />
    );

    expect(container.firstChild).toHaveClass("bg-red-50");

    rerender(
      <PasswordStrengthIndicator password="Moderate123!" characterTypes={3} />
    );
    expect(container.firstChild).toHaveClass("bg-orange-50");

    rerender(
      <PasswordStrengthIndicator
        password="VeryStr0ngP@ssword!"
        characterTypes={4}
      />
    );
    expect(container.firstChild).toHaveClass("bg-green-50");
  });
});
