import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "neuOS",
    short_name: "neuOS",
    description: "Không gian hỗ trợ quản lý thời khóa biểu, theo dõi GPA và lập kế hoạch học tập cá nhân.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a192f",
    theme_color: "#0a192f",
    icons: [
      {
        src: "/pwa-icon.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
