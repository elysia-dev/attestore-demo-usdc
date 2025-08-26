import { NextRequest, NextResponse } from 'next/server'
import { isProduction } from '@/constant'
import { base, baseSepolia } from 'viem/chains'
import { kairos, kaia } from '@/lib/network'

const HISTORY_API_URL = isProduction
  ? process.env.HISTORY_API_URL_PROD
  : process.env.HISTORY_API_URL_TEST

const getChainNameFromId = (chainId: number): string => {
  switch (chainId) {
    case base.id:
      return 'base'
    case baseSepolia.id:
      return 'baseSepolia'
    case kaia.id:
      return 'kaia'
    case kairos.id:
      return 'kairos'
    default:
      return isProduction ? 'base' : 'baseSepolia'
  }
}

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

  const { searchParams } = new URL(request.url)
  const chainId = searchParams.get('chainId')
  const chainName = chainId ? getChainNameFromId(parseInt(chainId)) : null

  const whereClause = chainName
    ? `{intentId: "${intentId}", chainName: "${chainName}"}`
    : `{intentId: "${intentId}"}`

  const query = `
    {
      intentSignaleds(where: ${whereClause}) {
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
          chainName
        }
        totalCount
      }
      intentFulfilleds(where: ${whereClause}) {
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
          chainName
        }
      }
      intentReleaseds(where: ${whereClause}) {
        items {
          txHash
          owner
          to
          intentId
          depositId
          blockNumber
          amount
          timestamp
          chainName
        }
      }
      intentCancelleds(where: ${whereClause}) {
        items {
          intentId
          owner
          txHash
          blockNumber
          timestamp
          chainName
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
