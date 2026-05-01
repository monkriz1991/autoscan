import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-url";

export default function manifest(): MetadataRoute.Manifest {
  const origin = getSiteOrigin();
  return {
    name: "AIscanAuto — AI Car Diagnostics",
    short_name: "AIscanAuto",
    description:
      "Free AI-powered OBD2 scanner for Windows, macOS & Linux. Read fault codes, monitor live engine data, and get AI repair guidance.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: `${origin}/icon.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${origin}/icon.png`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
