/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 图片优化配置
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  
  // 构建时忽略 ESLint 错误
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 构建时忽略 TypeScript 错误（如果使用 TypeScript）
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig