import { useId, useState } from 'react'

import { demoSignInCredentials } from '@/config/appConfig'
import { useAppContext } from '@/context'
import type { SignInRequest } from '@/types'
import { useTranslation } from 'react-i18next'

import './AuthenticationPage.css'

const rememberedEmailStorageKey = 'novavex.auth.rememberedEmail'

function getRememberedEmail() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(rememberedEmailStorageKey) ?? ''
}

interface AuthenticationPageProps {
  readonly onAuthenticate: (credentials: SignInRequest) => Promise<void>
}

type FormErrors = {
  email?: string
  password?: string
}

type TouchedFields = {
  email: boolean
  password: boolean
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateForm(email: string, password: string, t: (key: string) => string): FormErrors {
  const errors: FormErrors = {}

  if (!email.trim()) {
    errors.email = t('auth.signIn.validation.emailRequired')
  } else if (!isValidEmail(email)) {
    errors.email = t('auth.signIn.validation.emailInvalid')
  }

  if (!password) {
    errors.password = t('auth.signIn.validation.passwordRequired')
  } else if (password.length < 8) {
    errors.password = t('auth.signIn.validation.passwordLength')
  }

  return errors
}

export function AuthenticationPage({ onAuthenticate }: Readonly<AuthenticationPageProps>) {
  const { name, summary, supportLinks } = useAppContext()
  const { i18n, t } = useTranslation()
  const emailId = useId()
  const passwordId = useId()
  const activeLanguage = (i18n.resolvedLanguage ?? i18n.language).toLowerCase().startsWith('ro')
    ? 'ro'
    : 'en'
  const [rememberedEmail] = useState(getRememberedEmail)
  const [email, setEmail] = useState(rememberedEmail)
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedEmail))
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({
    email: false,
    password: false,
  })

  const errors = validateForm(email, password, t)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouchedFields({ email: true, password: true })
    setSubmitError(null)

    if (errors.email || errors.password) {
      return
    }

    setIsSubmitting(true)

    try {
      await onAuthenticate({ email: email.trim(), password })

      if (typeof window !== 'undefined') {
        if (rememberMe) {
          window.localStorage.setItem(rememberedEmailStorageKey, email.trim())
        } else {
          window.localStorage.removeItem(rememberedEmailStorageKey)
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'invalid-credentials') {
        setSubmitError(t('auth.signIn.errors.invalidCredentials'))
      } else {
        setSubmitError(t('auth.signIn.errors.generic'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function markTouched(field: keyof TouchedFields) {
    setTouchedFields((current) => ({
      ...current,
      [field]: true,
    }))
  }

  return (
    <main className="authentication-page">
      <section className="authentication-shell">
        <div className="authentication-shell__intro authentication-panel">
          <div className="authentication-shell__topbar">
            <p className="authentication-shell__eyebrow">{t('auth.signIn.eyebrow')}</p>
            <label className="authentication-language-switcher">
              <span>{t('language.label')}</span>
              <select
                value={activeLanguage}
                onChange={(event) => {
                  void i18n.changeLanguage(event.target.value)
                }}
              >
                <option value="en">{t('language.options.en')}</option>
                <option value="ro">{t('language.options.ro')}</option>
              </select>
            </label>
          </div>
          <div className="authentication-shell__copy">
            <h1>{name}</h1>
            <p>{t('auth.signIn.subtitle', { defaultValue: summary })}</p>
          </div>
          <ul className="authentication-highlights">
            <li>{t('auth.signIn.highlights.security')}</li>
            <li>{t('auth.signIn.highlights.access')}</li>
            <li>{t('auth.signIn.highlights.support')}</li>
          </ul>
        </div>

        <section className="authentication-panel authentication-card" aria-labelledby="sign-in-title">
          <div className="authentication-card__header">
            <h2 id="sign-in-title">{t('auth.signIn.title')}</h2>
            <p>{t('auth.signIn.description')}</p>
            <p className="authentication-card__hint">
              {t('auth.signIn.hint', demoSignInCredentials)}
            </p>
          </div>

          <form className="authentication-form" onSubmit={handleSubmit} noValidate>
            <label className="authentication-field" htmlFor={emailId}>
              <span>{t('auth.signIn.fields.email')}</span>
              <input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                }}
                onBlur={() => {
                  markTouched('email')
                }}
                aria-invalid={touchedFields.email && Boolean(errors.email)}
                aria-describedby={errors.email ? `${emailId}-error` : undefined}
                disabled={isSubmitting}
                placeholder={t('auth.signIn.placeholders.email')}
              />
              {touchedFields.email && errors.email ? (
                <span id={`${emailId}-error`} className="authentication-field__error" role="alert">
                  {errors.email}
                </span>
              ) : null}
            </label>

            <label className="authentication-field" htmlFor={passwordId}>
              <span>{t('auth.signIn.fields.password')}</span>
              <div className="authentication-password-field">
                <input
                  id={passwordId}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                  }}
                  onBlur={() => {
                    markTouched('password')
                  }}
                  aria-invalid={touchedFields.password && Boolean(errors.password)}
                  aria-describedby={errors.password ? `${passwordId}-error` : undefined}
                  disabled={isSubmitting}
                  placeholder={t('auth.signIn.placeholders.password')}
                />
                <button
                  type="button"
                  className="authentication-password-field__toggle"
                  onClick={() => {
                    setShowPassword((current) => !current)
                  }}
                  aria-label={showPassword ? t('auth.signIn.actions.hidePassword') : t('auth.signIn.actions.showPassword')}
                  aria-pressed={showPassword}
                  disabled={isSubmitting}
                >
                  {showPassword ? t('auth.signIn.actions.hidePassword') : t('auth.signIn.actions.showPassword')}
                </button>
              </div>
              {touchedFields.password && errors.password ? (
                <span id={`${passwordId}-error`} className="authentication-field__error" role="alert">
                  {errors.password}
                </span>
              ) : null}
            </label>

            <div className="authentication-form__meta">
              <label className="authentication-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => {
                    setRememberMe(event.target.checked)
                  }}
                  disabled={isSubmitting}
                />
                <span>{t('auth.signIn.actions.rememberMe')}</span>
              </label>
              <a href={supportLinks.forgotPassword} target="_blank" rel="noopener noreferrer">{t('auth.signIn.actions.forgotPassword')}</a>
            </div>

            {submitError ? (
              <p className="authentication-form__error" role="alert">
                {submitError}
              </p>
            ) : null}

            <button type="submit" className="authentication-form__submit" disabled={isSubmitting}>
              {isSubmitting ? t('auth.signIn.actions.signingIn') : t('auth.signIn.actions.signIn')}
            </button>
          </form>

          <p className="authentication-card__signup">
            {t('auth.signIn.signUpPrompt')}{' '}
            <a href={supportLinks.createAccount} target="_blank" rel="noopener noreferrer">{t('auth.signIn.actions.createAccount')}</a>
          </p>

          <footer className="authentication-card__footer">
            <a href={supportLinks.support} target="_blank" rel="noopener noreferrer">{t('auth.signIn.footer.support')}</a>
            <a href={supportLinks.privacy} target="_blank" rel="noopener noreferrer">{t('auth.signIn.footer.privacy')}</a>
            <a href={supportLinks.terms} target="_blank" rel="noopener noreferrer">{t('auth.signIn.footer.terms')}</a>
          </footer>
        </section>
      </section>
    </main>
  )
}
