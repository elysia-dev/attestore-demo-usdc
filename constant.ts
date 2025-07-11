export const BASE_URL = "https://attestor-core-production-5795.up.railway.app";

export const faucetLink = "https://www.alchemy.com/faucets/ethereum-holesky";

const TOSS_ACCOUNT_NUMBER_PROD = "100202642943"; // production
const TOSS_ACCOUNT_NUMBER_TEST = "100000021389"; // test

export const TOSS_ACCOUNT_NUMBER =
  process.env.NODE_ENV === "production"
    ? TOSS_ACCOUNT_NUMBER_PROD
    : TOSS_ACCOUNT_NUMBER_TEST;

export const TOKEN_SYMBOL = "KRW";
