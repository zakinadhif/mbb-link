import { data } from "react-router";

export const loader = () => {
  return data(
    {
      short_name: "mbb-link",
      name: "mbb-link",
      description: "Helping you send constructive feedbacks to your friends.",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#c34138",
      icons: [
        {
          src: "/logo_exp.png",
          type: "image/png",
          sizes: "512x512",
        },
      ],
      screenshots: [
        {
          src: "/logo_exp.png",
          type: "image/png",
          sizes: "512x512",
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=600",
        "Content-Type": "application/manifest+json",
      },
    },
  );
};
