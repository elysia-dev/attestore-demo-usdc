import { create } from 'zustand'
import { DepositDetail } from '@/components/Home'
import ADDRESSES from '@/lib/addresses'
import { ESCROW_ABI } from '@/lib/abi'

interface DepositState {
  myDeposits: DepositDetail[]
  depositDetail: DepositDetail | null
  currentAddress: string
  isLoadingDeposits: boolean
  isLoadingIntentIds: boolean

  // Actions
  setCurrentAddress: (address: string) => void
  setIsLoadingDeposits: (loading: boolean) => void
  setIsLoadingIntentIds: (loading: boolean) => void
  fetchAndFilterDeposits: (publicClient: any) => Promise<void>
  fetchDepositIntentIds: (
    publicClient: any,
    depositId: number,
  ) => Promise<bigint[]>
  setDepositDetail: (deposit: DepositDetail | null) => void
  createDeposit: (deposit: DepositDetail) => void
}

const useDepositStore = create<DepositState>((set, get) => ({
  myDeposits: [],
  depositDetail: null,
  currentAddress: '',
  isLoadingDeposits: false,
  isLoadingIntentIds: false,

  setCurrentAddress: (address) => set({ currentAddress: address }),

  setIsLoadingDeposits: (loading) => set({ isLoadingDeposits: loading }),

  setIsLoadingIntentIds: (loading) => set({ isLoadingIntentIds: loading }),

  fetchAndFilterDeposits: async (publicClient) => {
    const { currentAddress } = get()
    if (!currentAddress || !publicClient) return

    set({ isLoadingDeposits: true })

    try {
      // Get depositCounter
      const depositCounter = await publicClient.readContract({
        address: ADDRESSES.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'depositCounter',
      })

      if (!depositCounter || Number(depositCounter) === 0) {
        set({ myDeposits: [], depositDetail: null, isLoadingDeposits: false })
        return
      }

      // Fetch all deposits
      const allDeposits: DepositDetail[] = []

      for (let i = 0; i < Number(depositCounter); i++) {
        const depositId = i + 1
        try {
          const depositData = await publicClient.readContract({
            address: ADDRESSES.ESCROW,
            abi: ESCROW_ABI,
            functionName: 'deposits',
            args: [BigInt(depositId)],
          })

          if (depositData) {
            const [
              depositor,
              token,
              amount,
              intentAmountRange,
              acceptingIntents,
              remainingDeposits,
              outstandingIntentAmount,
            ] = depositData as any

            // Filter out empty deposits
            if (depositor !== '0x0000000000000000000000000000000000000000') {
              allDeposits.push({
                id: depositId,
                depositor,
                token,
                amount,
                intentAmountRange,
                acceptingIntents,
                remainingDeposits,
                outstandingIntentAmount,
                // intentIds will be fetched separately when needed
              })
            }
          }
        } catch (err) {
          console.error(`Failed to fetch deposit ${depositId}:`, err)
        }
      }

      // Filter deposits for current address
      const filtered = allDeposits.filter(
        (d) => d.depositor.toLowerCase() === currentAddress.toLowerCase(),
      )

      // Set the latest deposit as depositDetail
      const latest =
        filtered.length > 0
          ? filtered.reduce((a, b) => (a.id > b.id ? a : b))
          : null

      set({
        myDeposits: filtered,
        depositDetail: latest,
        isLoadingDeposits: false,
      })
    } catch (error) {
      console.error('Failed to fetch deposits:', error)
      set({ isLoadingDeposits: false })
      throw error
    }
  },

  fetchDepositIntentIds: async (publicClient, depositId) => {
    const { isLoadingIntentIds } = get()
    if (isLoadingIntentIds || !publicClient) return []

    set({ isLoadingIntentIds: true })

    try {
      const intentIds = await publicClient.readContract({
        address: ADDRESSES.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'getDepositIntentIds',
        args: [BigInt(depositId)],
      })

      set({ isLoadingIntentIds: false })
      return intentIds || []
    } catch (error) {
      console.error('Failed to fetch deposit intent IDs:', error)
      set({ isLoadingIntentIds: false })
      return []
    }
  },

  setDepositDetail: (deposit) => set({ depositDetail: deposit }),

  createDeposit: (deposit) => {
    const { myDeposits, currentAddress } = get()

    // Add to myDeposits if it's the current user's deposit
    if (deposit.depositor.toLowerCase() === currentAddress.toLowerCase()) {
      const updatedDeposits = [...myDeposits, deposit]
      set({
        myDeposits: updatedDeposits,
        depositDetail: deposit, // Set new deposit as current detail
      })
    }
  },
}))

export default useDepositStore
