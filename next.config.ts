import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // ✅ Enable compression
  compress: true,
  
  // ✅ Optimize images
  images: {
    domains: ['qjhkjpgbidjkywtgvmig.supabase.co'], // Your Supabase domain
    formats: ['image/webp', 'image/avif'],
  },
  
  // ✅ Enable SWC minification
  swcMinify: true,
  
  // ✅ Reduce bundle size
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@supabase/supabase-js',
      'react-icons',
      'lucide-react'
    ],
  },
  
  // ✅ Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Bundle analyzer
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
  
  // ✅ Output standalone for better performance
  output: 'standalone',
};

export default nextConfig;
