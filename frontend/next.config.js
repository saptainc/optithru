/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    'http://10.1.34.200:3000',
    'http://10.1.34.200',
    '10.1.34.200',
    'http://localhost:3000',
    'http://localhost',
    'mcp.sapta.com',
    'http://mcp.sapta.com',
    'https://mcp.sapta.com',
  ],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080') + '/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
