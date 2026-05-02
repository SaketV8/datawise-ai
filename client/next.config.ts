import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // async headers() {
  //   return [
  //     {
  //       source: "/(.*)",
  //       headers: [
  //         // { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  //         // { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
  //       ],
  //     },
  //   ];
  // },

  allowedDevOrigins: ["192.168.1.10"],

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
