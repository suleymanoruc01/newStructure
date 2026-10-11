import { useTranslation } from "react-i18next";
import { androidStoreUrl, iosStoreUrl } from "@/config/site";

export function StoreBadges() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <a
        href={iosStoreUrl()}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-[#252823] px-5 text-sm font-semibold text-[#F3E8CF] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#344A32] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#344A32] active:scale-[0.97] motion-reduce:transform-none"
        rel="noopener noreferrer"
      >
        App Store — {t("landing.ctaDownload")}
      </a>
      <a
        href={androidStoreUrl()}
        className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-[#344A32] px-5 text-sm font-semibold text-[#344A32] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#344A32] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#EADCC5] active:scale-[0.97] motion-reduce:transform-none"
        rel="noopener noreferrer"
      >
        Google Play — {t("landing.ctaDownload")}
      </a>
    </div>
  );
}
