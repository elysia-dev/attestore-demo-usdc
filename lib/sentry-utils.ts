/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Sentry from "@sentry/nextjs";

// MetaMask 에러 래핑
export function captureWeb3Error(error: any, context?: Record<string, any>) {
  // MetaMask 특정 에러 파싱
  const errorInfo = {
    code: error?.code,
    message: error?.message || error?.toString(),
    data: error?.data,
    stack: error?.stack,
  };

  // MetaMask 에러 코드 매핑
  const errorMessages: Record<string, string> = {
    "4001": "User rejected the request",
    "4100": "The requested account/method has not been authorized",
    "4200": "The requested method is not supported",
    "4900": "The provider is disconnected",
    "4901": "The provider is disconnected from all chains",
    "-32700": "Invalid JSON",
    "-32600": "Invalid request",
    "-32601": "Method not found",
    "-32602": "Invalid params",
    "-32603": "Internal error",
    "-32000": "Invalid input",
    "-32001": "Resource not found",
    "-32002": "Resource unavailable",
    "-32003": "Transaction rejected",
    "-32004": "Method not supported",
    "-32005": "Limit exceeded",
  };

  const readableMessage = errorMessages[String(error?.code)] || error?.message;

  Sentry.captureException(new Error(readableMessage), {
    tags: {
      type: "web3_error",
      code: error?.code,
    },
    contexts: {
      web3: {
        ...errorInfo,
        ...context,
      },
    },
  });
}

// 트랜잭션 추적
export function trackTransaction(
  txHash: string,
  status: "pending" | "success" | "failed",
  metadata?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    category: "transaction",
    message: `Transaction ${status}: ${txHash}`,
    level: status === "failed" ? "error" : "info",
    data: {
      txHash,
      status,
      ...metadata,
    },
  });
}

// 사용자 액션 추적
export function trackUserAction(action: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    category: "user_action",
    message: action,
    level: "info",
    data,
  });
}

// 지갑 연결 상태 추적
export function setWalletContext(address?: string, chainId?: number) {
  Sentry.setContext("wallet", {
    address: address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : "Not connected",
    chainId,
    connected: !!address,
  });
}
