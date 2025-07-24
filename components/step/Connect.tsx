import { cn } from '@/lib/utils'
import CustomConnectButton from '../utils/CustomConnectButton'

export default function Connect() {
  return (
    <section className="space-y-6">
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect your wallet to get started
        </p>
        <div className="flex justify-center">
          <CustomConnectButton />
        </div>
      </div>

      {/* Application Description */}
      <div className="space-y-4 pt-6 border-t border-border/50">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-secondary/50 space-y-1 transition-all duration-300 hover:bg-secondary/70 hover:scale-105 cursor-default">
            <h4 className="text-sm font-semibold text-primary">
              Privacy First
            </h4>
            <p className="text-xs text-muted-foreground">
              Zero-knowledge proofs protect your data
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/50 space-y-1 transition-all duration-300 hover:bg-secondary/70 hover:scale-105 cursor-default">
            <h4 className="text-sm font-semibold text-primary">
              Instant Bridge
            </h4>
            <p className="text-xs text-muted-foreground">
              Bank to blockchain in seconds
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/50 space-y-1 transition-all duration-300 hover:bg-secondary/70 hover:scale-105 cursor-default">
            <h4 className="text-sm font-semibold text-primary">Verified</h4>
            <p className="text-xs text-muted-foreground">
              TLS attestation ensures authenticity
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/50 space-y-1 transition-all duration-300 hover:bg-secondary/70 hover:scale-105 cursor-default">
            <h4 className="text-sm font-semibold text-primary">Cross-Chain</h4>
            <p className="text-xs text-muted-foreground">
              Works across multiple networks
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 transition-all duration-300 hover:bg-primary/20">
          <p className="text-sm text-center">
            <span className="text-primary font-semibold">How it works:</span>{' '}
            Create intent → Transfer → Prove → Mint
          </p>
        </div>
      </div>
    </section>
  )
}
