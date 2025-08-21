import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qjhkjpgbidjkywtgvmig.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/kos-images/**',
      },
      // Anda bisa menambahkan domain lain di sini jika perlu
    ],
  },
};

export default nextConfig;
