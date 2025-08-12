export enum IntentStatus {
  SIGNALED = 'signaled',
  FULFILLED = 'fulfilled',
  RELEASED = 'released',
  CANCELLED = 'cancelled',
}

export type IntentWithStatus =
  | (IntentSignaled & { status: IntentStatus.SIGNALED })
  | (IntentFulfilled & { status: IntentStatus.FULFILLED })
  | (IntentReleased & { status: IntentStatus.RELEASED })
  | (IntentCancelled & { status: IntentStatus.CANCELLED })

export interface IntentSignaled {
  intentId: string
  owner: string
  amount: string
  to: string
  verifier: string
  conversionRate: string
  blockNumber: number
  txHash: string
}

export interface IntentFulfilled {
  intentId: string
  owner: string
  amount: string
  to: string
  verifier: string
  depositId: string
  txHash: string
  blockNumber: number
}

export interface IntentReleased {
  intentId: string
  owner: string
  amount: string
  to: string
  depositId: string
  txHash: string
  blockNumber: number
}

export interface IntentCancelled {
  intentId: string
  owner: string
  txHash: string
  blockNumber: number
}

export interface GraphQLItemsResponse<T> {
  items: T[]
  totalCount?: number
}

export interface TransferHistoryData {
  intentSignaleds: GraphQLItemsResponse<IntentSignaled>
  intentFulfilleds: GraphQLItemsResponse<IntentFulfilled>
  intentReleaseds: GraphQLItemsResponse<IntentReleased>
  intentCancelleds: GraphQLItemsResponse<IntentCancelled>
}

export interface GraphQLResponse {
  data: TransferHistoryData
}

export interface TransferHistoryResponse {
  intentSignaleds: (IntentSignaled & { owner: string })[]
  intentFulfilleds: (IntentFulfilled & { owner: string })[]
  intentReleaseds: (IntentReleased & { owner: string })[]
  intentCancelleds: (IntentCancelled & { owner: string })[]
}
