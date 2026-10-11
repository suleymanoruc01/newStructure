import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderToString } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import { PrerenderApp } from "../src/app/prerender-app.tsx";
import { initI18n, i18n } from "../src/i18n/index.ts";
import {
  PUBLIC_ROUTES,
  ROUTE_SEO,
  distPathForRoute,
  type PublicRoute,
} from "../src/lib/route-meta.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const templatePath = path.join(distDir, "index.html");

function siteUrl(): string {
  return (process.env.VITE_SITE_URL ?? "https://www.parton.com.tr").replace(/\/$/, "");
}

function injectHtml(template: string, appHtml: string, route: PublicRoute): string {
  initI18n("tr-TR");
  const seo = ROUTE_SEO[route];
  const title = i18n.t(seo.titleKey);
  const description = i18n.t(seo.descriptionKey);
  const canonical = `${siteUrl()}${route === "/" ? "" : route}`;

  let html = template.replace(
    '<div id="root"></div>',
    `<div id="root">${appHtml}</div>`,
  );
  html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${description.replace(/"/g, "&quot;")}" />`,
  );
  const headInject = `
    <link rel="canonical" href="${canonical}" />
    <meta property="og:title" content="${title.replace(/"/g, "&quot;")}" />
    <meta property="og:description" content="${description.replace(/"/g, "&quot;")}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:type" content="website" />
  `;
  html = html.replace("</head>", `${headInject}</head>`);
  return html;
}

function writeRouteHtml(route: PublicRoute, template: string) {
  initI18n("tr-TR");
  const appHtml = renderToString(
    <I18nextProvider i18n={i18n}>
      <PrerenderApp location={route} />
    </I18nextProvider>,
  );
  const html = injectHtml(template, appHtml, route);
  const relative = distPathForRoute(route);
  const outPath = path.join(distDir, relative);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, "utf8");
  console.log(`prerender: ${route} → ${relative}`);
}

const template = readFileSync(templatePath, "utf8");
for (const route of PUBLIC_ROUTES) {
  writeRouteHtml(route, template);
}
