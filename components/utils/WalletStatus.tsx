import { Button } from "../ui/button";
import CustomConnectButton from "./CustomConnectButton";
import { faucetLink } from "@/constant";
import ADDRESSES from "@/lib/addresses";

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

// KRW 토큰을 지갑에 추가하는 함수
const handleAddTokenToWallet = async () => {
  try {
    if (typeof window.ethereum !== "undefined") {
      await window.ethereum.request({
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
    } else {
      alert("MetaMask or compatible wallet not found");
    }
  } catch (error) {
    console.error("Failed to add token to wallet:", error);
  }
};

const WalletStatus = ({
  isConnected,
  chainId,
}: {
  isConnected: boolean;
  chainId: number;
}) => {
  return (
    <section className="mb-5 px-5 py-[15px] bg-white border border-gray-border rounded-[10px] space-y-[15px]">
      <section className="flex justify-between items-center">
        <CustomConnectButton />
        <div className="flex items-center gap-2">
          <div className="label flex items-center">
            <strong>Network:&nbsp;</strong>
            {getNetworkName(chainId)}
          </div>
          <div className="label flex items-center bg-gray-100 rounded-[5px] px-2 py-1 ml-2 border border-gray-border">
            <button onClick={openFaucetLink}>Faucet</button>
          </div>
        </div>
      </section>
      <section className="flex justify-between items-center">
        {isConnected && (
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
        )}
      </section>
    </section>
  );
};

export default WalletStatus;
