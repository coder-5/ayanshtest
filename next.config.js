/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // ESLint configuration - now re-enabled with better rules
  eslint: {
    ignoreDuringBuilds: false, // Re-enabled after improving ESLint config
  },

  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Enable development tools
  devIndicators: {
    position: 'bottom-left',
  },

  // Development logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Compiler optimizations (disabled for Turbopack compatibility)
  // compiler: {
  //   removeConsole: process.env.NODE_ENV === 'production',
  // },

  // Fix CORS issues for development and production
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },

  // Configure allowed dev origins for cross-origin requests
  allowedDevOrigins: ['192.168.1.197', 'localhost'],
  webpack: (config, { dev, isServer }) => {
    // Handle PDF parsing and other Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Ignore problematic test files in pdf-parse
    const webpack = require('webpack');
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\/test\/data\//,
      })
    );

    // Performance optimizations for webpack (Turbopack handles its own caching)
    if (dev && !process.env.TURBOPACK) {
      config.watchOptions = {
        ignored: ['node_modules/**'],
        poll: false,
        aggregateTimeout: 200,
      };
    }

    // Tree shaking and dead code elimination (only in production)
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }

    // Reduce bundle size
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': require('path').resolve(__dirname, 'src'),
      };
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    domains: ['localhost', '192.168.1.197'],
    unoptimized: process.env.NODE_ENV === 'development',
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = nextConfig;