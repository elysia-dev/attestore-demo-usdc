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
            <Button
              variant="default"
              size="lg"
              onClick={openConnectModal}
              className="font-bold"
            >
              Connect Wallet
            </Button>
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
            className="flex items-center space-x-[5px] rounded-full px-5 py-[5px] shadow-md bg-white"
          >
            <span className="body font-semibold">{balance}</span>
            <div className="flex shadow-inner items-center space-x-[5px] rounded-full bg-gray-100 px-2.5 py-[5px]">
              {hasEnsAvatar ? (
                <Image
                  src={account.ensAvatar ?? ""}
                  alt="ENS"
                  className="h-6 w-6 rounded-full"
                  width={24}
                  height={24}
                />
              ) : (
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[13px]"
                  style={{ backgroundColor: color }}
                >
                  {emoji}
                </span>
              )}
              <span className="body font-semibold">{account.displayName}</span>
              <div className="flex items-center justify-center w-[25px] h-[25px] rounded-full bg-white shadow-md">
                <Image
                  src="/arrow-down.svg"
                  alt="arrow-down"
                  width={15}
                  height={8}
                />
              </div>
            </div>
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CustomConnectButton;
