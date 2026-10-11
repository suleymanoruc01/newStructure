import { useTranslation } from "react-i18next";
import { Seo } from "@/components/seo";
import { employerLoginUrl } from "@/config/site";

export function PricingPage() {
  const { t } = useTranslation();

  return (
    <>
      <Seo route="/pricing" />
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <h1 className="font-display text-4xl font-bold text-text-high">{t("pricing.title")}</h1>
        <p className="mt-4 max-w-2xl text-lg text-text-medium">{t("pricing.intro")}</p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-[#DDD4C7] bg-surface-1 p-8">
            <h2 className="text-xl font-semibold">{t("pricing.tierStarter")}</h2>
            <p className="mt-2 text-text-medium">{t("pricing.tierStarterDesc")}</p>
            <ul className="mt-6 space-y-2 text-sm text-text-medium">
              <li>{t("pricing.featureHold")}</li>
              <li>{t("pricing.featureRelease")}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[#344A32] bg-surface-base p-8 ring-2 ring-[#E97A3D]/30">
            <h2 className="text-xl font-semibold">{t("pricing.tierGrowth")}</h2>
            <p className="mt-2 text-text-medium">{t("pricing.tierGrowthDesc")}</p>
            <ul className="mt-6 space-y-2 text-sm text-text-medium">
              <li>{t("pricing.featureHold")}</li>
              <li>{t("pricing.featureRelease")}</li>
              <li>{t("pricing.featureTopUp")}</li>
            </ul>
          </div>
        </div>
        <a
          href={employerLoginUrl()}
          className="mt-10 inline-flex h-11 items-center justify-center rounded-xl bg-[#E97A3D] px-6 text-sm font-semibold text-[#F3E8CF] hover:bg-[#D86A3A]"
        >
          {t("pricing.ctaEmployer")}
        </a>
      </div>
    </>
  );
}
