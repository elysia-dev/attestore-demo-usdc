export const ErrorType = {
  // Intent
  NO_INTENT_FOUND: 'No Intent found',
  INTENT_LOOKUP_FAILED: 'Failed to lookup Intent ID',

  INTENT_NOT_FOUND: 'Intent ID {id} not found',
  INTENT_CANCEL_FAILED: 'Cancel intent failed: {error}',

  // Signal
  REDEEM_NOT_FOUND: 'Redeem ID {id} not found',
  NO_REDEEM_FOUND: 'No Redeem request found',
  REDEEM_LOOKUP_FAILED: 'Failed to lookup Redeem ID',
  INTENT_SIGNAL_FAILED: 'Intent signal failed: {error}',
  INSUFFICIENT_BALANCE: 'Insufficient token balance for redeem request',
  CANCEL_REDEEM_FAILED: 'Cancel redeem failed: {error}',
  REDEEM_ALREADY_EXISTS:
    'You already have an active redeem request. Please cancel it first.',

  REQUIRED_FIELDS_MISSING: 'Please fill in all required fields',
  ACCOUNT_NUMBER_EMPTY: 'Account number cannot be empty',

  // Proof
  PROOF_GENERATION_FAILED: 'Failed to generate ZK Proof. Please try again.',

  // Fulfillment
  MISSING_INTENT_OR_PROOF: 'Missing intentId or proofResult',
} as const
