import { NextRequest, NextResponse } from 'next/server'
import { isProduction } from '@/constant'

const HISTORY_API_URL = isProduction
  ? process.env.HISTORY_API_URL_PROD
  : process.env.HISTORY_API_URL_TEST

export async function GET(request: NextRequest) {
  if (!HISTORY_API_URL) {
    return NextResponse.json(
      { error: 'HISTORY_API_URL is not set' },
      { status: 500 },
    )
  }

  const result = await fetch(HISTORY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
      {
  intentSignaleds {
    items {
      intentId
      owner
      to
      verifier
      amount
      conversionRate
      blockNumber
      txHash
    }
    totalCount
  }
  intentFulfilleds {
    items {
      intentId
      owner
      amount
      blockNumber
      depositId
      txHash
      to
      verifier
    }
  }
  intentReleaseds {
    items {
      txHash
      owner
      to
      intentId
      depositId
      blockNumber
      amount
    }
  }
  intentCancelleds {
    items {
      intentId
      owner
      txHash
      blockNumber
    }
  }
}`,
    }),
  })
  const rawData = await result.json()
  return NextResponse.json(rawData)
}
