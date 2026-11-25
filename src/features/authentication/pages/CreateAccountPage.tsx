import { useId, useRef, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { checkEmailAvailability } from "@/features/authentication/api/validateEmail";
import type { EmailAvailability } from "@/features/authentication/api/validateEmail";
import { useAppContext } from "@/context";
import { AuthPageShell } from "@/features/authentication/components";
import { MfaError, SignUpError } from "@/types";
import type {
  MfaChallenge,
  SignUpEmailRequest,
  SignUpVerificationRequest,
} from "@/types";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

interface CreateAccountPageProps {
  readonly onCreateAccount: (request: SignUpEmailRequest) => Promise<void>;
  readonly onNavigateToSignIn: () => void;
  readonly mfaChallenge: MfaChallenge | null;
  readonly onVerifyMfaCode: (request: SignUpVerificationRequest) => Promise<void>;
  readonly onResendMfaCode: () => Promise<void>;
  readonly onCancelMfaChallenge: () => void;
}

type EmailStepErrors = {
  email?: string;
};

type DetailsStepErrors = {
  fullName?: string;
  password?: string;
  confirmPassword?: string;
};

type DetailsTouchedFields = {
  fullName: boolean;
  password: boolean;
  confirmPassword: boolean;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateEmailStep(email: string, t: TFunction): EmailStepErrors {
  const errors: EmailStepErrors = {};

  if (!email.trim()) {
    errors.email = t("auth.signUp.validation.emailRequired");
  } else if (!isValidEmail(email)) {
    errors.email = t("auth.signUp.validation.emailInvalid");
  }

  return errors;
}

function validateDetailsStep(
  fullName: string,
  password: string,
  confirmPassword: string,
  t: TFunction,
): DetailsStepErrors {
  const errors: DetailsStepErrors = {};

  if (!fullName.trim()) {
    errors.fullName = t("auth.signUp.validation.fullNameRequired");
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

function validateCode(code: string, t: TFunction): string | undefined {
  if (!code.trim()) {
    return t("auth.signUp.mfa.validation.codeRequired");
  }

  if (!/^\d{6}$/.test(code.trim())) {
    return t("auth.signUp.mfa.validation.codeInvalidFormat");
  }

  return undefined;
}

export function CreateAccountPage({
  onCreateAccount,
  onNavigateToSignIn,
  mfaChallenge,
  onVerifyMfaCode,
  onResendMfaCode,
  onCancelMfaChallenge,
}: Readonly<CreateAccountPageProps>) {
  const { summary } = useAppContext();
  const { t } = useTranslation();
  const emailId = useId();
  const fullNameId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const codeId = useId();
  const cardTitleId = useId();

  // Step 1: request the work email so we can send a verification code.
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailAvailability, setEmailAvailability] = useState<
    EmailAvailability | "idle" | "checking"
  >("idle");
  const emailCheckTokenRef = useRef(0);

  // Step 2: verify the emailed code and collect the account's full name and password.
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [detailsTouched, setDetailsTouched] = useState<DetailsTouchedFields>({
    fullName: false,
    password: false,
    confirmPassword: false,
  });
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const emailErrors = validateEmailStep(email, t);
  const detailsErrors = validateDetailsStep(
    fullName,
    password,
    confirmPassword,
    t,
  );
  const codeError = validateCode(code, t);

  if (!emailErrors.email && emailAvailability === "already-registered") {
    emailErrors.email = t("auth.signUp.validation.emailAlreadyRegistered");
  }

  function resetDetailsFormState() {
    setFullName("");
    setPassword("");
    setConfirmPassword("");
    setDetailsTouched({ fullName: false, password: false, confirmPassword: false });
    setCode("");
    setCodeTouched(false);
    setVerifyError(null);
    setResendMessage(null);
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
    setEmailTouched(true);
    const trimmed = email.trim();

    if (isValidEmail(trimmed)) {
      void runEmailAvailabilityCheck(trimmed);
    } else {
      emailCheckTokenRef.current += 1;
      setEmailAvailability("idle");
    }
  }

  async function handleSubmitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailTouched(true);
    setSubmitError(null);

    if (emailErrors.email) {
      return;
    }

    let availability = emailAvailability;

    if (availability === "idle" || availability === "checking") {
      availability = await runEmailAvailabilityCheck(email.trim());
    }

    if (availability === "already-registered") {
      return;
    }

    setIsSubmittingEmail(true);

    try {
      await onCreateAccount({ email: email.trim() });
      resetDetailsFormState();
    } catch (error) {
      if (error instanceof SignUpError && error.code === "email-in-use") {
        setSubmitError(t("auth.signUp.errors.emailInUse"));
      } else {
        setSubmitError(t("auth.signUp.errors.generic"));
      }
    } finally {
      setIsSubmittingEmail(false);
    }
  }

  async function handleVerifyDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDetailsTouched({ fullName: true, password: true, confirmPassword: true });
    setCodeTouched(true);
    setVerifyError(null);

    if (
      detailsErrors.fullName ||
      detailsErrors.password ||
      detailsErrors.confirmPassword ||
      codeError
    ) {
      return;
    }

    setIsVerifying(true);

    try {
      await onVerifyMfaCode({
        code: code.trim(),
        fullName: fullName.trim(),
        password,
      });
      setIsSuccess(true);
    } catch (error) {
      if (error instanceof MfaError && error.code === "invalid-code") {
        setVerifyError(t("auth.signUp.mfa.errors.invalidCode"));
      } else if (error instanceof MfaError && error.code === "expired-code") {
        setVerifyError(t("auth.signUp.mfa.errors.expiredCode"));
      } else {
        setVerifyError(t("auth.signUp.mfa.errors.generic"));
      }
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendCode() {
    setVerifyError(null);
    setResendMessage(null);
    setIsResending(true);

    try {
      await onResendMfaCode();
      setCode("");
      setCodeTouched(false);
      setResendMessage(t("auth.signUp.mfa.resendSuccess"));
    } catch {
      setVerifyError(t("auth.signUp.mfa.errors.generic"));
    } finally {
      setIsResending(false);
    }
  }

  function handleUseDifferentEmail() {
    onCancelMfaChallenge();
    resetDetailsFormState();
  }

  function markDetailsTouched(field: keyof DetailsTouchedFields) {
    setDetailsTouched((current) => ({
      ...current,
      [field]: true,
    }));
  }

  return (
    <AuthPageShell
      eyebrow={t("auth.signUp.eyebrow")}
      subtitle={t("auth.signUp.subtitle", { summary })}
      highlights={[
        t("auth.signUp.highlights.onboarding"),
        t("auth.signUp.highlights.security"),
        t("auth.signUp.highlights.support"),
      ]}
      cardTitleId={cardTitleId}
    >
      {isSuccess ? (
        <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
          <Typography id={cardTitleId} variant="h5" component="h2">
            {t("auth.signUp.success.title")}
          </Typography>
          <Typography color="text.secondary">
            {t("auth.signUp.success.description")}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={onNavigateToSignIn}
          >
            {t("auth.signUp.actions.goToSignIn")}
          </Button>
        </Stack>
      ) : mfaChallenge ? (
        <>
          <Stack spacing={1}>
            <Typography id={cardTitleId} variant="h5" component="h2">
              {t("auth.signUp.mfa.title")}
            </Typography>
            <Typography color="text.secondary">
              {t("auth.signUp.mfa.description", {
                email: mfaChallenge.email,
              })}
            </Typography>
          </Stack>

          <Box
            component="form"
            onSubmit={handleVerifyDetails}
            noValidate
            sx={{ display: "grid", gap: 3 }}
          >
            <TextField
              id={codeId}
              name="code"
              label={t("auth.signUp.mfa.fields.code")}
              type="text"
              autoComplete="one-time-code"
              slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6 } }}
              fullWidth
              value={code}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
              }}
              onBlur={() => {
                setCodeTouched(true);
              }}
              error={codeTouched && Boolean(codeError)}
              helperText={codeTouched ? codeError : undefined}
              disabled={isVerifying}
              placeholder={t("auth.signUp.mfa.placeholders.code")}
            />

            <TextField
              id={fullNameId}
              name="fullName"
              label={t("auth.signUp.fields.fullName")}
              type="text"
              autoComplete="name"
              fullWidth
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
              }}
              onBlur={() => {
                markDetailsTouched("fullName");
              }}
              error={detailsTouched.fullName && Boolean(detailsErrors.fullName)}
              helperText={
                detailsTouched.fullName ? detailsErrors.fullName : undefined
              }
              disabled={isVerifying}
              placeholder={t("auth.signUp.placeholders.fullName")}
            />

            <TextField
              id={passwordId}
              name="password"
              label={t("auth.signUp.fields.password")}
              type="password"
              autoComplete="new-password"
              fullWidth
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              onBlur={() => {
                markDetailsTouched("password");
              }}
              error={detailsTouched.password && Boolean(detailsErrors.password)}
              helperText={
                detailsTouched.password ? detailsErrors.password : undefined
              }
              disabled={isVerifying}
              placeholder={t("auth.signUp.placeholders.password")}
            />

            <TextField
              id={confirmPasswordId}
              name="confirmPassword"
              label={t("auth.signUp.fields.confirmPassword")}
              type="password"
              autoComplete="new-password"
              fullWidth
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
              }}
              onBlur={() => {
                markDetailsTouched("confirmPassword");
              }}
              error={
                detailsTouched.confirmPassword &&
                Boolean(detailsErrors.confirmPassword)
              }
              helperText={
                detailsTouched.confirmPassword
                  ? detailsErrors.confirmPassword
                  : undefined
              }
              disabled={isVerifying}
              placeholder={t("auth.signUp.placeholders.confirmPassword")}
            />

            {verifyError ? <Alert severity="error">{verifyError}</Alert> : null}
            {resendMessage ? (
              <Alert severity="success">{resendMessage}</Alert>
            ) : null}

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isVerifying}
              startIcon={
                isVerifying ? (
                  <CircularProgress size={18} color="inherit" />
                ) : undefined
              }
            >
              {isVerifying
                ? t("auth.signUp.mfa.actions.verifying")
                : t("auth.signUp.mfa.actions.verify")}
            </Button>
          </Box>

          <Stack
            direction="row"
            spacing={2}
            sx={{ justifyContent: "space-between", flexWrap: "wrap" }}
          >
            <Button
              variant="text"
              onClick={() => {
                void handleResendCode();
              }}
              disabled={isResending || isVerifying}
            >
              {isResending
                ? t("auth.signUp.mfa.actions.resending")
                : t("auth.signUp.mfa.actions.resend")}
            </Button>
            <Button
              variant="text"
              onClick={handleUseDifferentEmail}
              disabled={isVerifying}
            >
              {t("auth.signUp.mfa.actions.useDifferentEmail")}
            </Button>
          </Stack>
        </>
      ) : (
        <>
          <Stack spacing={1}>
            <Typography id={cardTitleId} variant="h5" component="h2">
              {t("auth.signUp.title")}
            </Typography>
            <Typography color="text.secondary">
              {t("auth.signUp.description")}
            </Typography>
          </Stack>

          <Box
            component="form"
            onSubmit={handleSubmitEmail}
            noValidate
            sx={{ display: "grid", gap: 3 }}
          >
            <TextField
              id={emailId}
              name="email"
              label={t("auth.signUp.fields.email")}
              type="email"
              autoComplete="email"
              fullWidth
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                emailCheckTokenRef.current += 1;
                setEmailAvailability("idle");
              }}
              onBlur={handleEmailBlur}
              error={emailTouched && Boolean(emailErrors.email)}
              helperText={
                emailTouched && emailErrors.email
                  ? emailErrors.email
                  : !emailErrors.email && emailAvailability === "checking"
                    ? t("auth.signUp.emailCheck.checking")
                    : !emailErrors.email && emailAvailability === "unknown"
                      ? t("auth.signUp.emailCheck.unavailable")
                      : undefined
              }
              disabled={isSubmittingEmail}
              placeholder={t("auth.signUp.placeholders.email")}
            />

            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmittingEmail || emailAvailability === "checking"}
              startIcon={
                isSubmittingEmail ? (
                  <CircularProgress size={18} color="inherit" />
                ) : undefined
              }
            >
              {isSubmittingEmail
                ? t("auth.signUp.actions.sendingCode")
                : t("auth.signUp.actions.continue")}
            </Button>
          </Box>

          <Typography sx={{ textAlign: "center" }}>
            {t("auth.signUp.signInPrompt")}{" "}
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={onNavigateToSignIn}
            >
              {t("auth.signUp.actions.signIn")}
            </Link>
          </Typography>
        </>
      )}
    </AuthPageShell>
  );
}
