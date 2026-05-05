"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

// Server Action wrapper for credentials sign-in. Auth.js v5's signIn() handles
// CSRF + redirect automatically when called from a Server Action; on credential
// failure it throws AuthError which we translate into a redirect back to
// /sign-in?error=... so the page can render inline error copy.
export async function signInWithCredentialsAction(
  formData: FormData,
): Promise<void> {
  const callbackUrl =
    typeof formData.get("callbackUrl") === "string"
      ? (formData.get("callbackUrl") as string)
      : "/portfolio";

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: callbackUrl,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      const errorCode = err.type === "CredentialsSignin"
        ? "CredentialsSignin"
        : "AccessDenied";
      redirect(
        `/sign-in?error=${encodeURIComponent(errorCode)}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
      );
    }
    // Re-throw non-auth errors. NEXT_REDIRECT is intentionally re-thrown
    // (Next.js's redirect() throws internally to short-circuit).
    throw err;
  }
}

export async function signInWithMicrosoftEntraAction(
  formData: FormData,
): Promise<void> {
  const callbackUrl =
    typeof formData.get("callbackUrl") === "string"
      ? (formData.get("callbackUrl") as string)
      : "/portfolio";
  await signIn("microsoft-entra-id", { redirectTo: callbackUrl });
}
