import { generateRandomIntegers, type GeneratorOptions } from "@/lib/utils/random-integer"
import { NextRequest, NextResponse } from "next/server"

const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER
const MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER

/**
 * リクエストボディを検証
 */
function validateRequest(body: unknown): {
  valid: boolean
  error?: string
  data?: GeneratorOptions
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const req = body as Record<string, unknown>

  // min の検証
  if (typeof req.min !== 'number' || !Number.isInteger(req.min)) {
    return { valid: false, error: 'min must be an integer' }
  }
  if (req.min < MIN_SAFE_INTEGER || req.min > MAX_SAFE_INTEGER) {
    return { valid: false, error: `min must be between ${MIN_SAFE_INTEGER} and ${MAX_SAFE_INTEGER}` }
  }

  // max の検証
  if (typeof req.max !== 'number' || !Number.isInteger(req.max)) {
    return { valid: false, error: 'max must be an integer' }
  }
  if (req.max < MIN_SAFE_INTEGER || req.max > MAX_SAFE_INTEGER) {
    return { valid: false, error: `max must be between ${MIN_SAFE_INTEGER} and ${MAX_SAFE_INTEGER}` }
  }

  // distribution の検証
  if (typeof req.distribution !== 'string' || !['uniform', 'normal'].includes(req.distribution)) {
    return { valid: false, error: 'distribution must be "uniform" or "normal"' }
  }

  // count の検証
  if (typeof req.count !== 'number' || !Number.isInteger(req.count)) {
    return { valid: false, error: 'count must be an integer' }
  }
  if (req.count < 1 || req.count > 100) {
    return { valid: false, error: 'count must be between 1 and 100' }
  }

  // seed の検証
  if (typeof req.seed !== 'number' || !Number.isInteger(req.seed)) {
    return { valid: false, error: 'seed must be an integer' }
  }
  if (req.seed < -1 || req.seed > MAX_SAFE_INTEGER) {
    return { valid: false, error: `seed must be between -1 and ${MAX_SAFE_INTEGER}` }
  }

  const options: GeneratorOptions = {
    min: req.min as number,
    max: req.max as number,
    distribution: req.distribution as 'uniform' | 'normal',
    count: req.count as number,
    seed: req.seed as number,
  }

  return { valid: true, data: options }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = validateRequest(body)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    const options = validation.data!
    const results = generateRandomIntegers(options)

    // 実際に使用されたシード値を返す
    const actualSeed = options.seed === -1 ? Date.now() : options.seed

    return NextResponse.json({
      success: true,
      data: {
        results,
        seed: actualSeed,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
