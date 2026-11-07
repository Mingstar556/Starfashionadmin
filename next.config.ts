import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.100.205',
    '192.168.100.205:3000',
    '192.168.100.205:3001',
    'localhost',
    'localhost:3000',
    'localhost:3001',
    '127.0.0.1',
    '127.0.0.1:3000',
    '127.0.0.1:3001',
    '*.ngrok-free.app',
    '*.trycloudflare.com',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
