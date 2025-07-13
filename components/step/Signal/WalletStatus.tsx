import { cn } from "@/lib/utils";
import { Button } from "../../ui/button";
import CustomConnectButton from "../../utils/CustomConnectButton";
import { faucetLink } from "@/constant";
import ADDRESSES from "@/lib/addresses";
import { useWalletClient } from "wagmi";

const openFaucetLink = () => {
  window.open(faucetLink, "_blank");
};
const getNetworkName = (chainId: number) => {
  switch (chainId) {
    case 1:
      return "Ethereum Mainnet";
    case 11155111:
      return "Sepolia Testnet";
    case 31337:
      return "Anvil Local";
    case 17000:
      return "Holsky Testnet";
    default:
      return `Chain ID: ${chainId}`;
  }
};

const WalletStatus = ({
  isConnected,
  chainId,
}: {
  isConnected: boolean;
  chainId: number;
}) => {
  const { data: walletClient } = useWalletClient();

  // KRW 토큰을 지갑에 추가하는 함수
  const handleAddTokenToWallet = async () => {
    try {
      // Check if using wagmi's wallet client
      if (walletClient) {
        // For mobile wallets connected via WalletConnect or other providers
        await walletClient.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20",
            options: {
              address: ADDRESSES.TOKEN,
              symbol: "KRW",
              decimals: 18,
              image: "", // 토큰 이미지 URL이 있다면 추가
            },
          },
        });
      } else if (typeof window.ethereum !== "undefined") {
        // Fallback for desktop MetaMask
        await window.ethereum.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20",
            options: {
              address: ADDRESSES.TOKEN,
              symbol: "KRW",
              decimals: 18,
              image: "",
            },
          },
        });
      } else {
        // Check if user is on mobile browser
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
          alert(
            "Please use your wallet app's built-in browser to add the token."
          );
        } else {
          alert(
            "No compatible wallet found. Please install MetaMask or connect a wallet."
          );
        }
      }
    } catch (error) {
      console.error("Failed to add token to wallet:", error);
      alert("Failed to add token. Please add it manually in your wallet.");
    }
  };
  return (
    <>
      <section className="flex justify-between items-center max-sm:flex-col max-sm:items-start">
        <CustomConnectButton />

        <div className="flex items-center gap-2 max-sm:mt-2.5 max-sm:w-full max-sm:justify-between">
          <div className="label flex items-center">
            <strong>Network:&nbsp;</strong>
            {getNetworkName(chainId)}
          </div>
          <div className="label flex items-center">
            <Button
              onClick={openFaucetLink}
              className={cn(
                "px-1 py-1 rounded-md border-2 border-gray-400 bg-white text-black",
                "hover:border-gray-500 hover:bg-gray-100 hover:text-black",
                "cursor-pointer transition-all duration-200"
              )}
              style={{ minWidth: 80 }}
            >
              Faucet
            </Button>
          </div>
        </div>
      </section>
      <section className="flex justify-between items-center">
        {isConnected && (
          <div className="flex flex-col gap-2 w-full">
            <Button
              onClick={handleAddTokenToWallet}
              variant="outlineBlue"
              size="max"
            >
              <svg
                width="21"
                height="20"
                viewBox="0 0 21 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.5 7.5V12.5M13 10H8M18 10C18 10.9849 17.806 11.9602 17.4291 12.8701C17.0522 13.7801 16.4997 14.6069 15.8033 15.3033C15.1069 15.9997 14.2801 16.5522 13.3701 16.9291C12.4602 17.306 11.4849 17.5 10.5 17.5C9.51509 17.5 8.53982 17.306 7.62987 16.9291C6.71993 16.5522 5.89314 15.9997 5.1967 15.3033C4.50026 14.6069 3.94781 13.7801 3.5709 12.8701C3.19399 11.9602 3 10.9849 3 10C3 8.01088 3.79018 6.10322 5.1967 4.6967C6.60322 3.29018 8.51088 2.5 10.5 2.5C12.4891 2.5 14.3968 3.29018 15.8033 4.6967C17.2098 6.10322 18 8.01088 18 10Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Add KRW Token
            </Button>
            <div className="text-xs text-gray-500 text-center">
              Token Address: {ADDRESSES.TOKEN.slice(0, 6)}...
              {ADDRESSES.TOKEN.slice(-4)}
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default WalletStatus;
