import { useId, useRef, useState } from "react";

import concept1Image from "@/assets/concept1.png";
import { checkEmailAvailability } from "@/features/authentication/api/validateEmail";
import type { EmailAvailability } from "@/features/authentication/api/validateEmail";
import { useAppContext } from "@/context";
import { SignUpError } from "@/types";
import type { SignUpRequest } from "@/types";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import "./AuthenticationPage.css";

interface CreateAccountPageProps {
  readonly onCreateAccount: (request: SignUpRequest) => Promise<void>;
  readonly onNavigateToSignIn: () => void;
}

type FormErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type TouchedFields = {
  fullName: boolean;
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string,
  t: TFunction,
): FormErrors {
  const errors: FormErrors = {};

  if (!fullName.trim()) {
    errors.fullName = t("auth.signUp.validation.fullNameRequired");
  }

  if (!email.trim()) {
    errors.email = t("auth.signUp.validation.emailRequired");
  } else if (!isValidEmail(email)) {
    errors.email = t("auth.signUp.validation.emailInvalid");
  }

  if (!password) {
    errors.password = t("auth.signUp.validation.passwordRequired");
  } else if (password.length < 8) {
    errors.password = t("auth.signUp.validation.passwordLength");
  }

  if (!confirmPassword) {
    errors.confirmPassword = t(
      "auth.signUp.validation.confirmPasswordRequired",
    );
  } else if (confirmPassword !== password) {
    errors.confirmPassword = t(
      "auth.signUp.validation.confirmPasswordMismatch",
    );
  }

  return errors;
}

