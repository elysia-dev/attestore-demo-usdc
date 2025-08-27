'use client'

import { useTranslations } from 'next-intl'
import { usePrivy } from '@privy-io/react-auth'
import ConnectWallet from '../utils/ConnectWallet'

export default function Connect() {
  const t = useTranslations('connect')

  return (
    <section className="space-y-6">
      <div className="text-center space-y-4">
        <ConnectWallet />
      </div>

      {/* Application Description */}
      <div className="space-y-4 pt-6 border-t border-border/50">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-secondary/50 space-y-1 transition-all duration-300 hover:bg-secondary/70 hover:scale-105 cursor-default">
            <h4 className="text-sm font-semibold text-primary">
              {t('privacyFirst')}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t('privacyFirstDesc')}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/50 space-y-1 transition-all duration-300 hover:bg-secondary/70 hover:scale-105 cursor-default">
            <h4 className="text-sm font-semibold text-primary">
              {t('instantBridge')}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t('instantBridgeDesc')}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/50 space-y-1 transition-all duration-300 hover:bg-secondary/70 hover:scale-105 cursor-default">
            <h4 className="text-sm font-semibold text-primary">
              {t('verified')}
            </h4>
            <p className="text-xs text-muted-foreground">{t('verifiedDesc')}</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/50 space-y-1 transition-all duration-300 hover:bg-secondary/70 hover:scale-105 cursor-default">
            <h4 className="text-sm font-semibold text-primary">
              {t('crossChain')}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t('crossChainDesc')}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 transition-all duration-300 hover:bg-primary/20">
          <p className="text-sm text-left">
            <span className="text-primary font-semibold">
              {t('howItWorks')}
            </span>{' '}
            <br />
            {t('howItWorksSteps')}
          </p>
        </div>
      </div>
    </section>
  )
}
