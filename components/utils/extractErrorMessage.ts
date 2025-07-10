import { BaseError } from "viem";

export function extractErrorMessage(err: unknown): string {
  if (err instanceof BaseError) return err.shortMessage;
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err)
    return (err as { message: string }).message;
  return JSON.stringify(err);
}
