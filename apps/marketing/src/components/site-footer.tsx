import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export function SiteFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface-inverted text-[#F3E8CF]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
        <div>
          <p className="font-display text-lg font-semibold" translate="no">PartOn</p>
          <p className="mt-2 text-sm text-[#EADCC5]">{t("footer.tagline")}</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{t("footer.legal")}</p>
          <ul className="mt-3 space-y-2 text-sm text-[#EADCC5]">
            <li>
              <Link className="hover:text-[#F3E8CF]" to="/legal/privacy">
                {t("nav.privacy")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-[#F3E8CF]" to="/legal/terms">
                {t("nav.terms")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-[#F3E8CF]" to="/pricing">
                {t("nav.pricing")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">{t("footer.contact")}</p>
          <a
            className="mt-3 inline-block text-sm text-[#EADCC5] hover:text-[#F3E8CF]"
            href={`mailto:${t("footer.contactEmail")}`}
          >
            {t("footer.contactEmail")}
          </a>
        </div>
      </div>
      <div className="border-t border-[#334B43] px-4 py-4 text-center text-xs tabular-nums text-[#AAB8BD] md:px-6" suppressHydrationWarning>
        {t("footer.rights", { year })}
      </div>
    </footer>
  );
}
