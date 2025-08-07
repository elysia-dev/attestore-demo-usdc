'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useTransition } from 'react'

export default function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const toggleLanguage = () => {
    const newLocale = locale === 'ko' ? 'en' : 'ko'
    startTransition(() => {
      router.replace(pathname, { locale: newLocale })
    })
  }

  return (
    <button
      onClick={toggleLanguage}
      disabled={isPending}
      className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 disabled:opacity-50"
      aria-label="Toggle language">
      <span className="text-sm font-medium text-white">
        {locale === 'ko' ? 'EN' : 'KO'}
      </span>
    </button>
  )
}
