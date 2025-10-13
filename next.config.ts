import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.197',
      },
    ],
  },
  // Optimize build performance
  experimental: {
    // Reduce memory usage during build
    webpackMemoryOptimizations: true,
  },
  // Disable source maps to speed up build
  productionBrowserSourceMaps: false,
  // Force all pages to use dynamic rendering (prevents database calls during build)
  output: 'standalone',
};

// Disable Sentry config wrapper for now - was causing build timeout
// To re-enable: Configure SENTRY_ORG and SENTRY_PROJECT environment variables
// import { withSentryConfig } from "@sentry/nextjs";
// export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);

export default nextConfig;
