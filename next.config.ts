/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! UYARI !!
    // Proje production'a çıkarken hatalı olsa bile build'e izin verir.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Build sırasında ESLint kontrollerini atlar.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
