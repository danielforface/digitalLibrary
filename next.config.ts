
import type {NextConfig} from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  webpack: (config: any, { dev }: { dev: boolean; }) => {
    if (dev) {
      // Ignore the data directory from being watched by the dev server.
      // This prevents the server from restarting every time a data file is changed.
      const dataDir = path.resolve(__dirname, 'data');
      const existingIgnored = config.watchOptions.ignored;
      const ignoredPaths = Array.isArray(existingIgnored)
        ? existingIgnored
        : existingIgnored ? [existingIgnored] : [];
        
      config.watchOptions.ignored = [
          ...ignoredPaths,
          dataDir
      ];
    }
    return config;
  },
};

export default nextConfig;
