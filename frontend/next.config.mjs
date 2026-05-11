/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Proxy para o container do backend rodando no docker-compose
        destination: 'http://backend:8000/api/:path*' 
      },
      {
        source: '/auth/:path*',
        destination: 'http://backend:8000/auth/:path*'
      }
    ]
  },
  // Headers removidos para evitar bloqueio de postMessage do Google Sign-In
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
