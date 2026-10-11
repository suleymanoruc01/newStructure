import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { siteUrl } from "@/config/site";
import type { PublicRoute } from "@/lib/route-meta";
import { ROUTE_SEO } from "@/lib/route-meta";

type SeoProps = {
  route: PublicRoute;
};

export function Seo({ route }: SeoProps) {
  const { t } = useTranslation();
  const seo = ROUTE_SEO[route];
  const title = t(seo.titleKey);
  const description = t(seo.descriptionKey);
  const canonical = `${siteUrl()}${route === "/" ? "" : route}`;

  useEffect(() => {
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", description);
    }
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;

    const setOg = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    setOg("og:title", title);
    setOg("og:description", description);
    setOg("og:url", canonical);
    setOg("og:type", "website");
  }, [title, description, canonical]);

  return null;
}
