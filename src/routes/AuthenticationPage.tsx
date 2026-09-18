import { useState } from "react";
import type { FormEvent } from "react";

import "./AuthenticationPage.css";

export function AuthenticationPage({
  onSubmit,
}: Readonly<{
  onSubmit: (email: string, password: string) => void;
}>) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(email, password);
  }

  return (
    <main className="authentication-page">
      <section
        className="authentication-panel"
        aria-labelledby="authentication-title"
      >
        <p className="eyebrow">Novavex ERP</p>
        <h1 id="authentication-title">Sign in to your workspace</h1>
        <p className="authentication-panel__summary">
          Authenticate to access your tenant, dashboards, and feature modules.
        </p>
        <form className="authentication-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button type="submit">Sign in</button>
        </form>
      </section>
    </main>
  );
}
