import { NextRequest, NextResponse } from 'next/server'
import { isProduction } from '@/constant'

const HISTORY_API_URL = isProduction
  ? process.env.HISTORY_API_URL_PROD
  : process.env.HISTORY_API_URL_TEST

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ 'intent-id': string }> },
) {
  if (!HISTORY_API_URL) {
    return NextResponse.json(
      { error: 'HISTORY_API_URL is not set' },
      { status: 500 },
    )
  }

  const { 'intent-id': intentId } = await params

  if (!intentId) {
    return NextResponse.json(
      { error: 'Intent ID is required' },
      { status: 400 },
    )
  }

  const query = `
    {
      intentSignaleds(where: {intentId: "${intentId}"}) {
        items {
          intentId
          owner
          to
          verifier
          amount
          conversionRate
          blockNumber
          txHash
          timestamp
        }
        totalCount
      }
      intentFulfilleds(where: {intentId: "${intentId}"}) {
        items {
          intentId
          owner
          amount
          blockNumber
          depositId
          txHash
          to
          verifier
          timestamp
        }
      }
      intentReleaseds(where: {intentId: "${intentId}"}) {
        items {
          txHash
          owner
          to
          intentId
          depositId
          blockNumber
          amount
          timestamp
        }
      }
      intentCancelleds(where: {intentId: "${intentId}"}) {
        items {
          intentId
          owner
          txHash
          blockNumber
          timestamp
        }
      }
    }`

  try {
    const result = await fetch(HISTORY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    if (!result.ok) {
      throw new Error(`HTTP error! status: ${result.status}`)
    }

    const rawData = await result.json()
    return NextResponse.json(rawData)
  } catch (error) {
    console.error('Error fetching intent history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch intent history' },
      { status: 500 },
    )
  }
}
