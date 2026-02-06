"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  getContrastRatio,
  getComplementaryColor,
  getAnalogousColors,
  formatRgb,
  formatHsl,
  isValidHex,
  type RGB,
  type HSL,
  type ContrastResult,
} from "@/lib/utils/color-converter";
import { Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useMemo, useCallback } from "react";

type CopiedField = string | null;

export default function ColorConverterPage() {
  const t = useTranslations("colorConverter");
  const tCommon = useTranslations("common");

  // メインカラー（HEXで管理）
  const [hex, setHex] = useState("#3b82f6");
  const [rgbInput, setRgbInput] = useState({ r: "59", g: "130", b: "246" });
  const [hslInput, setHslInput] = useState({ h: "217", s: "91", l: "60" });

  // コントラスト比チェック用
  const [fgHex, setFgHex] = useState("#000000");
  const [bgHex, setBgHex] = useState("#ffffff");

  // コピー状態
  const [copiedField, setCopiedField] = useState<CopiedField>(null);

  // メインカラーの派生値
  const rgb = useMemo(() => hexToRgb(hex), [hex]);
  const hsl = useMemo(() => (rgb ? rgbToHsl(rgb) : null), [rgb]);

  // 補色・類似色
  const complementary = useMemo(
    () => (hsl ? getComplementaryColor(hsl) : null),
    [hsl]
  );
  const analogous = useMemo(
    () => (hsl ? getAnalogousColors(hsl) : null),
    [hsl]
  );

  // コントラスト比
  const contrastResult = useMemo<ContrastResult | null>(() => {
    const fgRgb = hexToRgb(fgHex);
    const bgRgb = hexToRgb(bgHex);
    if (!fgRgb || !bgRgb) return null;
    return getContrastRatio(fgRgb, bgRgb);
  }, [fgHex, bgHex]);

  // HEX入力からRGB/HSLを同期
  const handleHexChange = useCallback((value: string) => {
    setHex(value);
    if (isValidHex(value)) {
      const newRgb = hexToRgb(value);
      if (newRgb) {
        setRgbInput({
          r: String(newRgb.r),
          g: String(newRgb.g),
          b: String(newRgb.b),
        });
        const newHsl = rgbToHsl(newRgb);
        setHslInput({
          h: String(newHsl.h),
          s: String(newHsl.s),
          l: String(newHsl.l),
        });
      }
    }
  }, []);

  // カラーピッカーからの変更
  const handleColorPickerChange = useCallback(
    (value: string) => {
      handleHexChange(value);
    },
    [handleHexChange]
  );

  // RGB入力からHEX/HSLを同期
  const handleRgbChange = useCallback(
    (field: "r" | "g" | "b", value: string) => {
      const newInput = { ...rgbInput, [field]: value };
      setRgbInput(newInput);

      const r = parseInt(newInput.r);
      const g = parseInt(newInput.g);
      const b = parseInt(newInput.b);

      if (
        !isNaN(r) && !isNaN(g) && !isNaN(b) &&
        r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255
      ) {
        const newRgb: RGB = { r, g, b };
        const newHex = rgbToHex(newRgb);
        setHex(newHex);
        const newHsl = rgbToHsl(newRgb);
        setHslInput({
          h: String(newHsl.h),
          s: String(newHsl.s),
          l: String(newHsl.l),
        });
      }
    },
    [rgbInput]
  );

  // HSL入力からHEX/RGBを同期
  const handleHslChange = useCallback(
    (field: "h" | "s" | "l", value: string) => {
      const newInput = { ...hslInput, [field]: value };
      setHslInput(newInput);

      const h = parseInt(newInput.h);
      const s = parseInt(newInput.s);
      const l = parseInt(newInput.l);

      if (
        !isNaN(h) && !isNaN(s) && !isNaN(l) &&
        h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100
      ) {
        const newHsl: HSL = { h, s, l };
        const newRgb = hslToRgb(newHsl);
        setHex(rgbToHex(newRgb));
        setRgbInput({
          r: String(newRgb.r),
          g: String(newRgb.g),
          b: String(newRgb.b),
        });
      }
    },
    [hslInput]
  );

  // コピー
  const handleCopy = useCallback(
    async (text: string, field: string) => {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    },
    []
  );

  // HSL から HEX 文字列
  const hslToHex = (hslVal: HSL) => rgbToHex(hslToRgb(hslVal));

  return (
    <div className="flex h-full items-start justify-center py-4 px-4">
      <div className="w-full max-w-2xl">
        <Breadcrumbs items={[{ label: t("breadcrumb") }]} />

        <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border mt-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("description")}
            </p>
          </div>

          {/* カラーピッカー + プレビュー */}
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={isValidHex(hex) ? hex : "#000000"}
              onChange={(e) => handleColorPickerChange(e.target.value)}
              className="w-16 h-16 rounded-lg cursor-pointer border-0 p-0"
              aria-label={t("colorPicker")}
            />
            <div
              className="flex-1 h-16 rounded-lg border"
              style={{ backgroundColor: isValidHex(hex) ? hex : "#000000" }}
            />
          </div>

          {/* HEX 入力 */}
          <div className="space-y-2">
            <Label>HEX</Label>
            <div className="flex gap-2">
              <Input
                value={hex}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#000000"
                className="font-mono"
              />
              <CopyButton
                onClick={() => handleCopy(hex, "hex")}
                copied={copiedField === "hex"}
                label={tCommon("copy")}
                copiedLabel={tCommon("copied")}
              />
            </div>
          </div>

          {/* RGB 入力 */}
          <div className="space-y-2">
            <Label>RGB</Label>
            <div className="flex gap-2">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgbInput.r}
                  onChange={(e) => handleRgbChange("r", e.target.value)}
                  placeholder="R"
                  className="font-mono"
                />
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgbInput.g}
                  onChange={(e) => handleRgbChange("g", e.target.value)}
                  placeholder="G"
                  className="font-mono"
                />
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgbInput.b}
                  onChange={(e) => handleRgbChange("b", e.target.value)}
                  placeholder="B"
                  className="font-mono"
                />
              </div>
              <CopyButton
                onClick={() =>
                  rgb && handleCopy(formatRgb(rgb), "rgb")
                }
                copied={copiedField === "rgb"}
                label={tCommon("copy")}
                copiedLabel={tCommon("copied")}
              />
            </div>
          </div>

          {/* HSL 入力 */}
          <div className="space-y-2">
            <Label>HSL</Label>
            <div className="flex gap-2">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  min={0}
                  max={360}
                  value={hslInput.h}
                  onChange={(e) => handleHslChange("h", e.target.value)}
                  placeholder="H"
                  className="font-mono"
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={hslInput.s}
                  onChange={(e) => handleHslChange("s", e.target.value)}
                  placeholder="S"
                  className="font-mono"
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={hslInput.l}
                  onChange={(e) => handleHslChange("l", e.target.value)}
                  placeholder="L"
                  className="font-mono"
                />
              </div>
              <CopyButton
                onClick={() =>
                  hsl && handleCopy(formatHsl(hsl), "hsl")
                }
                copied={copiedField === "hsl"}
                label={tCommon("copy")}
                copiedLabel={tCommon("copied")}
              />
            </div>
          </div>

          {/* 補色・類似色 */}
          {hsl && complementary && analogous && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("relatedColors")}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <ColorSwatch
                  label={t("analogous") + " 1"}
                  hex={hslToHex(analogous[0])}
                />
                <ColorSwatch
                  label={t("complementary")}
                  hex={hslToHex(complementary)}
                />
                <ColorSwatch
                  label={t("analogous") + " 2"}
                  hex={hslToHex(analogous[1])}
                />
              </div>
            </div>
          )}

          {/* コントラストチェッカー */}
          <div className="space-y-3 border-t pt-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("contrastChecker")}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("foreground")}</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={fgHex}
                    onChange={(e) => setFgHex(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  />
                  <Input
                    value={fgHex}
                    onChange={(e) => setFgHex(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("background")}</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={bgHex}
                    onChange={(e) => setBgHex(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  />
                  <Input
                    value={bgHex}
                    onChange={(e) => setBgHex(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            {/* プレビュー */}
            <div
              className="rounded-lg p-4 border text-center"
              style={{
                backgroundColor: bgHex,
                color: fgHex,
              }}
            >
              <p className="text-lg font-semibold">{t("previewText")}</p>
              <p className="text-sm">{t("previewSmallText")}</p>
            </div>

            {/* コントラスト比結果 */}
            {contrastResult && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    {t("contrastRatio")}
                  </p>
                  <p className="text-xl font-bold mt-1">
                    {contrastResult.ratio}:1
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <WcagBadge
                    label="AA"
                    pass={contrastResult.wcagAA}
                    t={t}
                  />
                  <WcagBadge
                    label="AA+"
                    description={t("largeText")}
                    pass={contrastResult.wcagAALarge}
                    t={t}
                  />
                  <WcagBadge
                    label="AAA"
                    pass={contrastResult.wcagAAA}
                    t={t}
                  />
                  <WcagBadge
                    label="AAA+"
                    description={t("largeText")}
                    pass={contrastResult.wcagAAALarge}
                    t={t}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyButton({
  onClick,
  copied,
  label,
  copiedLabel,
}: {
  onClick: () => void;
  copied: boolean;
  label: string;
  copiedLabel: string;
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="shrink-0"
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </Button>
  );
}

function ColorSwatch({
  label,
  hex,
}: {
  label: string;
  hex: string;
}) {
  return (
    <div className="text-center">
      <div
        className="h-12 rounded-lg border mb-1"
        style={{ backgroundColor: hex }}
      />
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-xs font-mono text-gray-500">{hex}</p>
    </div>
  );
}

function WcagBadge({
  label,
  description,
  pass,
  t,
}: {
  label: string;
  description?: string;
  pass: boolean;
  t: ReturnType<typeof useTranslations<"colorConverter">>;
}) {
  return (
    <div
      className={`rounded-md p-2 text-center text-xs ${
        pass
          ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
          : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
      }`}
    >
      <p className="font-semibold">{label}</p>
      {description && (
        <p className="text-[10px] opacity-70">{description}</p>
      )}
      <p>{pass ? t("pass") : t("fail")}</p>
    </div>
  );
}
