/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/whatsapp',
  assetPrefix: '/whatsapp',
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizeCss: false, // Disable CSS optimization temporarily
  },
  transpilePackages: ['qrcode-terminal'],
  webpack: (config, { isServer }) => {
    // Ignore .cs files
    config.module.rules.push({
      test: /\.cs$/,
      loader: 'ignore-loader'
    });

    // Handle dynamic requires
    config.module.rules.push({
      test: /\.js$/,
      include: [
        /node_modules\/clone-deep/,
        /node_modules\/merge-deep/,
        /node_modules\/puppeteer-extra/,
        /node_modules\/venom-bot/
      ],
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: ['@babel/plugin-transform-runtime']
        }
      }
    });

    // Add rule for qrcode-terminal
    config.module.rules.push({
      test: /[\\/]node_modules[\\/]qrcode-terminal[\\/].*\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      },
    });

    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        'puppeteer',
        'puppeteer-core',
        'canvas',
        'jsdom',
        'chrome-aws-lambda'
      ];
    } else {
      config.externals = [
        ...(config.externals || []),
        'canvas',
        'jsdom',
        'puppeteer-core',
        'chrome-aws-lambda'
      ];
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
      'canvas': false,
      'utf-8-validate': false,
      'bufferutil': false,
      'supports-color': false,
      'encoding': false,
      'puppeteer': false
    };

    return config;
  },
  experimental: {
    // Disable webpack caching
    webpackBuildWorker: false,
    serverComponentsExternalPackages: [
      'puppeteer',
      'puppeteer-core',
      'venom-bot',
      'chrome-aws-lambda'
    ]
  },
  // Configure webpack caching
  generateBuildId: async () => {
    return 'build-' + Date.now();
  }
};

module.exports = nextConfig;
