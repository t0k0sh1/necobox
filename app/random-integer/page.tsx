"use client"

import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Check, Copy, Loader2 } from "lucide-react"
import { useState } from "react"

interface GeneratorOptions {
  min: number
  max: number
  distribution: 'uniform' | 'normal'
  count: number
  seed: number
}

export default function RandomIntegerPage() {
  const [minInput, setMinInput] = useState('1')
  const [maxInput, setMaxInput] = useState('10000')
  const [distribution, setDistribution] = useState<'uniform' | 'normal'>('uniform')
  const [countInput, setCountInput] = useState('1')
  const [seedInput, setSeedInput] = useState('-1')
  const [results, setResults] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  /**
   * 入力値を補正
   */
  const normalizeInputs = (): GeneratorOptions => {
    // 文字列から数値に変換
    let normalizedMin = parseInt(minInput, 10) || 1
    let normalizedMax = parseInt(maxInput, 10) || 10000
    let normalizedCount = parseInt(countInput, 10) || 1
    let normalizedSeed = parseInt(seedInput, 10) || -1

    // min と max を補正
    normalizedMin = Math.floor(normalizedMin)
    normalizedMax = Math.floor(normalizedMax)

    // 逆転している場合は入れ替え
    if (normalizedMin > normalizedMax) {
      [normalizedMin, normalizedMax] = [normalizedMax, normalizedMin]
    }

    // 整数範囲外の値を補正
    const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER
    const MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER
    normalizedMin = Math.max(MIN_SAFE_INTEGER, Math.min(MAX_SAFE_INTEGER, normalizedMin))
    normalizedMax = Math.max(MIN_SAFE_INTEGER, Math.min(MAX_SAFE_INTEGER, normalizedMax))

    // count を補正（1～100）
    normalizedCount = Math.max(1, Math.min(100, normalizedCount))

    // seed を補正（-1 以下は -1、上限は MAX_SAFE_INTEGER）
    if (normalizedSeed < -1) {
      normalizedSeed = -1
    } else if (normalizedSeed > MAX_SAFE_INTEGER) {
      normalizedSeed = MAX_SAFE_INTEGER
    }

    return {
      min: normalizedMin,
      max: normalizedMax,
      distribution,
      count: normalizedCount,
      seed: normalizedSeed,
    }
  }

  /**
   * ランダム整数を生成
   */
  const handleGenerate = async () => {
    setLoading(true)
    try {
      const options = normalizeInputs()

      const response = await fetch('/api/v1/random-integer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.data.results)
      } else {
        console.error('Error:', data.error)
      }
    } catch (error) {
      console.error('Error generating random integers:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 単一の値をコピー
   */
  const handleCopyValue = (value: number, index: number) => {
    navigator.clipboard.writeText(value.toString())
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  /**
   * すべての値をコピー
   */
  const handleCopyAll = () => {
    const text = results.join('\n')
    navigator.clipboard.writeText(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  /**
   * Min フィールドのフォーカスアウト時に値を補正
   */
  const handleMinBlur = () => {
    let normalizedMin = parseInt(minInput, 10) || 1
    normalizedMin = Math.floor(normalizedMin)
    const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER
    const MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER
    normalizedMin = Math.max(MIN_SAFE_INTEGER, Math.min(MAX_SAFE_INTEGER, normalizedMin))
    setMinInput(normalizedMin.toString())
  }

  /**
   * Max フィールドのフォーカスアウト時に値を補正
   */
  const handleMaxBlur = () => {
    let normalizedMax = parseInt(maxInput, 10) || 10000
    normalizedMax = Math.floor(normalizedMax)
    const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER
    const MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER
    normalizedMax = Math.max(MIN_SAFE_INTEGER, Math.min(MAX_SAFE_INTEGER, normalizedMax))
    setMaxInput(normalizedMax.toString())
  }

  /**
   * Count フィールドのフォーカスアウト時に値を補正
   */
  const handleCountBlur = () => {
    let normalizedCount = parseInt(countInput, 10) || 1
    normalizedCount = Math.max(1, Math.min(100, normalizedCount))
    setCountInput(normalizedCount.toString())
  }

  /**
   * Seed フィールドのフォーカスアウト時に値を補正
   */
  const handleSeedBlur = () => {
    let normalizedSeed = parseInt(seedInput, 10) || -1
    const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER
    if (normalizedSeed < -1) {
      normalizedSeed = -1
    } else if (normalizedSeed > MAX_SAFE_INTEGER) {
      normalizedSeed = MAX_SAFE_INTEGER
    }
    setSeedInput(normalizedSeed.toString())
  }

  /**
   * 値の桁数に応じてフォントサイズを計算
   */
  const getValueFontSize = (value: number): string => {
    const valueStr = value.toString()
    const length = valueStr.length

    if (length <= 5) return 'text-lg'
    if (length <= 10) return 'text-base'
    if (length <= 15) return 'text-sm'
    return 'text-xs'
  }

  return (
    <div className="flex h-full items-start justify-center py-4 px-4">
      <div className="w-full max-w-2xl">
        <Breadcrumbs items={[{ label: "Random Integer Generator" }]} />
        <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border mt-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">Random Integer Generator</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Generate random integers with custom parameters
            </p>
          </div>

          {/* Input Form */}
          <div className="space-y-4">
            {/* Min and Max */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Minimum Value
                </label>
                <input
                  type="number"
                  value={minInput}
                  onChange={(e) => setMinInput(e.target.value)}
                  onBlur={handleMinBlur}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Value
                </label>
                <input
                  type="number"
                  value={maxInput}
                  onChange={(e) => setMaxInput(e.target.value)}
                  onBlur={handleMaxBlur}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
            </div>

            {/* Distribution */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Probability Distribution
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="distribution"
                    value="uniform"
                    checked={distribution === 'uniform'}
                    onChange={(e) => setDistribution(e.target.value as 'uniform' | 'normal')}
                    className="w-4 h-4"
                  />
                  <span>Uniform Distribution</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="distribution"
                    value="normal"
                    checked={distribution === 'normal'}
                    onChange={(e) => setDistribution(e.target.value as 'uniform' | 'normal')}
                    className="w-4 h-4"
                  />
                  <span>Normal Distribution</span>
                </label>
              </div>
            </div>

            {/* Count */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Number of Values to Generate (1-100)
              </label>
              <input
                type="number"
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                onBlur={handleCountBlur}
                min="1"
                max="100"
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900 dark:border-gray-700"
              />
            </div>

            {/* Seed */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Seed Value (default: -1 for random)
              </label>
              <input
                type="number"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                onBlur={handleSeedBlur}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900 dark:border-gray-700"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use -1 for random seed, or specify a value for reproducible results
              </p>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Generated Values</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAll}
                  className={
                    copiedAll
                      ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                      : ""
                  }
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied All
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {results.map((value, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md border gap-2"
                  >
                    <span className={`font-mono ${getValueFontSize(value)} break-all`}>{value}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyValue(value, index)}
                      className={`flex-shrink-0 ${
                        copiedIndex === index
                          ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                          : ""
                      }`}
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
