import { useTranslation } from "react-i18next";
import { Seo } from "@/components/seo";
import { LEGAL_POLICY_VERSION } from "@/config/site";

export function LegalPrivacyPage() {
  const { t } = useTranslation();

  return (
    <>
      <Seo route="/legal/privacy" />
      <article className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <h1 className="font-display text-3xl font-bold text-text-high">
          {t("legal.privacyTitle")}
        </h1>
        <p className="mt-2 text-sm text-text-low">
          {t("legal.version", { version: LEGAL_POLICY_VERSION })}
        </p>
        <div className="prose prose-neutral mt-8 max-w-none space-y-4 text-text-medium">
          <p>{t("legalPrivacy.p1")}</p>
          <p>{t("legalPrivacy.p2")}</p>
          <p>{t("legalPrivacy.p3")}</p>
        </div>
      </article>
    </>
  );
}
