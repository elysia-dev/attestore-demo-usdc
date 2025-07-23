import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { emojiAvatarForAddress } from "@/lib/emojiAvatarForAddress";
import { Button } from "../ui/button";

const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, mounted, openConnectModal }) => {
        const connected = mounted && account && chain;
        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-semibold transition-all duration-200 hover:shadow-[0_0_30px_rgba(255,0,122,0.4)] shadow-[0_0_20px_rgba(255,0,122,0.3)] w-full"
            >
              Connect Wallet
            </button>
          );
        }

        const balance =
          account.displayBalance ??
          (account.balanceFormatted && account.balanceSymbol
            ? `${account.balanceFormatted} ${account.balanceSymbol}`
            : "0 ETH");

        const hasEnsAvatar = !!account.ensAvatar;
        const { emoji, color } = emojiAvatarForAddress(account.address);

        return (
          <button
            onClick={openAccountModal}
            className="flex items-center gap-3 rounded-full pl-3 pr-3 py-2 bg-secondary/30 hover:bg-secondary/40 transition-all duration-200 border border-border/50"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {balance}
              </span>
              {hasEnsAvatar ? (
                <Image
                  src={account.ensAvatar ?? ""}
                  alt="ENS"
                  className="h-8 w-8 rounded-full border border-border/50"
                  width={32}
                  height={32}
                />
              ) : (
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium border border-border/50"
                  style={{ backgroundColor: color }}
                >
                  {emoji}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50">
              <span className="text-sm font-medium text-foreground">
                {account.displayName}
              </span>
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CustomConnectButton;
