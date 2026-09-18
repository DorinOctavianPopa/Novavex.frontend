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

## TypeScript guardrails

- `strict` mode is enabled
- `@/` path aliases are configured for both TypeScript and Vite
- Shared app wiring flows through `providers/` and `routes/`

## Available scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`
