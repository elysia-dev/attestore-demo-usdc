import { NextRequest, NextResponse } from 'next/server'
import { executeFeeDelegatedTransactionERC2771 } from '@/lib/kaia-fee-delegation-erc2771'
import { kaia, kairos } from '@/lib/network'

export async function POST(request: NextRequest) {
  try {
    const { address, abi, functionName, args, chainId, userAddress } =
      await request.json()

    if (chainId !== kaia.id && chainId !== kairos.id) {
      return NextResponse.json({ error: 'Invalid chain ID' }, { status: 500 })
    }

    // 문자열로 전송된 BigInt 값들을 다시 BigInt로 변환
    const deserializeArgs = (args: unknown[] | undefined) => {
      if (!args) return args
      return args.map((arg) => {
        if (typeof arg === 'string' && /^\d+$/.test(arg) && arg.length > 15) {
          return BigInt(arg)
        }
        return arg
      })
    }

    const deserializedArgs = deserializeArgs(args)

    const feePayerPrivateKey = process.env.FEE_PAYER_PRIVATE_KEY
    const feePayerAddress = process.env.FEE_PAYER_ADDRESS || 'Unknown'

    if (!feePayerPrivateKey) {
      return NextResponse.json(
        { error: 'Fee payer private key not configured' },
        { status: 500 },
      )
    }

    const txHash = await executeFeeDelegatedTransactionERC2771({
      address,
      abi,
      functionName,
      args: deserializedArgs,
      chainId,
      userAddress,
      feePayerPrivateKey,
    })

    return NextResponse.json({
      success: true,
      txHash,
      feePayerAddress,
      isERC2771: true,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('❌ Fee delegation API error:', error)
    return NextResponse.json(
      {
        error: error?.message || 'Fee delegation failed',
        details: error?.cause || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
