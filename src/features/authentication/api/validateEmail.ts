export type EmailAvailability =
  | "available"
  | "already-registered"
  | "invalid-format"
  | "unknown";

export interface EmailValidationResult {
  readonly availability: EmailAvailability;
}

interface ValidateEmailResponseBody {
  readonly valid: boolean;
  readonly reason?: "invalid-format" | "already-exists";
}

// Backend proxy required: Brevo's API key must stay server-side, never shipped in the browser bundle.
const validationEndpoint =
  import.meta.env.VITE_EMAIL_VALIDATION_ENDPOINT ?? "/api/validate-email";

export async function checkEmailAvailability(
  email: string,
): Promise<EmailValidationResult> {
  try {
    const response = await fetch(validationEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      return { availability: "unknown" };
    }

    const body = (await response.json()) as ValidateEmailResponseBody;

    if (body.valid) {
      return { availability: "available" };
    }

    return {
      availability:
        body.reason === "already-exists"
          ? "already-registered"
          : "invalid-format",
    };
  } catch {
    return { availability: "unknown" };
  }
}
