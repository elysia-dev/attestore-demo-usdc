import { createContext, useState } from 'react'

export const ErrorContext = createContext<{
  error: string | null
  setError: (type: string, params?: Record<string, string | number>) => void
  freeError: () => void
}>({
  error: null,
  setError: () => {},
  freeError: () => {},
})

export const ErrorProvider = ({ children }: { children: React.ReactNode }) => {
  const [error, setErrorState] = useState<string | null>(null)

  const getErrorMessage = (
    type: string,
    params?: Record<string, string | number>,
  ): string => {
    let message = type as string

    // 파라미터 치환
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        message = message.replace(`{${key}}`, String(value))
      })
    }

    return message
  }

  const setError = (type: string, params?: Record<string, string | number>) => {
    const errorMessage = getErrorMessage(type, params)
    setErrorState(errorMessage)
  }

  const freeError = () => {
    setErrorState(null)
  }
  return (
    <ErrorContext.Provider value={{ error, setError, freeError }}>
      {children}
    </ErrorContext.Provider>
  )
}
