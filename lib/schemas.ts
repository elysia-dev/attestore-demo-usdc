import { z } from 'zod'

// Base schemas for common fields
export const addressSchema = z.string()
export const txHashSchema = z.string()
export const blockNumberSchema = z.number().int().positive()
export const amountSchema = z.string()

// Intent schemas
export const intentSignaledSchema = z.object({
  intentId: z.string(),
  owner: addressSchema,
  amount: amountSchema,
  to: addressSchema,
  verifier: addressSchema,
  conversionRate: z.string(),
  blockNumber: blockNumberSchema,
  txHash: txHashSchema,
})

export const intentFulfilledSchema = z.object({
  intentId: z.string(),
  owner: addressSchema,
  amount: amountSchema,
  to: addressSchema,
  verifier: addressSchema,
  depositId: z.string(),
  txHash: txHashSchema,
  blockNumber: blockNumberSchema,
})

export const intentReleasedSchema = z.object({
  intentId: z.string(),
  owner: addressSchema,
  amount: amountSchema,
  to: addressSchema,
  depositId: z.string(),
  txHash: txHashSchema,
  blockNumber: blockNumberSchema,
})

export const intentCancelledSchema = z.object({
  intentId: z.string(),
  owner: addressSchema,
  txHash: txHashSchema,
  blockNumber: blockNumberSchema,
})

// GraphQL response schemas
export const graphQLItemsResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
) =>
  z.object({
    items: z.array(itemSchema),
    totalCount: z.number().optional(),
  })

export const transferHistoryDataSchema = z.object({
  intentSignaleds: graphQLItemsResponseSchema(intentSignaledSchema),
  intentFulfilleds: graphQLItemsResponseSchema(intentFulfilledSchema),
  intentReleaseds: graphQLItemsResponseSchema(intentReleasedSchema),
  intentCancelleds: graphQLItemsResponseSchema(intentCancelledSchema),
})

export const graphQLResponseSchema = z.object({
  data: transferHistoryDataSchema,
})

// Error response schema
export const errorResponseSchema = z.object({
  error: z.string(),
})

// API response schemas
export const transferHistoryApiResponseSchema = z.union([
  graphQLResponseSchema,
  errorResponseSchema,
])

// Type exports
export type IntentSignaled = z.infer<typeof intentSignaledSchema>
export type IntentFulfilled = z.infer<typeof intentFulfilledSchema>
export type IntentReleased = z.infer<typeof intentReleasedSchema>
export type IntentCancelled = z.infer<typeof intentCancelledSchema>
export type TransferHistoryData = z.infer<typeof transferHistoryDataSchema>
export type GraphQLResponse = z.infer<typeof graphQLResponseSchema>

export type ErrorResponse = z.infer<typeof errorResponseSchema>
