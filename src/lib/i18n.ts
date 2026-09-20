import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const supportedLanguages = ['en', 'ro'] as const

type SupportedLanguage = (typeof supportedLanguages)[number]

const languageStorageKey = 'novavex.language'

function normalizeLanguage(language: string | null | undefined): SupportedLanguage {
  if (!language) {
    return 'en'
  }

  return language.toLowerCase().startsWith('ro') ? 'ro' : 'en'
}

function getInitialLanguage() {
  if (typeof window === 'undefined') {
    return 'en'
  }

  return normalizeLanguage(window.localStorage.getItem(languageStorageKey) ?? window.navigator.language)
}

const resources = {
  en: {
    translation: {
      app: {
        name: 'Novavex ERP Frontend',
        summary: 'Feature-driven React architecture for flexible ERP modules and independent delivery.',
      },
      language: {
        label: 'Language',
        options: {
          en: 'English',
          ro: 'Romanian',
        },
      },
      auth: {
        accessDenied: 'Access denied',
        noPermission: 'You do not have permission to view this area.',
      },
      common: {
        minutes: 'min',
        permissionGranted: 'granted',
        permissionDenied: 'denied',
      },
      status: {
        ready: 'Ready',
        planned: 'Planned',
      },
      directory: {
        assets: 'Global static images, icons and other shared files.',
        components: 'Reusable UI building blocks shared across modules.',
        config: 'Application-wide configuration and architecture metadata.',
        context: 'Global React contexts such as auth or theme state.',
        features: 'Self-contained ERP domains that behave like mini apps.',
        hooks: 'Reusable hooks that keep view components light.',
        lib: 'Library integration points such as API clients or query setup.',
        providers: 'Top-level providers that compose global application state.',
        routes: 'Application routing entry points and route composition.',
        services: 'Cross-feature service functions when a module should not own them.',
        types: 'Global TypeScript contracts shared across features.',
        utils: 'Pure helper functions reused in multiple areas.',
      },
      modules: {
        dashboard: {
          name: 'Dashboard',
          description: 'Entry area that aggregates KPIs, notifications, and global ERP navigation.',
        },
        financial: {
          name: 'Financial',
          description: 'Accounting, invoices, and ledger flows isolated from other domains.',
        },
        inventory: {
          name: 'Inventory',
          description: 'Self-contained stock and warehouse workflows with their own API, hooks, and types.',
        },
        crm: {
          name: 'CRM',
          description: 'Customer records, pipeline stages, and commercial follow-up workflows.',
        },
      },
      dashboard: {
        hero: {
          eyebrow: 'Basic structure',
          tags: ['Feature-driven modules', 'Bulletproof React principles', 'Strict TypeScript + path aliases'],
        },
        security: {
          title: 'Enterprise security baseline',
          authProvider: 'Auth provider:',
          accessTokenTtl: 'Access token TTL:',
          refreshToken: 'Refresh token:',
          signedInAs: 'Signed in as',
          withRoles: 'with role(s)',
          authorizationModel: 'Authorization model:',
          inventoryWritePermission: 'Inventory write permission:',
          rbacAbac: '(RBAC + ABAC)',
        },
        layout: {
          title: 'Recommended src layout',
          description: 'Each directory now has a dedicated home in the codebase.',
        },
        featureModules: {
          title: 'ERP feature modules',
          description: 'Each domain is treated as a mini application with a small public contract exposed through its barrel export.',
        },
        inventory: {
          title: 'Inventory feature anatomy',
          description: 'The inventory module is the reference implementation for a self-contained feature.',
          previewEyebrow: 'api/ + hooks/ + utils/',
          previewTitle: 'Inventory feature preview',
          totalItems: 'Total items',
          lowStock: 'Low stock',
          warehouses: 'Warehouses',
          healthyStock: 'Healthy stock levels',
          replenishStock_one: '{{count}} item needs replenishment',
          replenishStock_other: '{{count}} items need replenishment',
        },
        rules: {
          title: 'Golden rules',
          items: [
            'Use @/ imports instead of fragile relative paths.',
            'Keep business logic inside hooks, APIs, and utilities instead of JSX.',
            'Export only the public API of each feature through its barrel file.',
            'Reserve shared state for providers and cross-feature concerns.',
          ],
        },
        snapshot: {
          title: 'Module snapshot',
          description: 'Representative ERP domains available for extension.',
        },
      },
    },
  },
  ro: {
    translation: {
      app: {
        name: 'Interfață ERP Novavex',
        summary: 'Arhitectură React orientată pe funcționalități pentru module ERP flexibile și livrare independentă.',
      },
      language: {
        label: 'Limbă',
        options: {
          en: 'Engleză',
          ro: 'Română',
        },
      },
      auth: {
        accessDenied: 'Acces refuzat',
        noPermission: 'Nu ai permisiunea să vizualizezi această zonă.',
      },
      common: {
        minutes: 'min',
        permissionGranted: 'permis',
        permissionDenied: 'refuzat',
      },
      status: {
        ready: 'Pregătit',
        planned: 'Planificat',
      },
      directory: {
        assets: 'Imagini statice globale, iconițe și alte fișiere partajate.',
        components: 'Blocuri UI reutilizabile partajate între module.',
        config: 'Configurație la nivel de aplicație și metadate de arhitectură.',
        context: 'Contexte React globale precum autentificare sau temă.',
        features: 'Domenii ERP autonome care funcționează ca mini aplicații.',
        hooks: 'Hook-uri reutilizabile care păstrează componentele de afișare simple.',
        lib: 'Puncte de integrare pentru librării, precum clienți API sau configurări de query.',
        providers: 'Providere de nivel superior care compun starea globală a aplicației.',
        routes: 'Puncte de intrare pentru rutare și compunerea rutelor aplicației.',
        services: 'Funcții de servicii cross-feature atunci când un modul nu trebuie să le dețină.',
        types: 'Contracte TypeScript globale partajate între funcționalități.',
        utils: 'Funcții helper pure reutilizate în mai multe zone.',
      },
      modules: {
        dashboard: {
          name: 'Tablou de bord',
          description: 'Zonă de intrare care agregă KPI-uri, notificări și navigația globală ERP.',
        },
        financial: {
          name: 'Financiar',
          description: 'Fluxuri de contabilitate, facturi și registru izolate de celelalte domenii.',
        },
        inventory: {
          name: 'Inventar',
          description: 'Fluxuri autonome de stoc și depozit cu API-uri, hook-uri și tipuri proprii.',
        },
        crm: {
          name: 'CRM',
          description: 'Evidențe clienți, etape de pipeline și fluxuri comerciale de follow-up.',
        },
      },
      dashboard: {
        hero: {
          eyebrow: 'Structură de bază',
          tags: ['Module orientate pe funcționalități', 'Principii Bulletproof React', 'TypeScript strict + aliasuri de căi'],
        },
        security: {
          title: 'Bază de securitate enterprise',
          authProvider: 'Provider de autentificare:',
          accessTokenTtl: 'TTL token acces:',
          refreshToken: 'Token de refresh:',
          signedInAs: 'Autentificat ca',
          withRoles: 'cu rol(uri)',
          authorizationModel: 'Model de autorizare:',
          inventoryWritePermission: 'Permisiune de scriere inventar:',
          rbacAbac: '(RBAC + ABAC)',
        },
        layout: {
          title: 'Structură src recomandată',
          description: 'Fiecare director are acum un loc dedicat în codul sursă.',
        },
        featureModules: {
          title: 'Module ERP',
          description: 'Fiecare domeniu este tratat ca o mini aplicație cu un contract public redus expus prin barrel export.',
        },
        inventory: {
          title: 'Anatomia funcționalității de inventar',
          description: 'Modulul de inventar este implementarea de referință pentru o funcționalitate autonomă.',
          previewEyebrow: 'api/ + hooks/ + utils/',
          previewTitle: 'Previzualizare funcționalitate inventar',
          totalItems: 'Articole totale',
          lowStock: 'Stoc redus',
          warehouses: 'Depozite',
          healthyStock: 'Niveluri de stoc sănătoase',
          replenishStock_one: '{{count}} articol necesită reaprovizionare',
          replenishStock_few: '{{count}} articole necesită reaprovizionare',
          replenishStock_other: '{{count}} de articole necesită reaprovizionare',
        },
        rules: {
          title: 'Reguli de bază',
          items: [
            'Folosește importuri @/ în locul căilor relative fragile.',
            'Păstrează logica de business în hook-uri, API-uri și utilitare, nu în JSX.',
            'Exportă doar API-ul public al fiecărei funcționalități prin barrel file.',
            'Rezervă starea partajată pentru providere și preocupări cross-feature.',
          ],
        },
        snapshot: {
          title: 'Instantaneu module',
          description: 'Domenii ERP reprezentative disponibile pentru extindere.',
        },
      },
    },
  },
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  supportedLngs: supportedLanguages,
  compatibilityJSON: 'v4',
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (language) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(languageStorageKey, normalizeLanguage(language))
  }
})

export default i18n
