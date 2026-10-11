import { useTranslation } from "react-i18next";
import { Seo } from "@/components/seo";
import { StoreBadges } from "@/components/store-badges";
import { employerLoginUrl } from "@/config/site";

export function LandingPage() {
  const { t } = useTranslation();

  return (
    <>
      <Seo route="/" />
      <section className="bg-surface-base">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:px-6 md:py-24">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-text-high md:text-5xl">
              {t("landing.heroTitle")}
            </h1>
            <p className="mt-4 text-lg text-text-medium">{t("landing.heroSubtitle")}</p>
            <div className="mt-8 flex flex-col gap-4">
              <StoreBadges />
              <a
                href={employerLoginUrl()}
                className="inline-flex h-11 w-fit items-center justify-center rounded-xl bg-[#E97A3D] px-6 text-sm font-semibold text-[#F3E8CF] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#344A32] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#D86A3A] active:scale-[0.97] motion-reduce:transform-none"
              >
                {t("landing.ctaEmployer")}
              </a>
            </div>
          </div>
          <div
            className="aspect-[4/3] rounded-2xl bg-surface-1 bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #EADCC5 0%, #DDD4C7 50%, #83947A 100%)",
            }}
            role="img"
            aria-label="PartOn marka görseli"
          />
        </div>
      </section>
      <section className="bg-surface-1">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:px-6">
          <article className="rounded-xl bg-surface-base p-8">
            <h2 className="text-2xl font-semibold text-text-high">
              {t("landing.sectionWorkersTitle")}
            </h2>
            <p className="mt-3 text-text-medium">{t("landing.sectionWorkersBody")}</p>
          </article>
          <article className="rounded-xl bg-surface-base p-8">
            <h2 className="text-2xl font-semibold text-text-high">
              {t("landing.sectionEmployersTitle")}
            </h2>
            <p className="mt-3 text-text-medium">{t("landing.sectionEmployersBody")}</p>
          </article>
        </div>
      </section>
      <section className="bg-surface-inverted py-16 text-[#F3E8CF]">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <h2 className="font-display text-3xl font-semibold">{t("landing.bandTitle")}</h2>
          <p className="mt-4 text-lg text-[#EADCC5]">{t("landing.bandBody")}</p>
        </div>
      </section>
    </>
  );
}
