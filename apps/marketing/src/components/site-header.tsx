import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router-dom";
import { employerLoginUrl } from "@/config/site";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium ${isActive ? "text-text-high" : "text-text-medium hover:text-text-high"}`;

export function SiteHeader() {
  const { t, i18n } = useTranslation();

  return (
    <header className="border-b border-[#DDD4C7] bg-surface-base">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link to="/" className="font-display text-lg font-semibold tracking-tight text-text-high">
          PartOn
        </Link>
        <nav className="flex flex-wrap items-center gap-4 md:gap-6" aria-label="Ana navigasyon">
          <NavLink to="/pricing" className={linkClass}>{t("nav.pricing")}</NavLink>
          <a
            href={employerLoginUrl()}
            className="text-sm font-medium text-text-medium hover:text-text-high"
          >
            {t("nav.employerLogin")}
          </a>
          <button
            type="button"
            className="rounded-md border border-[#344A32] px-2 py-1 text-xs font-semibold text-[#344A32]"
            onClick={() => void i18n.changeLanguage(i18n.language === "tr-TR" ? "en" : "tr-TR")}
          >
            {i18n.language === "tr-TR" ? "EN" : "TR"}
          </button>
        </nav>
      </div>
    </header>
  );
}
