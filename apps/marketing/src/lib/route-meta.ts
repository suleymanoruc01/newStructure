export type PublicRoute = "/" | "/pricing" | "/legal/privacy" | "/legal/terms";

export const PUBLIC_ROUTES: PublicRoute[] = [
  "/",
  "/pricing",
  "/legal/privacy",
  "/legal/terms",
];

export type RouteSeo = {
  titleKey: string;
  descriptionKey: string;
};

export const ROUTE_SEO: Record<PublicRoute, RouteSeo> = {
  "/": {
    titleKey: "landing.metaTitle",
    descriptionKey: "landing.metaDescription",
  },
  "/pricing": {
    titleKey: "pricing.metaTitle",
    descriptionKey: "pricing.metaDescription",
  },
  "/legal/privacy": {
    titleKey: "legal.privacyTitle",
    descriptionKey: "legal.privacyMeta",
  },
  "/legal/terms": {
    titleKey: "legal.termsTitle",
    descriptionKey: "legal.termsMeta",
  },
};

export function distPathForRoute(route: PublicRoute): string {
  if (route === "/") {
    return "index.html";
  }
  const trimmed = route.replace(/^\//, "");
  return `${trimmed}/index.html`;
}
