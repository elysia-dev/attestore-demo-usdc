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
              className="font-bold max-sm:w-full"
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
            className="flex items-center space-x-[5px] rounded-full pl-5 pr-2.5 py-[5px] shadow-md bg-white max-sm:w-full max-sm:px-2 max-sm:justify-between"
          >
            <span className="body font-semibold max-sm:mr-2.5 whitespace-nowrap flex-3">
              {balance}
            </span>
            <div className="flex shadow-inner items-center space-x-[5px] rounded-full bg-gray-100 px-2.5 py-[5px] max-sm:justify-between flex-8">
              {hasEnsAvatar ? (
                <Image
                  src={account.ensAvatar ?? ""}
                  alt="ENS"
                  className="h-6 w-6 rounded-full max-sm:h-5 max-sm:w-5"
                  width={24}
                  height={24}
                />
              ) : (
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[13px] max-sm:h-5 max-sm:w-5"
                  style={{ backgroundColor: color }}
                >
                  {emoji}
                </span>
              )}
              <span className="body font-semibold whitespace-nowrap">
                {account.displayName}
              </span>
              <div className="flex items-center justify-center w-[25px] h-[25px] rounded-full bg-white shadow-md max-sm:w-5 max-sm:h-5">
                <Image
                  src="/arrow-down.svg"
                  alt="arrow-down"
                  width={15}
                  height={8}
                  className="max-sm:scale-75"
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
