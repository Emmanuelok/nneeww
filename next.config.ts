import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
  },
  // pdfkit ships built-in font .afm files that webpack tree-shakes away when
  // bundling the route. Marking it as a server-external package keeps the
  // module loaded from node_modules at runtime, so the fonts resolve.
  serverExternalPackages: ["pdfkit"],
};

export default withNextIntl(nextConfig);
