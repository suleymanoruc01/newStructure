import { MemoryRouter } from "react-router-dom";
import { Route, Routes } from "react-router-dom";
import { MarketingLayout } from "@/components/marketing-layout";
import { LandingPage } from "@/pages/landing-page";
import { LegalPrivacyPage } from "@/pages/legal-privacy-page";
import { LegalTermsPage } from "@/pages/legal-terms-page";
import { PricingPage } from "@/pages/pricing-page";
import type { PublicRoute } from "@/lib/route-meta";

export function PrerenderApp({ location }: { location: PublicRoute }) {
  return (
    <MemoryRouter initialEntries={[location]}>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="legal/privacy" element={<LegalPrivacyPage />} />
          <Route path="legal/terms" element={<LegalTermsPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}
