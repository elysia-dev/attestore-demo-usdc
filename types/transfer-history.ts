// Re-export types from Zod schemas for backward compatibility
export type {
  IntentSignaled,
  IntentFulfilled,
  IntentReleased,
  IntentCancelled,
  TransferHistoryData,
  GraphQLResponse,
} from '@/lib/schemas'

export enum IntentStatus {
  SIGNALED = 'signaled',
  FULFILLED = 'fulfilled',
  RELEASED = 'released',
  CANCELLED = 'cancelled',
}

import type {
  IntentSignaled,
  IntentFulfilled,
  IntentReleased,
  IntentCancelled,
} from '@/lib/schemas'
export interface GraphQLItemsResponse<T> {
  items: T[]
  totalCount?: number
}

export interface TransferHistoryResponse {
  intentSignaleds: (IntentSignaled & { owner: string })[]
  intentFulfilleds: (IntentFulfilled & { owner: string })[]
  intentReleaseds: (IntentReleased & { owner: string })[]
  intentCancelleds: (IntentCancelled & { owner: string })[]
}

export type Intent = {
  intentId: string
  owner: string
  amount: string
  to: string
  verifier: string
  conversionRate: string
  blockNumber: number
  txHash: string
  timestamp: number
  depositId?: string
  status: IntentStatus
}
