import { cn } from "@/lib/utils";
import CustomConnectButton from "../../utils/CustomConnectButton";
import { faucetLink, TOKEN_SYMBOL } from "@/constant";
import ADDRESSES from "@/lib/addresses";
import { useWalletClient, useAccount, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { useCallback, useEffect, useState } from "react";
import { erc20Abi } from "viem";

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
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
  const [isCopied, setIsCopied] = useState(false);
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [krwBalance, setKrwBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // KRW 토큰 잔고 가져오기
  const fetchKrwBalance = useCallback(async () => {
    if (!address || !publicClient) return;

    setIsLoadingBalance(true);
    try {
      const balance = await publicClient.readContract({
        address: ADDRESSES.TOKEN,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      });

      setKrwBalance(formatUnits(balance as bigint, 18));
    } catch (error) {
      console.error("Failed to fetch KRW balance:", error);
      setKrwBalance("0");
    } finally {
      setIsLoadingBalance(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    if (isConnected && address) {
      fetchKrwBalance();
    }
  }, [isConnected, address, publicClient, fetchKrwBalance]);

  const balanceInt = parseInt(krwBalance);

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
      <section className="space-y-4">
        <CustomConnectButton />
        
        <div className="flex items-center justify-between bg-secondary/30 rounded-2xl p-4 border border-border/50">
          <div className="text-sm text-muted-foreground">
            Network: <span className="text-foreground font-medium">{getNetworkName(chainId)}</span>
          </div>
          <button
            onClick={openFaucetLink}
            className="px-4 py-2 rounded-full text-sm font-medium bg-secondary hover:bg-secondary/80 transition-all duration-200 text-muted-foreground"
          >
            Faucet
          </button>
        </div>
      </section>
      {isConnected && (
        <section className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-2xl font-bold">
                {isLoadingBalance ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  `${balanceInt} ${TOKEN_SYMBOL}`
                )}
              </span>
              <button
                className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left mt-1"
                onClick={() => {
                  navigator.clipboard.writeText(ADDRESSES.TOKEN);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
              >
                {isCopied ? (
                  "Copied!"
                ) : (
                  <span>
                    Token Address: {ADDRESSES.TOKEN.slice(0, 6)}...
                    {ADDRESSES.TOKEN.slice(-4)}
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={handleAddTokenToWallet}
              className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 text-sm font-medium text-primary-foreground shadow-[0_0_20px_rgba(255,0,122,0.3)] hover:shadow-[0_0_30px_rgba(255,0,122,0.4)]"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M10 7.5V12.5M12.5 10H7.5M17.5 10C17.5 10.9849 17.306 11.9602 16.9291 12.8701C16.5522 13.7801 15.9997 14.6069 15.3033 15.3033C14.6069 15.9997 13.7801 16.5522 12.8701 16.9291C11.9602 17.306 10.9849 17.5 10 17.5C9.01509 17.5 8.03982 17.306 7.12987 16.9291C6.21993 16.5522 5.39314 15.9997 4.6967 15.3033C4.00026 14.6069 3.44781 13.7801 3.0709 12.8701C2.69399 11.9602 2.5 10.9849 2.5 10C2.5 8.01088 3.29018 6.10322 4.6967 4.6967C6.10322 3.29018 8.01088 2.5 10 2.5C11.9891 2.5 13.8968 3.29018 15.3033 4.6967C16.7098 6.10322 17.5 8.01088 17.5 10Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              Add KRW
            </button>
          </div>
        </section>
      )}
    </>
  );
};

export default WalletStatus;
