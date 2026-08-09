import { encodeFunctionData, type Abi, type Address, concat } from 'viem'
import {
  createWalletClient,
  http,
  privateKeyToAccount,
  kaia,
  kairos,
} from '@kaiachain/viem-ext'

interface FeeDelegatedTransactionParams {
  address: Address
  abi: Abi
  functionName: string
  args?: readonly unknown[]
  chainId: number
  userAddress: Address
  feePayerPrivateKey: string
}

export async function executeFeeDelegatedTransactionERC2771({
  address,
  abi,
  functionName,
  args,
  chainId,
  userAddress,
  feePayerPrivateKey,
}: FeeDelegatedTransactionParams): Promise<`0x${string}`> {
  try {
    const chain = chainId === kaia.id ? kaia : kairos

    const cleanKey = feePayerPrivateKey.trim()
    const formattedKey = cleanKey.startsWith('0x') ? cleanKey : `0x${cleanKey}`

    const feePayerAccount = privateKeyToAccount(formattedKey as `0x${string}`)
    const feePayerWallet = createWalletClient({
      account: feePayerAccount,
      chain,
      transport: http(),
    })
    const originalData = encodeFunctionData({ abi, functionName, args })

    const erc2771Data = concat([originalData, userAddress as `0x${string}`])

    // @kaiachain/viem-ext -> publicClient.estimateGas() doesn't work
    // Since the gas fee is delegated, it's acceptable to use this approach for now..
    const gasPrice = BigInt('25000000000') // 25 Gwei

    const txHash = await feePayerWallet.sendTransaction({
      to: address,
      data: erc2771Data,
      gas: BigInt('500000'),
      gasPrice,
    })
    return txHash
  } catch (error) {
    console.error('❌ ERC-2771 fee delegation failed:', error)
    throw error
  }
}
