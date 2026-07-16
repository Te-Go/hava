import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      // Typo/variant domains → root hub
      {
        source: "/:path*",
        has: [{ type: "host", value: "hava-durumulari.tr" }],
        destination: "https://hava-durumlari.tr/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "hava-durumulari.com" }],
        destination: "https://hava-durumlari.tr/:path*",
        permanent: true,
      },

      // Temporal spoke domains
      {
        source: "/:path*",
        has: [{ type: "host", value: "yarinki-hava-durumu.tr" }],
        destination: "https://hava-durumlari.tr/yarinkihava/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "yarin-hava-durumu.tr" }],
        destination: "https://hava-durumlari.tr/yarinkihava/:path*",
        permanent: true,
      },

      // City spoke domains
      {
        source: "/:path*",
        has: [{ type: "host", value: "istanbul-hava-durumu.tr" }],
        destination: "https://hava-durumlari.tr/istanbul/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "ankara-hava-durumu.tr" }],
        destination: "https://hava-durumlari.tr/ankara/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "izmir-hava-durumu.tr" }],
        destination: "https://hava-durumlari.tr/izmir/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "antalya-hava-durumu.tr" }],
        destination: "https://hava-durumlari.tr/antalya/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "adana-hava-durumu.tr" }],
        destination: "https://hava-durumlari.tr/adana/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "bursa-hava-durumu.tr" }],
        destination: "https://hava-durumlari.tr/bursa/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "gaziantep-hava-durumu.tr" }],
        destination: "https://hava-durumlari.tr/gaziantep/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "diyarbakir-hava-durumlari.tr" }],
        destination: "https://hava-durumlari.tr/diyarbakir/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "eskisehir-hava-durumu.tr" }],
        destination: "https://hava-durumlari.tr/eskisehir/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "konya-hava-durumu.tr" }],
        destination: "https://hava-durumlari.tr/konya/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "kocaeli-hava-durumu.tr" }],
        destination: "https://hava-durumlari.tr/kocaeli/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "mersin-hava-durumu.tr" }],
        destination: "https://hava-durumlari.tr/mersin/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "kayseri-hava-durumu.tr" }],
        destination: "https://hava-durumlari.tr/kayseri/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "samsun-hava-durumu.tr" }],
        destination: "https://hava-durumlari.tr/samsun/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "trabzon-hava-durumu.tr" }],
        destination: "https://hava-durumlari.tr/trabzon/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
