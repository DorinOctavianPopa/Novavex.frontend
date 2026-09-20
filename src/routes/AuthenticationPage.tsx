import { useState } from "react";
import type { FormEvent } from "react";

import concept1Image from "../assets/concept1.png";
import "./AuthenticationPage.css";

function BrandLogo() {
  return (
    <div className="brand-visual" aria-label="Novavex workspace branding">
      <img className="brand-image" src={concept1Image} alt="Novavex logo" />
    </div>
  );
}

export function AuthenticationPage({
  onSubmit,
}: Readonly<{
  onSubmit: (email: string, password: string) => boolean;
}>) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isSuccessful = onSubmit(email, password);

    if (!isSuccessful) {
      setErrorMessage("Invalid email or password. Please try again.");
      return;
    }

    setErrorMessage("");
  }

  return (
    <main className="authentication-page">
      <div className="authentication-shell">
        <BrandLogo />

        <section
          className="authentication-panel"
          aria-labelledby="authentication-title"
        >
          <p className="eyebrow">Welcome back</p>
          <h1 id="authentication-title">Sign in to your workspace</h1>
          <p className="authentication-panel__summary">
            Authenticate to access your tenant, dashboards, and feature modules.
          </p>
          <form className="authentication-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (errorMessage) {
                    setErrorMessage("");
                  }
                }}
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (errorMessage) {
                    setErrorMessage("");
                  }
                }}
              />
            </div>

            {errorMessage ? (
              <p className="authentication-error" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <button type="submit">Sign in</button>
          </form>
        </section>
      </div>
    </main>
  );
}
