import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const supportedLanguages = ["en", "ro"] as const;

type SupportedLanguage = (typeof supportedLanguages)[number];

const languageStorageKey = "novavex.language";

function normalizeLanguage(
  language: string | null | undefined,
): SupportedLanguage {
  if (!language) {
    return "en";
  }

  return language.toLowerCase().startsWith("ro") ? "ro" : "en";
}

function getInitialLanguage() {
  if (typeof window === "undefined") {
    return "en";
  }

  return normalizeLanguage(
    window.localStorage.getItem(languageStorageKey) ??
      window.navigator.language,
  );
}

const resources = {
  en: {
    translation: {
      app: {
        name: "Novavex ERP",
        summary:
          "The evolution of financial intelligence: Automated counting, advanced ERP, and cognitive AI.",
      },
      language: {
        label: "Language",
        options: {
          en: "English",
          ro: "Romanian",
        },
      },
      auth: {
        accessDenied: "Access denied",
        noPermission: "You do not have permission to view this area.",
        signIn: {
          eyebrow: "Enterprise sign in",
          title: "Welcome back",
          subtitle:
            "{{summary}} Secure access for your workspace, operations, and ERP modules.",
          description:
            "Use your work email to continue to the operations dashboard.",
          fields: {
            email: "Work email",
            password: "Password",
          },
          placeholders: {
            email: "name@company.com",
            password: "Enter your password",
          },
          actions: {
            rememberMe: "Remember me",
            forgotPassword: "Forgot password?",
            createAccount: "Create account",
            showPassword: "Show",
            hidePassword: "Hide",
            signIn: "Sign in",
            signingIn: "Signing in…",
          },
          signUpPrompt: "Need access for a new team member?",
          footer: {
            support: "Support",
            privacy: "Privacy",
            terms: "Terms",
          },
          highlights: {
            security:
              "Protected by short-lived access tokens and secure refresh cookies.",
            access:
              "Role and attribute-based access keeps sensitive ERP modules restricted.",
            support:
              "Need help signing in? Support resources stay one click away.",
          },
          validation: {
            emailRequired:
              "Enter the email address associated with your workspace.",
            emailInvalid: "Enter a valid work email address.",
            passwordRequired: "Enter your password to continue.",
            passwordLength: "Use at least 8 characters for your password.",
          },
          errors: {
            invalidCredentials:
              "The provided credentials are not valid for this preview environment.",
            generic: "We could not sign you in right now. Please try again.",
          },
          mfa: {
            eyebrow: "Two-factor verification",
            title: "Check your email",
            description:
              "We sent a 6-digit verification code to {{email}}. Enter it below to finish signing in.",
            fields: {
              code: "Verification code",
            },
            placeholders: {
              code: "123456",
            },
            actions: {
              verify: "Verify and sign in",
              verifying: "Verifying…",
              resend: "Resend code",
              resending: "Sending new code…",
              useDifferentAccount: "Use a different account",
            },
            validation: {
              codeRequired: "Enter the 6-digit code sent to your email.",
              codeInvalidFormat:
                "Enter all 6 digits of the verification code.",
            },
            errors: {
              invalidCode: "That code is incorrect. Please try again.",
              expiredCode:
                "This code has expired. Request a new one and try again.",
              generic:
                "We could not verify your code right now. Please try again.",
            },
            resendSuccess: "We sent you a new verification code.",
          },
        },
        signUp: {
          eyebrow: "Create your workspace account",
          title: "Create an account",
          subtitle: "{{summary}} Set up your workspace access in a few steps.",
          description:
            "Enter your work email and we'll send you a verification code to continue.",
          fields: {
            fullName: "Full name",
            email: "Work email",
            password: "Password",
            confirmPassword: "Confirm password",
          },
          placeholders: {
            fullName: "Jane Doe",
            email: "name@company.com",
            password: "Create a password",
            confirmPassword: "Re-enter your password",
          },
          actions: {
            continue: "Continue",
            sendingCode: "Sending code…",
            signIn: "Sign in",
            goToSignIn: "Go to sign in",
          },
          signInPrompt: "Already have an account?",
          highlights: {
            onboarding:
              "Guided onboarding gets your workspace ready in minutes.",
            security:
              "Protected by short-lived access tokens and secure refresh cookies.",
            support:
              "Need help signing up? Support resources stay one click away.",
          },
          validation: {
            fullNameRequired: "Enter your full name.",
            emailRequired:
              "Enter the email address associated with your workspace.",
            emailInvalid: "Enter a valid work email address.",
            emailAlreadyRegistered:
              "An account with this email already exists.",
            passwordRequired: "Enter a password to continue.",
            passwordLength: "Use at least 8 characters for your password.",
            confirmPasswordRequired: "Confirm your password to continue.",
            confirmPasswordMismatch: "Passwords do not match.",
          },
          errors: {
            emailInUse: "An account with this email already exists.",
            generic:
              "We could not send a verification code right now. Please try again.",
          },
          emailCheck: {
            checking: "Checking email availability\u2026",
            unavailable:
              "We couldn't verify this email right now. You can still continue.",
          },
          mfa: {
            title: "Verify your email",
            description:
              "We sent a 6-digit verification code to {{email}}. Enter it below along with your name and a password to finish creating your account.",
            fields: {
              code: "Verification code",
            },
            placeholders: {
              code: "123456",
            },
            actions: {
              verify: "Verify and create account",
              verifying: "Verifying…",
              resend: "Resend code",
              resending: "Sending new code…",
              useDifferentEmail: "Use a different email",
            },
            validation: {
              codeRequired: "Enter the 6-digit code sent to your email.",
              codeInvalidFormat:
                "Enter all 6 digits of the verification code.",
            },
            errors: {
              invalidCode: "That code is incorrect. Please try again.",
              expiredCode:
                "This code has expired. Request a new one and try again.",
              generic:
                "We could not verify your code right now. Please try again.",
            },
            resendSuccess: "We sent you a new verification code.",
          },
          success: {
            title: "Account created",
            description: "Your account has been created. You can now sign in.",
          },
        },
      },
      common: {
        minutes: "min",
        permissionGranted: "granted",
        permissionDenied: "denied",
      },
      status: {
        ready: "Ready",
        planned: "Planned",
      },
      featureCard: {
        runModule: "Run module",
      },
      inventoryPage: {
        eyebrow: "src/features/inventory",
        title: "Inventory module",
        description:
          "Live preview of the self-contained inventory feature running on its own route.",
        backToDashboard: "Back to dashboard",
      },
      accountingPage: {
        eyebrow: "src/features/financial",
        title: "Accounting module",
        description:
          "Accounting workflows for invoices and ledger operations will be available here.",
        backToDashboard: "Back to dashboard",
      },
      privacyPage: {
        eyebrow: "src/features/authentication",
        title: "Privacy policy",
        description:
          "How Novavex collects, uses, and protects your data across the ERP workspace.",
        back: "Back",
        sections: {
          dataCollection: {
            title: "Data we collect",
            body: "We collect only the account and workspace information needed to operate your ERP modules, such as your name, work email, and role assignments.",
          },
          dataUsage: {
            title: "How we use your data",
            body: "Your data is used to authenticate access, enforce role and attribute-based permissions, and provide the features you request inside the workspace.",
          },
          dataProtection: {
            title: "How we protect your data",
            body: "Access tokens are short-lived and refresh tokens are stored in httpOnly cookies. Data in transit is encrypted and access is restricted by RBAC and ABAC policies.",
          },
          contact: {
            title: "Contact us",
            body: "If you have questions about this policy, reach out through the support resources available from the sign-in page.",
          },
        },
      },
      supportPage: {
        eyebrow: "src/features/authentication",
        title: "Support",
        description:
          "Find answers and get help with your Novavex ERP workspace.",
        back: "Back",
        sections: {
          gettingStarted: {
            title: "Getting started",
            body: "Sign in with your work email and password. If you don't have an account yet, use the \"Create account\" link on the sign-in page to request access.",
          },
          accountAccess: {
            title: "Account & access",
            body: "Access to ERP modules is controlled by role and attribute-based permissions. If a module looks unavailable, contact your workspace administrator to review your roles.",
          },
          troubleshooting: {
            title: "Troubleshooting",
            body: "If sign-in fails, double-check your email and password, and make sure Caps Lock is off. Sessions use short-lived access tokens, so you may need to sign in again after a period of inactivity.",
          },
          contactSupport: {
            title: "Contact support",
            body: "Still need help? Reach out to your workspace administrator or the Novavex support team for further assistance.",
          },
        },
      },
      directory: {
        assets: "Global static images, icons and other shared files.",
        components: "Reusable UI building blocks shared across modules.",
        config: "Application-wide configuration and architecture metadata.",
        context: "Global React contexts such as auth or theme state.",
        features: "Self-contained ERP domains that behave like mini apps.",
        hooks: "Reusable hooks that keep view components light.",
        lib: "Library integration points such as API clients or query setup.",
        providers: "Top-level providers that compose global application state.",
        routes: "Application routing entry points and route composition.",
        services:
          "Cross-feature service functions when a module should not own them.",
        types: "Global TypeScript contracts shared across features.",
        utils: "Pure helper functions reused in multiple areas.",
      },
      modules: {
        dashboard: {
          name: "Dashboard",
          description:
            "Entry area that aggregates KPIs, notifications, and global ERP navigation.",
        },
        financial: {
          name: "Accounting",
          description:
            "Accounting, invoices, and ledger flows isolated from other domains.",
        },
        inventory: {
          name: "Inventory",
          description:
            "Self-contained stock and warehouse workflows with their own API, hooks, and types.",
        },
        crm: {
          name: "CRM",
          description:
            "Customer records, pipeline stages, and commercial follow-up workflows.",
        },
      },
      dashboard: {
        hero: {
          eyebrow: "Basic structure",
          tags: [
            "Feature-driven modules",
            "Bulletproof React principles",
            "Strict TypeScript + path aliases",
          ],
        },
        security: {
          title: "Enterprise security baseline",
          authProvider: "Auth provider:",
          accessTokenTtl: "Access token TTL:",
          refreshToken: "Refresh token:",
          signedInAs: "Signed in as",
          withRoles: "with role(s)",
          authorizationModel: "Authorization model:",
          inventoryWritePermission: "Inventory write permission:",
          rbacAbac: "(RBAC + ABAC)",
        },
        layout: {
          title: "Recommended src layout",
          description:
            "Each directory now has a dedicated home in the codebase.",
        },
        featureModules: {
          title: "ERP feature modules",
          description:
            "Each domain is treated as a mini application with a small public contract exposed through its barrel export.",
        },
        grid: {
          title: "Feature modules (Grid component)",
          description:
            "Same module data rendered through the reusable Grid component, driven by a column description array.",
          columns: {
            module: "Module",
            alias: "Alias",
            path: "Path",
            status: "Status",
            route: "Route",
          },
          noRoute: "—",
          actions: {
            header: "Actions",
            add: "Add",
            edit: "Edit",
            delete: "Delete",
            save: "Save",
            cancelForm: "Cancel",
            fieldName: "Module name",
            fieldDescription: "Module description",
            newModuleName: "New module",
            confirmDelete: 'Delete the "{{name}}" module?',
          },
        },
        inventory: {
          title: "Inventory feature anatomy",
          description:
            "The inventory module is the reference implementation for a self-contained feature.",
          previewEyebrow: "api/ + hooks/ + utils/",
          previewTitle: "Inventory feature preview",
          totalItems: "Total items",
          lowStock: "Low stock",
          warehouses: "Warehouses",
          healthyStock: "Healthy stock levels",
          replenishStock_one: "{{count}} item needs replenishment",
          replenishStock_other: "{{count}} items need replenishment",
        },
        rules: {
          title: "Golden rules",
          items: [
            "Use @/ imports instead of fragile relative paths.",
            "Keep business logic inside hooks, APIs, and utilities instead of JSX.",
            "Export only the public API of each feature through its barrel file.",
            "Reserve shared state for providers and cross-feature concerns.",
          ],
        },
        snapshot: {
          title: "Module snapshot",
          description: "Representative ERP domains available for extension.",
        },
      },
    },
  },
  ro: {
    translation: {
      app: {
        name: "ERP Novavex",
        summary:
          "Evoluția inteligenței financiare: Calcul automatizat, ERP avansat și AI cognitiv.",
      },
      language: {
        label: "Limbă",
        options: {
          en: "Engleză",
          ro: "Română",
        },
      },
      auth: {
        accessDenied: "Acces refuzat",
        noPermission: "Nu ai permisiunea să vizualizezi această zonă.",
        signIn: {
          eyebrow: "Autentificare enterprise",
          title: "Bine ai revenit",
          subtitle: "{{summary}}",
          description:
            "Folosește emailul de serviciu pentru a continua către dashboard-ul operațional.",
          fields: {
            email: "Email de serviciu",
            password: "Parolă",
          },
          placeholders: {
            email: "nume@companie.com",
            password: "Introdu parola",
          },
          actions: {
            rememberMe: "Ține-mă minte",
            forgotPassword: "Ai uitat parola?",
            createAccount: "Creează cont",
            showPassword: "Arată",
            hidePassword: "Ascunde",
            signIn: "Autentificare",
            signingIn: "Se autentifică…",
          },
          signUpPrompt: "Ai nevoie de acces pentru un coleg nou?",
          footer: {
            support: "Suport",
            privacy: "Confidențialitate",
            terms: "Termeni",
          },
          highlights: {
            security:
              "Protejat prin tokenuri de acces cu durată scurtă și cookie-uri securizate de refresh.",
            access:
              "Accesul bazat pe roluri și atribute limitează modulele ERP sensibile.",
            support:
              "Ai nevoie de ajutor la autentificare? Resursele de suport sunt la un click distanță.",
          },
          validation: {
            emailRequired:
              "Introdu adresa de email asociată workspace-ului tău.",
            emailInvalid: "Introdu o adresă de email de serviciu validă.",
            passwordRequired: "Introdu parola pentru a continua.",
            passwordLength: "Folosește cel puțin 8 caractere pentru parolă.",
          },
          errors: {
            invalidCredentials:
              "Credențialele introduse nu sunt valide pentru acest mediu preview.",
            generic: "Autentificarea nu a reușit momentan. Încearcă din nou.",
          },
          mfa: {
            eyebrow: "Verificare în doi pași",
            title: "Verifică-ți emailul",
            description:
              "Am trimis un cod de verificare din 6 cifre la {{email}}. Introdu-l mai jos pentru a finaliza autentificarea.",
            fields: {
              code: "Cod de verificare",
            },
            placeholders: {
              code: "123456",
            },
            actions: {
              verify: "Verifică și autentifică-te",
              verifying: "Se verifică…",
              resend: "Retrimite codul",
              resending: "Se trimite un cod nou…",
              useDifferentAccount: "Folosește alt cont",
            },
            validation: {
              codeRequired: "Introdu codul din 6 cifre trimis pe email.",
              codeInvalidFormat:
                "Introdu toate cele 6 cifre ale codului de verificare.",
            },
            errors: {
              invalidCode: "Codul introdus este incorect. Încearcă din nou.",
              expiredCode:
                "Codul a expirat. Solicită unul nou și încearcă din nou.",
              generic:
                "Codul nu a putut fi verificat momentan. Încearcă din nou.",
            },
            resendSuccess: "Ți-am trimis un cod de verificare nou.",
          },
        },
        signUp: {
          eyebrow: "Creează contul pentru workspace-ul tău",
          title: "Creează un cont",
          subtitle:
            "{{summary}} Configurează accesul la workspace în câțiva pași.",
          description:
            "Introdu emailul tău de serviciu și îți vom trimite un cod de verificare pentru a continua.",
          fields: {
            fullName: "Nume complet",
            email: "Email de serviciu",
            password: "Parolă",
            confirmPassword: "Confirmă parola",
          },
          placeholders: {
            fullName: "Ion Popescu",
            email: "nume@companie.com",
            password: "Creează o parolă",
            confirmPassword: "Reintrodu parola",
          },
          actions: {
            continue: "Continuă",
            sendingCode: "Se trimite codul…",
            signIn: "Autentificare",
            goToSignIn: "Mergi la autentificare",
          },
          signInPrompt: "Ai deja un cont?",
          highlights: {
            onboarding:
              "Onboarding-ul ghidat pregătește workspace-ul tău în câteva minute.",
            security:
              "Protejat prin tokenuri de acces cu durată scurtă și cookie-uri securizate de refresh.",
            support:
              "Ai nevoie de ajutor la înregistrare? Resursele de suport sunt la un click distanță.",
          },
          validation: {
            fullNameRequired: "Introdu numele tău complet.",
            emailRequired:
              "Introdu adresa de email asociată workspace-ului tău.",
            emailInvalid: "Introdu o adresă de email de serviciu validă.",
            emailAlreadyRegistered: "Există deja un cont cu acest email.",
            passwordRequired: "Introdu o parolă pentru a continua.",
            passwordLength: "Folosește cel puțin 8 caractere pentru parolă.",
            confirmPasswordRequired: "Confirmă parola pentru a continua.",
            confirmPasswordMismatch: "Parolele nu coincid.",
          },
          errors: {
            emailInUse: "Există deja un cont cu acest email.",
            generic:
              "Codul de verificare nu a putut fi trimis momentan. Încearcă din nou.",
          },
          emailCheck: {
            checking: "Se verifică disponibilitatea emailului\u2026",
            unavailable:
              "Nu am putut verifica acest email momentan. Poți continua totuși.",
          },
          mfa: {
            title: "Verifică-ți emailul",
            description:
              "Am trimis un cod de verificare din 6 cifre la {{email}}. Introdu-l mai jos, împreună cu numele tău și o parolă, pentru a finaliza crearea contului.",
            fields: {
              code: "Cod de verificare",
            },
            placeholders: {
              code: "123456",
            },
            actions: {
              verify: "Verifică și creează contul",
              verifying: "Se verifică…",
              resend: "Retrimite codul",
              resending: "Se trimite un cod nou…",
              useDifferentEmail: "Folosește alt email",
            },
            validation: {
              codeRequired: "Introdu codul din 6 cifre trimis pe email.",
              codeInvalidFormat:
                "Introdu toate cele 6 cifre ale codului de verificare.",
            },
            errors: {
              invalidCode: "Codul introdus este incorect. Încearcă din nou.",
              expiredCode:
                "Codul a expirat. Solicită unul nou și încearcă din nou.",
              generic:
                "Codul nu a putut fi verificat momentan. Încearcă din nou.",
            },
            resendSuccess: "Ți-am trimis un cod de verificare nou.",
          },
          success: {
            title: "Cont creat",
            description: "Contul tău a fost creat. Te poți autentifica acum.",
          },
        },
      },
      common: {
        minutes: "min",
        permissionGranted: "permis",
        permissionDenied: "refuzat",
      },
      status: {
        ready: "Pregătit",
        planned: "Planificat",
      },
      featureCard: {
        runModule: "Rulează modulul",
      },
      inventoryPage: {
        eyebrow: "src/features/inventory",
        title: "Modul de inventar",
        description:
          "Previzualizare live a funcționalității de inventar, care rulează pe propria rută.",
        backToDashboard: "Înapoi la tablou de bord",
      },
      accountingPage: {
        eyebrow: "src/features/financial",
        title: "Modul de contabilitate",
        description:
          "Fluxurile contabile pentru facturi și operațiuni de registru vor fi disponibile aici.",
        backToDashboard: "Înapoi la tabloul de bord",
      },
      privacyPage: {
        eyebrow: "src/features/authentication",
        title: "Politica de confidențialitate",
        description:
          "Cum colectează, utilizează și protejează Novavex datele tale în spațiul de lucru ERP.",
        back: "Înapoi",
        sections: {
          dataCollection: {
            title: "Datele pe care le colectăm",
            body: "Colectăm doar informațiile despre cont și spațiul de lucru necesare pentru a opera modulele ERP, precum numele, e-mailul de serviciu și rolurile atribuite.",
          },
          dataUsage: {
            title: "Cum utilizăm datele tale",
            body: "Datele tale sunt folosite pentru autentificarea accesului, aplicarea permisiunilor bazate pe roluri și atribute și furnizarea funcționalităților solicitate în spațiul de lucru.",
          },
          dataProtection: {
            title: "Cum protejăm datele tale",
            body: "Token-urile de acces sunt de scurtă durată, iar token-urile de reîmprospătare sunt stocate în cookie-uri httpOnly. Datele în tranzit sunt criptate, iar accesul este restricționat prin politici RBAC și ABAC.",
          },
          contact: {
            title: "Contactează-ne",
            body: "Dacă ai întrebări despre această politică, contactează-ne prin resursele de suport disponibile din pagina de autentificare.",
          },
        },
      },
      supportPage: {
        eyebrow: "src/features/authentication",
        title: "Asistență",
        description:
          "Găsește răspunsuri și primește ajutor pentru spațiul tău de lucru Novavex ERP.",
        back: "Înapoi",
        sections: {
          gettingStarted: {
            title: "Primii pași",
            body: "Autentifică-te cu e-mailul de serviciu și parola. Dacă nu ai încă un cont, folosește linkul „Creează cont” din pagina de autentificare pentru a solicita acces.",
          },
          accountAccess: {
            title: "Cont și acces",
            body: "Accesul la modulele ERP este controlat prin permisiuni bazate pe roluri și atribute. Dacă un modul pare indisponibil, contactează administratorul spațiului de lucru pentru a-ți verifica rolurile.",
          },
          troubleshooting: {
            title: "Depanare",
            body: "Dacă autentificarea eșuează, verifică e-mailul și parola și asigură-te că tasta Caps Lock este dezactivată. Sesiunile folosesc token-uri de acces de scurtă durată, așa că s-ar putea să fie nevoie să te autentifici din nou după o perioadă de inactivitate.",
          },
          contactSupport: {
            title: "Contactează asistența",
            body: "Mai ai nevoie de ajutor? Contactează administratorul spațiului de lucru sau echipa de asistență Novavex pentru sprijin suplimentar.",
          },
        },
      },
      directory: {
        assets: "Imagini statice globale, iconițe și alte fișiere partajate.",
        components: "Blocuri UI reutilizabile partajate între module.",
        config:
          "Configurație la nivel de aplicație și metadate de arhitectură.",
        context: "Contexte React globale precum autentificare sau temă.",
        features: "Domenii ERP autonome care funcționează ca mini aplicații.",
        hooks:
          "Hook-uri reutilizabile care păstrează componentele de afișare simple.",
        lib: "Puncte de integrare pentru librării, precum clienți API sau configurări de query.",
        providers:
          "Providere de nivel superior care compun starea globală a aplicației.",
        routes:
          "Puncte de intrare pentru rutare și compunerea rutelor aplicației.",
        services:
          "Funcții de servicii cross-feature atunci când un modul nu trebuie să le dețină.",
        types: "Contracte TypeScript globale partajate între funcționalități.",
        utils: "Funcții helper pure reutilizate în mai multe zone.",
      },
      modules: {
        dashboard: {
          name: "Tablou de bord",
          description:
            "Zonă de intrare care agregă KPI-uri, notificări și navigația globală ERP.",
        },
        financial: {
          name: "Contabilitate",
          description:
            "Fluxuri de contabilitate, facturi și registru izolate de celelalte domenii.",
        },
        inventory: {
          name: "Inventar",
          description:
            "Fluxuri autonome de stoc și depozit cu API-uri, hook-uri și tipuri proprii.",
        },
        crm: {
          name: "CRM",
          description:
            "Evidențe clienți, etape de pipeline și fluxuri comerciale de follow-up.",
        },
      },
      dashboard: {
        hero: {
          eyebrow: "Structură de bază",
          tags: [
            "Module orientate pe funcționalități",
            "Principii Bulletproof React",
            "TypeScript strict + aliasuri de căi",
          ],
        },
        security: {
          title: "Bază de securitate enterprise",
          authProvider: "Provider de autentificare:",
          accessTokenTtl: "TTL token acces:",
          refreshToken: "Token de refresh:",
          signedInAs: "Autentificat ca",
          withRoles: "cu rol(uri)",
          authorizationModel: "Model de autorizare:",
          inventoryWritePermission: "Permisiune de scriere inventar:",
          rbacAbac: "(RBAC + ABAC)",
        },
        layout: {
          title: "Structură src recomandată",
          description:
            "Fiecare director are acum un loc dedicat în codul sursă.",
        },
        featureModules: {
          title: "Module ERP",
          description:
            "Fiecare domeniu este tratat ca o mini aplicație cu un contract public redus expus prin barrel export.",
        },
        grid: {
          title: "Module (componenta Grid)",
          description:
            "Aceleași date despre module afișate prin componenta reutilizabilă Grid, pe baza unui tablou de descriere a coloanelor.",
          columns: {
            module: "Modul",
            alias: "Alias",
            path: "Cale",
            status: "Stare",
            route: "Rută",
          },
          noRoute: "—",
          actions: {
            header: "Acțiuni",
            add: "Adaugă",
            edit: "Editează",
            delete: "Șterge",
            save: "Salvează",
            cancelForm: "Anulează",
            fieldName: "Nume modul",
            fieldDescription: "Descriere modul",
            newModuleName: "Modul nou",
            confirmDelete: 'Ștergi modulul "{{name}}"?',
          },
        },
        inventory: {
          title: "Anatomia funcționalității de inventar",
          description:
            "Modulul de inventar este implementarea de referință pentru o funcționalitate autonomă.",
          previewEyebrow: "api/ + hooks/ + utils/",
          previewTitle: "Previzualizare funcționalitate inventar",
          totalItems: "Articole totale",
          lowStock: "Stoc redus",
          warehouses: "Depozite",
          healthyStock: "Niveluri de stoc sănătoase",
          replenishStock_one: "{{count}} articol necesită reaprovizionare",
          replenishStock_few: "{{count}} articole necesită reaprovizionare",
          replenishStock_other:
            "{{count}} de articole necesită reaprovizionare",
        },
        rules: {
          title: "Reguli de bază",
          items: [
            "Folosește importuri @/ în locul căilor relative fragile.",
            "Păstrează logica de business în hook-uri, API-uri și utilitare, nu în JSX.",
            "Exportă doar API-ul public al fiecărei funcționalități prin barrel file.",
            "Rezervă starea partajată pentru providere și preocupări cross-feature.",
          ],
        },
        snapshot: {
          title: "Instantaneu module",
          description:
            "Domenii ERP reprezentative disponibile pentru extindere.",
        },
      },
    },
  },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: "en",
  supportedLngs: supportedLanguages,
  compatibilityJSON: "v4",
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (language) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      languageStorageKey,
      normalizeLanguage(language),
    );
  }
});

export default i18n;
