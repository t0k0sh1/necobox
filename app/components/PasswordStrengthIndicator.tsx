"use client";

interface StrengthLevel {
  level: "Weak" | "Moderate" | "Strong";
  description: string;
  textColor: string;
  bgColor: string;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  characterTypes: number;
}

export function getPasswordStrength(
  password: string,
  characterTypes: number
): StrengthLevel | null {
  if (!password) return null;

  const passwordLength = password.length;

  if (passwordLength < 12 || characterTypes <= 2) {
    return {
      level: "Weak",
      description: "Too short or too simple. Easy to guess or crack.",
      textColor: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    };
  } else if (passwordLength >= 16 && characterTypes >= 3) {
    return {
      level: "Strong",
      description:
        "Long and complex enough to resist brute-force and guessing attacks.",
      textColor: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    };
  } else {
    return {
      level: "Moderate",
      description:
        "Reasonably secure but could be stronger. Add more length or variety.",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    };
  }
}

export function PasswordStrengthIndicator({
  password,
  characterTypes,
}: PasswordStrengthIndicatorProps) {
  const strength = getPasswordStrength(password, characterTypes);

  if (!strength) return null;

  return (
    <div
      className={`p-3 text-sm border-t ${strength.bgColor} ${strength.textColor}`}
    >
      <span className="font-semibold">{strength.level}: </span>
      <span>{strength.description}</span>
    </div>
  );
}
