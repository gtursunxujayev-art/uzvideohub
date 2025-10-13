/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Turn OFF typedRoutes so <Link href={string}> is allowed everywhere.
  // This fixes: "Type 'string' is not assignable to type 'UrlObject | RouteImpl<string>'"
  experimental: {
    typedRoutes: false
  },

  env: {
    NEXT_PUBLIC_APP_NAME: "Sotuv bo'limi",
    NEXT_PUBLIC_APP_URL: "https://sotuv-bolimi-kappa.vercel.app"
  },
  poweredByHeader: false
};

export default nextConfig;
