import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import "./SupportPage.css";

const sectionKeys = [
  "gettingStarted",
  "accountAccess",
  "troubleshooting",
  "contactSupport",
] as const;

export function SupportPage() {
  const { t } = useTranslation();

  return (
    <main className="support-page">
      <div className="support-page__header">
        <Link className="support-page__back-link" to="/">
          {t("supportPage.back")}
        </Link>
        <p className="support-page__eyebrow">{t("supportPage.eyebrow")}</p>
        <h1>{t("supportPage.title")}</h1>
        <p className="support-page__description">
          {t("supportPage.description")}
        </p>
      </div>
      <div className="support-page__sections">
        {sectionKeys.map((sectionKey) => (
          <section className="support-page__section" key={sectionKey}>
            <h2>{t(`supportPage.sections.${sectionKey}.title`)}</h2>
            <p>{t(`supportPage.sections.${sectionKey}.body`)}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
