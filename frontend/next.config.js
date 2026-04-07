/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    SUPABASE_URL_INTERNAL: process.env.SUPABASE_URL_INTERNAL || 'http://kong:8000',
    SUPABASE_ANON_KEY_INTERNAL: process.env.SUPABASE_ANON_KEY_INTERNAL || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  allowedDevOrigins: [
    'http://10.1.45.1:3000',
    'http://10.1.45.1',
    '10.1.45.1',
    'http://localhost:3000',
    'http://localhost',
    'shankara.sapta.com',
    'http://shankara.sapta.com',
    'https://shankara.sapta.com',
  ],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: (process.env.BACKEND_URL_INTERNAL || 'http://127.0.0.1:8080') + '/api/v1/:path*',
      },
      {
        source: '/supabase/:path*',
        destination: (process.env.SUPABASE_URL_INTERNAL || 'http://kong:8000') + '/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
