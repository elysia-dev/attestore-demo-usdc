import { IntentStatus } from '@/types/transfer-history'
import {
  NamespaceKeys,
  Messages,
  NestedKeyOf,
  createTranslator,
} from 'next-intl'

export type TFunction<
  NestedKey extends NamespaceKeys<Messages, NestedKeyOf<Messages>> = never,
> = ReturnType<typeof createTranslator<Messages, NestedKey>>

export const getStatusText = (
  status: IntentStatus,
  tIntentStatus: TFunction,
) => {
  switch (status) {
    case IntentStatus.SIGNALED:
      return tIntentStatus('signaled')
    case IntentStatus.FULFILLED:
      return tIntentStatus('fulfilled')
    case IntentStatus.RELEASED:
      return tIntentStatus('released')
    case IntentStatus.CANCELLED:
      return tIntentStatus('cancelled')
    default:
      return ''
  }
}
