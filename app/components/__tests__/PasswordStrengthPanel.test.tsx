import { render, screen } from "@testing-library/react";
import { PasswordStrengthPanel } from "../PasswordStrengthPanel";
import type { PasswordStrengthResult, NistComplianceResult } from "@/lib/utils/password-strength";
import type { HibpResult } from "@/lib/utils/hibp";

// next-intl は jest.setup.ts でモック済み（en.json の実際の翻訳値を返す）

const baseStrength: PasswordStrengthResult = {
  score: 0,
  crackTimeDisplay: "instant",
  feedback: { warning: "", suggestions: [] },
};

const baseNist: NistComplianceResult = {
  level: "compliant",
  minLength: 15,
  currentLength: 20,
};

const baseHibp: HibpResult = {
  breached: false,
  count: 0,
};

describe("PasswordStrengthPanel", () => {
  describe("スコア表示", () => {
    it.each([
      [0, "Very Weak"],
      [1, "Weak"],
      [2, "Fair"],
      [3, "Strong"],
      [4, "Very Strong"],
    ] as const)("スコア %d のラベル「%s」を表示する", (score, expectedLabel) => {
      render(
        <PasswordStrengthPanel
          strengthResult={{ ...baseStrength, score }}
          nistResult={baseNist}
          hibpResult={baseHibp}
          isStrengthLoading={false}
          isBreachChecking={false}
        />
      );

      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    });

    it("クラック推定時間を表示する", () => {
      render(
        <PasswordStrengthPanel
          strengthResult={{ ...baseStrength, crackTimeDisplay: "3 years" }}
          nistResult={baseNist}
          hibpResult={baseHibp}
          isStrengthLoading={false}
          isBreachChecking={false}
        />
      );

      expect(
        screen.getByText("Estimated crack time: 3 years")
      ).toBeInTheDocument();
    });
  });

  describe("ローディング状態", () => {
    it("強度評価ローディング中はスコアラベルを表示しない", () => {
      render(
        <PasswordStrengthPanel
          strengthResult={null}
          nistResult={null}
          hibpResult={null}
          isStrengthLoading={true}
          isBreachChecking={false}
        />
      );

      expect(screen.queryByText("Very Weak")).not.toBeInTheDocument();
      expect(screen.queryByText("Strong")).not.toBeInTheDocument();
    });

    it("HIBP チェック中はチェック中テキストを表示する", () => {
      render(
        <PasswordStrengthPanel
          strengthResult={baseStrength}
          nistResult={baseNist}
          hibpResult={null}
          isStrengthLoading={false}
          isBreachChecking={true}
        />
      );

      expect(
        screen.getByText("Checking breach database...")
      ).toBeInTheDocument();
    });
  });

  describe("HIBP 結果", () => {
    it("安全な場合に安全テキストを表示する", () => {
      render(
        <PasswordStrengthPanel
          strengthResult={baseStrength}
          nistResult={baseNist}
          hibpResult={{ breached: false, count: 0 }}
          isStrengthLoading={false}
          isBreachChecking={false}
        />
      );

      expect(
        screen.getByText("Not found in known breaches")
      ).toBeInTheDocument();
    });

    it("漏洩が見つかった場合に漏洩テキストと警告を表示する", () => {
      render(
        <PasswordStrengthPanel
          strengthResult={baseStrength}
          nistResult={baseNist}
          hibpResult={{ breached: true, count: 12345 }}
          isStrengthLoading={false}
          isBreachChecking={false}
        />
      );

      expect(
        screen.getByText("Found in 12,345 data breach(es)!")
      ).toBeInTheDocument();
      expect(
        screen.getByText("This password has been exposed. Do not use it.")
      ).toBeInTheDocument();
    });

    it("エラー時にエラーテキストを表示する", () => {
      render(
        <PasswordStrengthPanel
          strengthResult={baseStrength}
          nistResult={baseNist}
          hibpResult={{ breached: false, count: 0, error: "API request failed" }}
          isStrengthLoading={false}
          isBreachChecking={false}
        />
      );

      expect(
        screen.getByText("Could not check breach status")
      ).toBeInTheDocument();
    });
  });

  describe("NIST 準拠バッジ", () => {
    it("Compliant バッジを表示する", () => {
      render(
        <PasswordStrengthPanel
          strengthResult={baseStrength}
          nistResult={{ level: "compliant", minLength: 15, currentLength: 20 }}
          hibpResult={baseHibp}
          isStrengthLoading={false}
          isBreachChecking={false}
        />
      );

      expect(screen.getByText("Compliant")).toBeInTheDocument();
    });

    it("Multi-Factor Only バッジを表示する", () => {
      render(
        <PasswordStrengthPanel
          strengthResult={baseStrength}
          nistResult={{ level: "multi-factor-only", minLength: 8, currentLength: 10 }}
          hibpResult={baseHibp}
          isStrengthLoading={false}
          isBreachChecking={false}
        />
      );

      expect(screen.getByText("Multi-Factor Only")).toBeInTheDocument();
    });

    it("Non-Compliant バッジを表示する", () => {
      render(
        <PasswordStrengthPanel
          strengthResult={baseStrength}
          nistResult={{ level: "non-compliant", minLength: 8, currentLength: 5 }}
          hibpResult={baseHibp}
          isStrengthLoading={false}
          isBreachChecking={false}
        />
      );

      expect(screen.getByText("Non-Compliant")).toBeInTheDocument();
    });
  });

  describe("zxcvbn フィードバック", () => {
    it("警告メッセージを表示する", () => {
      render(
        <PasswordStrengthPanel
          strengthResult={{
            ...baseStrength,
            feedback: { warning: "This is a common password", suggestions: [] },
          }}
          nistResult={baseNist}
          hibpResult={baseHibp}
          isStrengthLoading={false}
          isBreachChecking={false}
        />
      );

      expect(screen.getByText("This is a common password")).toBeInTheDocument();
    });

    it("提案を表示する", () => {
      render(
        <PasswordStrengthPanel
          strengthResult={{
            ...baseStrength,
            feedback: {
              warning: "",
              suggestions: ["Add more characters", "Use a mix of letters"],
            },
          }}
          nistResult={baseNist}
          hibpResult={baseHibp}
          isStrengthLoading={false}
          isBreachChecking={false}
        />
      );

      expect(screen.getByText("Add more characters")).toBeInTheDocument();
      expect(screen.getByText("Use a mix of letters")).toBeInTheDocument();
    });
  });

  describe("表示条件", () => {
    it("strengthResult が null かつローディングでない場合は何も表示しない", () => {
      const { container } = render(
        <PasswordStrengthPanel
          strengthResult={null}
          nistResult={null}
          hibpResult={null}
          isStrengthLoading={false}
          isBreachChecking={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
