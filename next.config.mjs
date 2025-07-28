/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost", "res.cloudinary.com"],
  },
  env: {
    NEXT_PUBLIC_BASE_URL: "http://31.97.110.160:3000", 
  },
};

export default nextConfig;
