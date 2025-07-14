import { cn } from "@/lib/utils";
import CustomConnectButton from "../utils/CustomConnectButton";

export default function Connect() {
  return (
    <section>
      <div className="space-y-[15px] text-center max-sm:space-y-2">
        <h2 className="header">Step 1: Connect Wallet</h2>
        <p className="body">
          Connect your wallet to get started with secure, private, and
          verifiable cross-chain transfers.
        </p>
      </div>
      <div className="flex justify-center my-[30px] max-sm:my-5">
        <CustomConnectButton />
      </div>
      {/* Application Description */}

      <section
        className={cn(
          "rounded-[10px] bg-white border border-gray-border py-[30px] px-5",
          "max-sm:p-4 max-sm:rounded-[5px]"
        )}
      >
        <p className="text">
          A revolutionary blockchain application that bridges traditional
          banking with decentralized finance using Zero-Knowledge proofs.
        </p>
        <section
          className={cn(
            "grid md:grid-cols-2 gap-x-2.5 gap-y-[22px] mt-6",
            "max-sm:grid-cols-1 max-sm:gap-y-2.5 max-sm:mt-4"
          )}
        >
          <Description>
            <h4 className="body text-blue-primary font-semibold">
              Privacy_First
            </h4>
            <p className="text text-gray-600">
              Generate cryptographic proofs of your Bank transfers without
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

        <section
          className={cn(
            "border border-gray-border rounded-[10px] p-5 mt-8 bg-blue-200",
            "max-sm:p-3 max-sm:rounded-[5px] max-sm:mt-4"
          )}
        >
          <p className="text">
            <strong className="text-blue-primary">◆ How it works:</strong>
            <br className="sm:hidden" />
            Create an intent → Transfer via Bank → Generate ZK proof → Mint
            tokens
          </p>
        </section>
      </section>
    </section>
  );
}

const Description = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={cn(
        "px-5 py-[25px] border rounded-[10px] border-gray-border bg-white space-y-[10px]",
        "max-sm:p-3 max-sm:rounded-[5px] max-sm:space-y-1"
      )}
    >
      {children}
    </div>
  );
};