export function CreateAccountPage({
  onCreateAccount,
  onNavigateToSignIn,
}: Readonly<CreateAccountPageProps>) {
  const { name, summary } = useAppContext();
  const { t } = useTranslation();
  const fullNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailAvailability, setEmailAvailability] = useState<
    EmailAvailability | "idle" | "checking"
  >("idle");
  const emailCheckTokenRef = useRef(0);
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const errors = validateForm(fullName, email, password, confirmPassword, t);

  if (!errors.email && emailAvailability === "already-registered") {
    errors.email = t("auth.signUp.validation.emailAlreadyRegistered");
  }

  async function runEmailAvailabilityCheck(
    value: string,
  ): Promise<EmailAvailability> {
    const token = ++emailCheckTokenRef.current;
    setEmailAvailability("checking");
    const result = await checkEmailAvailability(value);

    if (emailCheckTokenRef.current === token) {
      setEmailAvailability(result.availability);
    }

    return result.availability;
  }

  function handleEmailBlur() {
    markTouched("email");
    const trimmed = email.trim();

    if (isValidEmail(trimmed)) {
      void runEmailAvailabilityCheck(trimmed);
    } else {
      emailCheckTokenRef.current += 1;
      setEmailAvailability("idle");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouchedFields({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    setSubmitError(null);

    if (
      errors.fullName ||
      errors.email ||
      errors.password ||
      errors.confirmPassword
    ) {
      return;
    }

    let availability = emailAvailability;

    if (availability === "idle" || availability === "checking") {
      availability = await runEmailAvailabilityCheck(email.trim());
    }

    if (availability === "already-registered") {
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreateAccount({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      setIsSuccess(true);
    } catch (error) {
      if (error instanceof SignUpError && error.code === "email-in-use") {
        setSubmitError(t("auth.signUp.errors.emailInUse"));
      } else {
        setSubmitError(t("auth.signUp.errors.generic"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function markTouched(field: keyof TouchedFields) {
    setTouchedFields((current) => ({
      ...current,
      [field]: true,
    }));
  }

  return (
    <main className="authentication-page">
      <section className="authentication-shell">
        <div className="authentication-shell__intro authentication-panel">
          <div className="authentication-shell__topbar">
            <p className="authentication-shell__eyebrow">
              {t("auth.signUp.eyebrow")}
            </p>
          </div>
          <div className="authentication-shell__copy">
            <img
              className="authentication-shell__logo"
              src={concept1Image}
              alt="Novavex logo"
            />
            <h1>{name}</h1>
            <p>{t("auth.signUp.subtitle", { summary })}</p>
          </div>
          <ul className="authentication-highlights">
            <li>{t("auth.signUp.highlights.onboarding")}</li>
            <li>{t("auth.signUp.highlights.security")}</li>
            <li>{t("auth.signUp.highlights.support")}</li>
          </ul>
        </div>

        <section
          className="authentication-panel authentication-card"
          aria-labelledby="create-account-title"
        >
          {isSuccess ? (
            <div className="authentication-card__success">
              <h2 id="create-account-title">
                {t("auth.signUp.success.title")}
              </h2>
              <p>{t("auth.signUp.success.description")}</p>
              <button
                type="button"
                className="authentication-form__submit"
                onClick={onNavigateToSignIn}
              >
                {t("auth.signUp.actions.goToSignIn")}
              </button>
            </div>
          ) : (
            <>
              <div className="authentication-card__header">
                <h2 id="create-account-title">{t("auth.signUp.title")}</h2>
                <p>{t("auth.signUp.description")}</p>
              </div>

              <form
                className="authentication-form"
                onSubmit={handleSubmit}
                noValidate
              >
                <label className="authentication-field" htmlFor={fullNameId}>
                  <span>{t("auth.signUp.fields.fullName")}</span>
                  <input
                    id={fullNameId}
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                    }}
                    onBlur={() => {
                      markTouched("fullName");
                    }}
                    aria-invalid={
                      touchedFields.fullName && Boolean(errors.fullName)
                    }
                    aria-describedby={
                      touchedFields.fullName && errors.fullName
                        ? `${fullNameId}-error`
                        : undefined
                    }
                    disabled={isSubmitting}
                    placeholder={t("auth.signUp.placeholders.fullName")}
                  />
                  {touchedFields.fullName && errors.fullName ? (
                    <span
                      id={`${fullNameId}-error`}
                      className="authentication-field__error"
                      role="alert"
                    >
                      {errors.fullName}
                    </span>
                  ) : null}
                </label>

                <label className="authentication-field" htmlFor={emailId}>
                  <span>{t("auth.signUp.fields.email")}</span>
                  <input
                    id={emailId}
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      emailCheckTokenRef.current += 1;
                      setEmailAvailability("idle");
                    }}
                    onBlur={handleEmailBlur}
                    aria-invalid={touchedFields.email && Boolean(errors.email)}
                    aria-describedby={
                      touchedFields.email && errors.email
                        ? `${emailId}-error`
                        : undefined
                    }
                    disabled={isSubmitting}
                    placeholder={t("auth.signUp.placeholders.email")}
                  />
                  {touchedFields.email && errors.email ? (
                    <span
                      id={`${emailId}-error`}
                      className="authentication-field__error"
                      role="alert"
                    >
                      {errors.email}
                    </span>
                  ) : null}
                  {!errors.email && emailAvailability === "checking" ? (
                    <span className="authentication-field__hint">
                      {t("auth.signUp.emailCheck.checking")}
                    </span>
                  ) : null}
                  {!errors.email && emailAvailability === "unknown" ? (
                    <span className="authentication-field__hint">
                      {t("auth.signUp.emailCheck.unavailable")}
                    </span>
                  ) : null}
                </label>

                <label className="authentication-field" htmlFor={passwordId}>
                  <span>{t("auth.signUp.fields.password")}</span>
                  <input
                    id={passwordId}
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                    }}
                    onBlur={() => {
                      markTouched("password");
                    }}
                    aria-invalid={
                      touchedFields.password && Boolean(errors.password)
                    }
                    aria-describedby={
                      touchedFields.password && errors.password
                        ? `${passwordId}-error`
                        : undefined
                    }
                    disabled={isSubmitting}
                    placeholder={t("auth.signUp.placeholders.password")}
                  />
                  {touchedFields.password && errors.password ? (
                    <span
                      id={`${passwordId}-error`}
                      className="authentication-field__error"
                      role="alert"
                    >
                      {errors.password}
                    </span>
                  ) : null}
                </label>

                <label
                  className="authentication-field"
                  htmlFor={confirmPasswordId}
                >
                  <span>{t("auth.signUp.fields.confirmPassword")}</span>
                  <input
                    id={confirmPasswordId}
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                    }}
                    onBlur={() => {
                      markTouched("confirmPassword");
                    }}
                    aria-invalid={
                      touchedFields.confirmPassword &&
                      Boolean(errors.confirmPassword)
                    }
                    aria-describedby={
                      touchedFields.confirmPassword && errors.confirmPassword
                        ? `${confirmPasswordId}-error`
                        : undefined
                    }
                    disabled={isSubmitting}
                    placeholder={t("auth.signUp.placeholders.confirmPassword")}
                  />
                  {touchedFields.confirmPassword && errors.confirmPassword ? (
                    <span
                      id={`${confirmPasswordId}-error`}
                      className="authentication-field__error"
                      role="alert"
                    >
                      {errors.confirmPassword}
                    </span>
                  ) : null}
                </label>

                {submitError ? (
                  <p className="authentication-form__error" role="alert">
                    {submitError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="authentication-form__submit"
                  disabled={isSubmitting || emailAvailability === "checking"}
                >
                  {isSubmitting
                    ? t("auth.signUp.actions.creating")
                    : t("auth.signUp.actions.createAccount")}
                </button>
              </form>

              <p className="authentication-card__signup">
                {t("auth.signUp.signInPrompt")}{" "}
                <button
                  type="button"
                  className="authentication-link-button"
                  onClick={onNavigateToSignIn}
                >
                  {t("auth.signUp.actions.signIn")}
                </button>
              </p>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
