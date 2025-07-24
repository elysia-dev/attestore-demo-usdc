// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

// Different DSNs for different environments
const SENTRY_DSN = {
  // Local environment - zenie-web-frontend-lc project
  development:
    'https://a583580121a3ce7a24e6fef4ea2bcbc9@o4506199653351424.ingest.us.sentry.io/4509648961601536',
  // Production environment - zenie-web-frontend project
  production:
    'https://7697536204f7918d1aedd36c8e43f2ce@o4506199653351424.ingest.us.sentry.io/4509648959373312',
}

const dsn =
  process.env.NODE_ENV === 'production'
    ? SENTRY_DSN.production
    : SENTRY_DSN.development

Sentry.init({
  dsn,

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Set environment
  environment: process.env.NODE_ENV || 'development',

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
