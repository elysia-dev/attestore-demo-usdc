import { NextRequest, NextResponse } from 'next/server'

const TOSS_API_BASE = 'https://api.tosspayments.com/v1/payments'

export async function POST(request: NextRequest) {
  const secretKey = process.env.TOSS_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json(
      { error: 'TOSS_SECRET_KEY is not set' },
      { status: 500 },
    )
  }

  let body: { paymentKey?: unknown; orderId?: unknown; amount?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { paymentKey, orderId, amount } = body
  if (
    typeof paymentKey !== 'string' ||
    typeof orderId !== 'string' ||
    typeof amount !== 'number' ||
    !Number.isFinite(amount)
  ) {
    return NextResponse.json(
      { error: 'paymentKey, orderId, amount are required' },
      { status: 400 },
    )
  }

  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`

  let lookup = await fetch(
    `${TOSS_API_BASE}/${encodeURIComponent(paymentKey)}`,
    {
      method: 'GET',
      headers: { Authorization: authHeader },
    },
  )
  let data = await lookup.json()

  if (lookup.ok && data.status === 'IN_PROGRESS') {
    const confirm = await fetch(`${TOSS_API_BASE}/confirm`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })
    data = await confirm.json()
    lookup = confirm
  }

  return NextResponse.json(data, { status: lookup.status })
}
