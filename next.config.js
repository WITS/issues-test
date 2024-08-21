const withVercelToolbar = require('@vercel/toolbar/plugins/next')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/.well-known/vercel/flags',
        destination: '/api/vercel/flags',
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/.well-known/vercel/toolbar',
        destination: '/',
        permanent: true,
      }
    ];
  },
  async headers() {
    return [
      {
        source: '/.well-known/vercel/toolbar',
        headers: [
          {
            key: 'Set-Cookie',
            value: '__vercel_toolbar=1; max-age=29030400',
          }
        ],
      }
    ];
  }
}

module.exports = withVercelToolbar(nextConfig);
