'use client'

import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from '@privy-io/wagmi'
import { ErrorProvider } from '@/context/ErrorContext'
import { useSentryTracking } from '@/hooks/useSentryTracking'
import { wagmiConfig } from '@/lib/wagmi'
import { PrivyProvider } from '@privy-io/react-auth'
import { privyConfig } from '@/lib/privy'
import { PRIVY_APP_ID } from '@/constant'

const queryClient = new QueryClient()

function ProvidersWithTracking({ children }: { children: React.ReactNode }) {
  useSentryTracking()
  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // SSR 중에는 아무것도 렌더링하지 않음
  if (!mounted) {
    return null
  }

  return (
    <ErrorProvider>
      <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            <ProvidersWithTracking>{children}</ProvidersWithTracking>
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </ErrorProvider>
  )
}
