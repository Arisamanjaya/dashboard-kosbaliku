import { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // ✅ Konfigurasi gambar modern dan lebih aman menggunakan remotePatterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qjhkjpgbidjkywtgvmig.supabase.co', // Hostname Supabase Anda
        port: '',
        pathname: '/storage/v1/object/public/**', // Lebih aman, bisa dibatasi per bucket
      },
    ],
    formats: ['image/webp', 'image/avif'], // Ini sudah bagus
  },

  // ✅ Opsi ini sudah menjadi default di Next.js modern, jadi tidak perlu ditulis eksplisit
  // swcMinify: true,

  experimental: {
    // optimizeCss sudah dioptimalkan secara default di versi Next.js yang lebih baru
    optimizePackageImports: [
      '@supabase/supabase-js',
      'react-icons',
      'lucide-react',
    ],
  },

  // ✅ Konfigurasi webpack Anda sudah bagus, terutama untuk fallback dan analyzer
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }

    if (process.env.ANALYZE) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
    }

    return config;
  },
  
  // ✅ output: 'standalone' adalah praktik yang sangat baik untuk deployment Docker
  output: 'standalone',
};

export default nextConfig;