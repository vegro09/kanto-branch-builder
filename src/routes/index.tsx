import { createFileRoute } from "@tanstack/react-router";
import KantoTree from "@/components/KantoTree";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kanto Tree — Infinite Micro-Stepping Task Architecture" },
      {
        name: "description",
        content:
          "Break monumental projects into infinitely nested task trees with prompts, status tracking, JSON portability, and full RTL support.",
      },
      { property: "og:title", content: "Kanto Tree" },
      {
        property: "og:description",
        content:
          "Infinite nested micro-stepping task and prompt architecture tool for the Kanto Empire ecosystem.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KantoTree,
});
