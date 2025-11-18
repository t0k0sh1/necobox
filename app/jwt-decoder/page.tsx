"use client"

import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"
import { useRef, useState } from "react"

interface DecodedJWT {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

export default function JWTDecoderPage() {
  const [jwtInput, setJwtInput] = useState('')
  const [decodedData, setDecodedData] = useState<DecodedJWT | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  // コピーフィードバックのタイムアウトIDを保持
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // コピー成功時のボタンスタイル
  const COPIED_BUTTON_CLASSES = "bg-green-50 border-green-200 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"

  /**
   * Base64URLデコード
   */
  const base64UrlDecode = (str: string): string => {
    // Base64URL を Base64 に変換
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')

    // パディングを追加
    const pad = base64.length % 4
    if (pad) {
      if (pad === 1) {
        throw new Error('Invalid Base64URL string')
      }
      base64 += '==='.slice(0, 4 - pad)
    }

    // デコード（TextDecoder APIを使用）
    try {
      const binaryString = atob(base64)
      const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0))
      return new TextDecoder().decode(bytes)
    } catch (e) {
      throw new Error('Failed to decode Base64URL string')
    }
  }

  /**
   * JWTをデコード
   */
  const handleDecode = () => {
    setError(null)
    setDecodedData(null)

    try {
      const trimmedJwt = jwtInput.trim()

      if (!trimmedJwt) {
        setError('Please enter a JWT token')
        return
      }

      const parts = trimmedJwt.split('.')

      if (parts.length !== 3) {
        setError('Invalid JWT format. Expected format: header.payload.signature')
        return
      }

      const [headerPart, payloadPart, signaturePart] = parts

      // Validate that headerPart and payloadPart are non-empty
      if (!headerPart || !payloadPart) {
        setError('Invalid JWT: header and payload must be non-empty')
        return
      }

      // Header をデコード
      const headerJson = base64UrlDecode(headerPart)
      const header = JSON.parse(headerJson)

      // Payload をデコード
      const payloadJson = base64UrlDecode(payloadPart)
      const payload = JSON.parse(payloadJson)

      setDecodedData({
        header,
        payload,
        signature: signaturePart,
      })
    } catch (e) {
      setError(`Failed to decode JWT: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  /**
   * セクションをコピー
   */
  const handleCopy = async (section: string, data: string) => {
    try {
      await navigator.clipboard.writeText(data)

      // 以前のタイムアウトをクリア
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      setCopiedSection(section)

      // 新しいタイムアウトを設定し、IDを保存
      timeoutRef.current = setTimeout(() => {
        setCopiedSection(null)
        timeoutRef.current = null
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
      setError('Failed to copy to clipboard.')
    }
  }

  /**
   * すべてをコピー
   */
  const handleCopyAll = async () => {
    if (!decodedData) return

    const text = JSON.stringify(
      {
        header: decodedData.header,
        payload: decodedData.payload,
        signature: decodedData.signature,
      },
      null,
      2
    )
    try {
      await navigator.clipboard.writeText(text)

      // 以前のタイムアウトをクリア
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      setCopiedSection('all')

      // 新しいタイムアウトを設定し、IDを保存
      timeoutRef.current = setTimeout(() => {
        setCopiedSection(null)
        timeoutRef.current = null
      }, 2000)
    } catch (err) {
      console.error('Failed to copy all text:', err)
      setError('Failed to copy to clipboard.')
    }
  }

  /**
   * クリア
   */
  const handleClear = () => {
    setJwtInput('')
    setDecodedData(null)
    setError(null)
  }

  return (
    <div className="flex h-full items-start justify-center py-4 px-4">
      <div className="w-full max-w-4xl">
        <Breadcrumbs items={[{ label: "JWT Decoder" }]} />
        <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border mt-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">JWT Decoder</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Decode JWT tokens without signature verification
            </p>
          </div>

          {/* Input Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                JWT Token
              </label>
              <textarea
                value={jwtInput}
                onChange={(e) => setJwtInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900 dark:border-gray-700 font-mono text-sm min-h-24 resize-y"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleDecode}
                className="flex-1"
              >
                Decode
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Decoded Results */}
          {decodedData && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Decoded Data</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAll}
                  className={copiedSection === 'all' ? COPIED_BUTTON_CLASSES : ""}
                >
                  {copiedSection === 'all' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All
                    </>
                  )}
                </Button>
              </div>

              {/* Header */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-medium">Header</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy('header', JSON.stringify(decodedData.header, null, 2))}
                    className={copiedSection === 'header' ? COPIED_BUTTON_CLASSES : ""}
                  >
                    {copiedSection === 'header' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md border overflow-x-auto">
                  <code className="text-sm">{JSON.stringify(decodedData.header, null, 2)}</code>
                </pre>
              </div>

              {/* Payload */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-medium">Payload</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy('payload', JSON.stringify(decodedData.payload, null, 2))}
                    className={copiedSection === 'payload' ? COPIED_BUTTON_CLASSES : ""}
                  >
                    {copiedSection === 'payload' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md border overflow-x-auto">
                  <code className="text-sm">{JSON.stringify(decodedData.payload, null, 2)}</code>
                </pre>
              </div>

              {/* Signature */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-medium">Signature</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy('signature', decodedData.signature)}
                    className={copiedSection === 'signature' ? COPIED_BUTTON_CLASSES : ""}
                  >
                    {copiedSection === 'signature' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md border overflow-x-auto">
                  <code className="text-sm break-all">{decodedData.signature}</code>
                </pre>
              </div>

              {/* Warning */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  <strong>Note:</strong> This tool decodes JWT tokens without verifying the signature.
                  Do not use decoded data for authentication or authorization without proper signature verification.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
