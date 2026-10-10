/** @type {import('next').NextConfig} */
const nextConfig = {
  // knowledge/*.md are read from disk at runtime, so make sure Vercel ships them.
  outputFileTracingIncludes: {
    "/api/**/*": ["./knowledge/**/*"],
  },
};

export default nextConfig;
