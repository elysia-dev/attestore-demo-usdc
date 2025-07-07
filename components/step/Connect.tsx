import CustomConnectButton from "../utils/CustomConnectButton";

export default function Connect() {
  return (
    <section>
      <div className="space-y-[15px] text-center">
        <h2 className="header">Step 1: Connect Wallet</h2>
        <p className="body">
          Connect your wallet to get started with secure, private, and
          verifiable cross-chain transfers.
        </p>
      </div>
      <div className="flex justify-center my-[30px]">
        <CustomConnectButton />
      </div>
      {/* Application Description */}

      <section className="rounded-[10px] bg-white border border-gray-border py-[30px] px-5">
        <p className="text">
          A revolutionary blockchain application that bridges traditional
          banking with decentralized finance using Zero-Knowledge proofs.
        </p>
        <section className="grid md:grid-cols-2 gap-x-2.5 gap-y-[22px] mt-6">
          <Description>
            <h4 className="body text-blue-primary font-semibold">
              Privacy_First
            </h4>
            <p className="text text-gray-600">
              Generate cryptographic proofs of your Toss bank transfers without
              revealing sensitive transaction details.
            </p>
          </Description>
          <Description>
            <h4 className="body text-blue-primary font-semibold">
              Seamless Bridge
            </h4>
            <p className="text text-gray-600">
              Convert your traditional bank transfers into blockchain tokens
              through automated escrow mechanisms.
            </p>
          </Description>
          <Description>
            <h4 className="body text-blue-primary font-semibold">
              Instant Verification
            </h4>
            <p className="text text-gray-600">
              Real-time validation of bank transfers using TLS attestation and
              zero-knowledge cryptography.
            </p>
          </Description>
          <Description>
            <h4 className="body text-blue-primary font-semibold">
              Cross-Chain Ready
            </h4>
            <p className="text text-gray-600">
              Built for interoperability across multiple blockchain networks and
              traditional financial systems.
            </p>
          </Description>
        </section>

        <section className="border border-gray-border rounded-[10px] p-5 mt-8 bg-blue-200">
          <p className="text">
            <strong className="text-blue-primary">◆ How it works:</strong>{" "}
            Create an intent → Transfer via Toss → Generate ZK proof → Mint
            tokens
          </p>
        </section>
      </section>
    </section>
  );
}

const Description = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="px-5 py-[25px] border rounded-[10px] border-gray-border bg-white space-y-[10px]">
      {children}
    </div>
  );
};
