import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLIC_ROUTES } from "../src/lib/route-meta.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");

function siteUrl(): string {
  return (process.env.VITE_SITE_URL ?? "https://www.parton.com.tr").replace(/\/$/, "");
}

const lastmod = new Date().toISOString().slice(0, 10);
const urls = PUBLIC_ROUTES.map((route) => {
  const loc = `${siteUrl()}${route === "/" ? "" : route}`;
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${route === "/" ? "1.0" : "0.8"}</priority>\n  </url>`;
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

writeFileSync(path.join(distDir, "sitemap.xml"), sitemap, "utf8");

const robotsTemplate = readFileSync(
  path.join(__dirname, "../public/robots.txt"),
  "utf8",
);
const robots = robotsTemplate.replace("{{SITE_URL}}", siteUrl());
writeFileSync(path.join(distDir, "robots.txt"), robots, "utf8");

console.log("generated sitemap.xml and robots.txt");
