const path = require('path');
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sphere/ui'],
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
    ],
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Suppress source map upload during local dev to avoid noise
  silent: process.env.NODE_ENV !== 'production',
  // Disable automatic instrumentation of routes to keep bundle size down
  autoInstrumentServerFunctions: false,
  autoInstrumentMiddleware: false,
  // Avoid bundling Sentry debug statements in production
  disableLogger: true,
  // Don't fail build if Sentry upload fails
  errorHandler: (err, invokeErr, compilation) => {
    compilation.warnings.push('Sentry CLI Plugin: ' + err.message);
  },
});
