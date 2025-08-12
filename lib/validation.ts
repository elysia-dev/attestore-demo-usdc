import { z } from 'zod'

/**
 * Validates API response data with Zod schema
 * @param data - Raw response data
 * @param schema - Zod schema to validate against
 * @returns Validation result with success status and data/error
 */
export function validateApiResponse<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  // Format validation errors for better debugging
  const errorMessages = result.error.errors
    .map((err) => `${err.path.join('.')}: ${err.message}`)
    .join(', ')

  return {
    success: false,
    error: `Validation failed: ${errorMessages}`,
  }
}
