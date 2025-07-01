import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Connect() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Step 1: Connect Wallet
      </h2>

      <p className="text-gray-600 mb-8">
        Connect your wallet to get started with secure, private, and verifiable
        cross-chain transfers.
      </p>
      <div className="flex justify-center">
        <ConnectButton />
      </div>
      {/* Application Description */}

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 mb-8 max-w-4xl mx-auto mt-8">
        <div className="text-left space-y-4 text-gray-700">
          <p className="text-lg leading-relaxed">
            A revolutionary blockchain application that bridges traditional
            banking with decentralized finance using Zero-Knowledge proofs.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-blue-600 mb-2">
                🔒 Privacy-First
              </h4>
              <p className="text-sm">
                Generate cryptographic proofs of your Toss bank transfers
                without revealing sensitive transaction details.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-green-600 mb-2">
                🔄 Seamless Bridge
              </h4>
              <p className="text-sm">
                Convert your traditional bank transfers into blockchain tokens
                through automated escrow mechanisms.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-purple-600 mb-2">
                ⚡ Instant Verification
              </h4>
              <p className="text-sm">
                Real-time validation of bank transfers using TLS attestation and
                zero-knowledge cryptography.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-orange-600 mb-2">
                🌐 Cross-Chain Ready
              </h4>
              <p className="text-sm">
                Built for interoperability across multiple blockchain networks
                and traditional financial systems.
              </p>
            </div>
          </div>

          <div className="bg-blue-100 p-4 rounded-lg mt-6">
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong> Create an intent → Transfer via
              Toss → Generate ZK proof → Mint tokens
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
