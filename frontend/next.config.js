/** @type {import('next').NextConfig} */
let nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['gymos-india-uploads.s3.ap-south-1.amazonaws.com', 'res.cloudinary.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    NEXT_PUBLIC_APP_NAME: 'GymOS India',
  },
};

try {
  const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
  });
  module.exports = withPWA(nextConfig);
} catch {
  module.exports = nextConfig;
}
