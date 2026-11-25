import { useId, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { demoSignInCredentials } from "@/config/appConfig";
import { useAppContext } from "@/context";
import { AuthPageShell } from "@/features/authentication/components";
import { MfaError, SignInError } from "@/types";
import type { MfaChallenge, SignInRequest } from "@/types";
import type { TFunction } from "i18next";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const rememberedEmailStorageKey = "novavex.auth.rememberedEmail";

function getRememberedEmail() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(rememberedEmailStorageKey) ?? "";
}

interface AuthenticationPageProps {
  readonly onAuthenticate: (credentials: SignInRequest) => Promise<void>;
  readonly onNavigateToCreateAccount: () => void;
  readonly mfaChallenge: MfaChallenge | null;
  readonly onVerifyMfaCode: (code: string) => Promise<void>;
  readonly onResendMfaCode: () => Promise<void>;
  readonly onCancelMfaChallenge: () => void;
}

type FormErrors = {
  email?: string;
  password?: string;
};

type TouchedFields = {
  email: boolean;
  password: boolean;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(
  email: string,
  password: string,
  t: TFunction,
): FormErrors {
  const errors: FormErrors = {};

  if (!email.trim()) {
    errors.email = t("auth.signIn.validation.emailRequired");
  } else if (!isValidEmail(email)) {
    errors.email = t("auth.signIn.validation.emailInvalid");
  }

  if (!password) {
    errors.password = t("auth.signIn.validation.passwordRequired");
  } else if (password.length < 8) {
    errors.password = t("auth.signIn.validation.passwordLength");
  }

  return errors;
}

function validateCode(code: string, t: TFunction): string | undefined {
  if (!code.trim()) {
    return t("auth.signIn.mfa.validation.codeRequired");
  }

  if (!/^\d{6}$/.test(code.trim())) {
    return t("auth.signIn.mfa.validation.codeInvalidFormat");
  }

  return undefined;
}

export function AuthenticationPage({
  onAuthenticate,
  onNavigateToCreateAccount,
  mfaChallenge,
  onVerifyMfaCode,
  onResendMfaCode,
  onCancelMfaChallenge,
}: Readonly<AuthenticationPageProps>) {
  const { summary, supportLinks } = useAppContext();
  const { i18n, t } = useTranslation();
  const emailId = useId();
  const passwordId = useId();
  const codeId = useId();
  const cardTitleId = useId();
  const activeLanguage = (i18n.resolvedLanguage ?? i18n.language)
    .toLowerCase()
    .startsWith("ro")
    ? "ro"
    : "en";
  const [rememberedEmail] = useState(getRememberedEmail);
  const [email, setEmail] = useState(rememberedEmail);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedEmail));
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({
    email: false,
    password: false,
  });
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const errors = validateForm(email, password, t);
  const codeError = validateCode(code, t);

  function resetMfaFormState() {
    setCode("");
    setCodeTouched(false);
    setVerifyError(null);
    setResendMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouchedFields({ email: true, password: true });
    setSubmitError(null);

    if (errors.email || errors.password) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onAuthenticate({ email: email.trim(), password });
      resetMfaFormState();

      if (typeof window !== "undefined") {
        if (rememberMe) {
          window.localStorage.setItem(rememberedEmailStorageKey, email.trim());
        } else {
          window.localStorage.removeItem(rememberedEmailStorageKey);
        }
      }
    } catch (error) {
      if (
        error instanceof SignInError &&
        error.code === "invalid-credentials"
      ) {
        setSubmitError(t("auth.signIn.errors.invalidCredentials"));
      } else {
        setSubmitError(t("auth.signIn.errors.generic"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCodeTouched(true);
    setVerifyError(null);

    if (codeError) {
      return;
    }

    setIsVerifying(true);

    try {
      await onVerifyMfaCode(code.trim());
    } catch (error) {
      if (error instanceof MfaError && error.code === "invalid-code") {
        setVerifyError(t("auth.signIn.mfa.errors.invalidCode"));
      } else if (error instanceof MfaError && error.code === "expired-code") {
        setVerifyError(t("auth.signIn.mfa.errors.expiredCode"));
      } else {
        setVerifyError(t("auth.signIn.mfa.errors.generic"));
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
      setResendMessage(t("auth.signIn.mfa.resendSuccess"));
    } catch {
      setVerifyError(t("auth.signIn.mfa.errors.generic"));
    } finally {
      setIsResending(false);
    }
  }

  function handleCancelMfa() {
    onCancelMfaChallenge();
    setPassword("");
    resetMfaFormState();
  }

  function markTouched(field: keyof TouchedFields) {
    setTouchedFields((current) => ({
      ...current,
      [field]: true,
    }));
  }

  function handleLanguageChange(event: SelectChangeEvent) {
    void i18n.changeLanguage(event.target.value);
  }

  const languageSwitcher = (
    <FormControl size="small" sx={{ minWidth: "9rem" }}>
      <InputLabel id={`${emailId}-language-label`}>
        {t("language.label")}
      </InputLabel>
      <Select
        labelId={`${emailId}-language-label`}
        label={t("language.label")}
        value={activeLanguage}
        onChange={handleLanguageChange}
      >
        <MenuItem value="en">{t("language.options.en")}</MenuItem>
        <MenuItem value="ro">{t("language.options.ro")}</MenuItem>
      </Select>
    </FormControl>
  );

  const footer = (
    <Stack
      direction="row"
      spacing={2.5}
      sx={{
        justifyContent: "center",
        flexWrap: "wrap",
        pt: 2,
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Link component={RouterLink} to="/support" underline="hover">
        {t("auth.signIn.footer.support")}
      </Link>
      <Link component={RouterLink} to="/privacy" underline="hover">
        {t("auth.signIn.footer.privacy")}
      </Link>
      <Link
        href={supportLinks.terms}
        target="_blank"
        rel="noopener noreferrer"
        underline="hover"
      >
        {t("auth.signIn.footer.terms")}
      </Link>
    </Stack>
  );

  return (
    <AuthPageShell
      eyebrow={t("auth.signIn.eyebrow")}
      topbarExtra={languageSwitcher}
      subtitle={t("auth.signIn.subtitle", { summary })}
      highlights={[
        t("auth.signIn.highlights.security"),
        t("auth.signIn.highlights.access"),
        t("auth.signIn.highlights.support"),
      ]}
      cardTitleId={cardTitleId}
      footer={footer}
    >
      {mfaChallenge ? (
        <>
          <Stack spacing={1}>
            <Typography id={cardTitleId} variant="h5" component="h2">
              {t("auth.signIn.mfa.title")}
            </Typography>
            <Typography color="text.secondary">
              {t("auth.signIn.mfa.description", {
                email: mfaChallenge.email,
              })}
            </Typography>
          </Stack>

          <Box
            component="form"
            onSubmit={handleVerifyCode}
            noValidate
            sx={{ display: "grid", gap: 3 }}
          >
            <TextField
              id={codeId}
              name="code"
              label={t("auth.signIn.mfa.fields.code")}
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
              placeholder={t("auth.signIn.mfa.placeholders.code")}
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
                ? t("auth.signIn.mfa.actions.verifying")
                : t("auth.signIn.mfa.actions.verify")}
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
                ? t("auth.signIn.mfa.actions.resending")
                : t("auth.signIn.mfa.actions.resend")}
            </Button>
            <Button
              variant="text"
              onClick={handleCancelMfa}
              disabled={isVerifying}
            >
              {t("auth.signIn.mfa.actions.useDifferentAccount")}
            </Button>
          </Stack>
        </>
      ) : (
        <>
          <Stack spacing={1}>
            <Typography id={cardTitleId} variant="h5" component="h2">
              {t("auth.signIn.title")}
            </Typography>
            <Typography color="text.secondary">
              {t("auth.signIn.description")}
            </Typography>
            <Alert severity="info" variant="outlined">
              {t("auth.signIn.hint", demoSignInCredentials)}
            </Alert>
          </Stack>

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ display: "grid", gap: 3 }}
          >
            <TextField
              id={emailId}
              name="email"
              label={t("auth.signIn.fields.email")}
              type="email"
              autoComplete="email"
              fullWidth
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
              onBlur={() => {
                markTouched("email");
              }}
              error={touchedFields.email && Boolean(errors.email)}
              helperText={touchedFields.email ? errors.email : undefined}
              disabled={isSubmitting}
              placeholder={t("auth.signIn.placeholders.email")}
            />

            <TextField
              id={passwordId}
              name="password"
              label={t("auth.signIn.fields.password")}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              fullWidth
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              onBlur={() => {
                markTouched("password");
              }}
              error={touchedFields.password && Boolean(errors.password)}
              helperText={touchedFields.password ? errors.password : undefined}
              disabled={isSubmitting}
              placeholder={t("auth.signIn.placeholders.password")}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword
                            ? t("auth.signIn.actions.hidePassword")
                            : t("auth.signIn.actions.showPassword")
                        }
                        aria-pressed={showPassword}
                        onClick={() => {
                          setShowPassword((current) => !current);
                        }}
                        disabled={isSubmitting}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Stack
              direction="row"
              spacing={2}
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(event) => {
                      setRememberMe(event.target.checked);
                    }}
                    disabled={isSubmitting}
                  />
                }
                label={t("auth.signIn.actions.rememberMe")}
              />
              <Link
                href={supportLinks.forgotPassword}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                {t("auth.signIn.actions.forgotPassword")}
              </Link>
            </Stack>

            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : undefined
              }
            >
              {isSubmitting
                ? t("auth.signIn.actions.signingIn")
                : t("auth.signIn.actions.signIn")}
            </Button>
          </Box>

          <Typography sx={{ textAlign: "center" }}>
            {t("auth.signIn.signUpPrompt")}{" "}
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={onNavigateToCreateAccount}
            >
              {t("auth.signIn.actions.createAccount")}
            </Link>
          </Typography>
        </>
      )}
    </AuthPageShell>
  );
}
