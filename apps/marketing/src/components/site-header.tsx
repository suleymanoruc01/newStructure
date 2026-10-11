import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router-dom";
import { employerLoginUrl } from "@/config/site";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#344A32] ${isActive ? "text-text-high" : "text-text-medium hover:text-text-high"}`;

export function SiteHeader() {
  const { t, i18n } = useTranslation();

  return (
    <header className="border-b border-[#DDD4C7] bg-surface-base pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link to="/" className="font-display text-lg font-semibold tracking-tight text-text-high" translate="no">
          PartOn
        </Link>
        <nav className="flex flex-wrap items-center gap-4 md:gap-6" aria-label="Ana navigasyon">
          <NavLink to="/pricing" className={linkClass}>{t("nav.pricing")}</NavLink>
          <a
            href={employerLoginUrl()}
            className="inline-flex min-h-11 items-center text-sm font-medium text-text-medium hover:text-text-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#344A32]"
          >
            {t("nav.employerLogin")}
          </a>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[#344A32] px-3 text-xs font-semibold text-[#344A32] transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#344A32] active:scale-[0.97] motion-reduce:transform-none"
            aria-label={i18n.language === "tr-TR" ? "Dili İngilizce yap" : "Switch language to Turkish"}
            onClick={() => void i18n.changeLanguage(i18n.language === "tr-TR" ? "en" : "tr-TR")}
          >
            {i18n.language === "tr-TR" ? "EN" : "TR"}
          </button>
        </nav>
      </div>
    </header>
  );
}
