// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Different DSNs for different environments
const SENTRY_DSN = {
  // Local environment - zenie-web-frontend-lc project
  development:
    "https://a583580121a3ce7a24e6fef4ea2bcbc9@o4506199653351424.ingest.us.sentry.io/4509648961601536",
  // Production environment - zenie-web-frontend project
  // TODO: Replace with your production DSN from Sentry
  production:
    "https://7697536204f7918d1aedd36c8e43f2ce@o4506199653351424.ingest.us.sentry.io/4509648959373312",
};

const dsn =
  process.env.NODE_ENV === "production"
    ? SENTRY_DSN.production
    : SENTRY_DSN.development;

Sentry.init({
  dsn,

  // Set environment
  environment: process.env.NODE_ENV || "development",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
