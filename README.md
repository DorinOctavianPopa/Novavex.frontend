# Novavex Frontend

This project now uses a feature-driven React structure designed for an ERP that must remain modular, scalable, and easy to extend.

## Directory structure

```text
src/
├── assets/          # Global static assets
├── components/      # Shared UI building blocks
├── config/          # Global configuration and architecture metadata
├── context/         # Global React context objects
├── features/        # Isolated ERP modules
│   ├── dashboard/
│   ├── financial/
│   ├── accounting/
│   ├── inventory/
│   └── crm/
├── hooks/           # Reusable hooks
├── lib/             # Shared library integration points
├── providers/       # Application-wide providers
├── routes/          # Route composition entry points
├── services/        # Shared service layer
├── types/           # Global TypeScript types
├── utils/           # Shared utility helpers
├── App.tsx
└── main.tsx
```

## Authentication and authorization architecture

- **Authentication** calls the `NovavexWA` backend's `LoginController` (see
  `src/features/authentication/api/loginApi.ts`):
  - `POST /api/api/login` + `/api/api/login/verify` for sign-in (password check,
    then an emailed 6-digit MFA code).
  - `POST /api/api/login/users` + `/api/api/login/users/verify` for account
    creation (emailed verification code, full name, and password).
  - The backend double-prefixes routes (`UsePathBase("/api")` on top of the
    controller's own `api/[controller]` route), so both `/api` segments are
    required; see `NovavexWA.Tests/LoginServiceTests.cs`.
  - The dev server proxies `/api` to the backend (`vite.config.ts`,
    override with `VITE_BACKEND_URL`) since the backend does not configure CORS.
  - The returned access token is a short-lived (15 minute) JWT; its claims
    (roles, scopes, user attributes) are decoded client-side to populate the
    session shown in the UI. There is currently no refresh-token endpoint.
- **Authorization** is enforced via combined **RBAC + ABAC** policies:
  - RBAC with role checks (`super_admin`, `cto`, etc.)
  - ABAC with attribute checks (`department`, `region`, `tenantId`, `clearanceLevel`)
- Route-level access is handled in `src/routes/AppRoutes.tsx` via `isAuthorized`.
- Cross-feature policy evaluation is centralized in `src/services/authorization.ts`.

## Feature anatomy

The `inventory` feature is intentionally structured as the reference module:

```text
src/features/inventory/
├── api/
├── components/
├── hooks/
├── pages/
├── types/
├── utils/
└── index.ts
```

Only the public contract is exported from each feature barrel. For example, `src/features/inventory/index.ts` exposes the page component and public types while keeping internals private to the module.

## Accounting preview

The accounting workspace is a frontend-only, in-memory preview. Data, templates, settings, period locks and the session audit log disappear on reload or navigation away. Role checks and locks are UI safeguards only; authentication, authorization, immutable audit history, persistence and period enforcement require a backend. Do not use this preview for real accounting or statutory filing.

Entries must balance in a single currency; foreign exchange conversion is not supported. Reports based on journal activity can be exported as Excel-compatible CSV or printed to PDF. Reports requiring additional source data or fiscal mappings are identified as unavailable rather than presented as statutory reports.

## TypeScript guardrails

- `strict` mode is enabled
- `@/` path aliases are configured for both TypeScript and Vite
- Shared app wiring flows through `providers/` and `routes/`

## Available scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`
