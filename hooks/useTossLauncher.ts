import { TOSS_APPLE, TOSS_PLAY } from '@/constant'
import { useCallback, useEffect, useRef, useState } from 'react'

type Fallback = 'android' | 'ios' | null

const BUFFER_TIME = 200
const TIMEOUT = 3000

export const useTossLauncher = (deepLink: string) => {
  const [fallback, setFallback] = useState<Fallback>(null)
  const timer = useRef<number | null>(null)

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const storeURL = isIOS ? TOSS_APPLE : TOSS_PLAY

  const launch = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
    }

    const started = Date.now()
    window.location.href = deepLink

    timer.current = window.setTimeout(() => {
      if (Date.now() - started < TIMEOUT + BUFFER_TIME) {
        setFallback(isIOS ? 'ios' : 'android')
      }
      timer.current = null
    }, TIMEOUT)
  }, [deepLink, isIOS])

  const reset = () => setFallback(null)

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current)
      }
    }
  }, [])

  return { launch, fallback, storeURL, reset }
}
