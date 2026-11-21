import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import "./PrivacyPage.css";

const sectionKeys = [
  "dataCollection",
  "dataUsage",
  "dataProtection",
  "contact",
] as const;

export function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <main className="privacy-page">
      <div className="privacy-page__header">
        <Link className="privacy-page__back-link" to="/">
          {t("privacyPage.back")}
        </Link>
        <p className="privacy-page__eyebrow">{t("privacyPage.eyebrow")}</p>
        <h1>{t("privacyPage.title")}</h1>
        <p className="privacy-page__description">
          {t("privacyPage.description")}
        </p>
      </div>
      <div className="privacy-page__sections">
        {sectionKeys.map((sectionKey) => (
          <section className="privacy-page__section" key={sectionKey}>
            <h2>{t(`privacyPage.sections.${sectionKey}.title`)}</h2>
            <p>{t(`privacyPage.sections.${sectionKey}.body`)}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
