import { cn } from "@flowdev/shared";
import { credentialsEnabled } from "@/auth";
import {
  signInWithCredentialsAction,
  signInWithMicrosoftEntraAction,
} from "./actions";

interface SignInPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
}

const ERROR_COPY: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  Configuration: "Sign-in is not configured. Please contact your administrator.",
  AccessDenied: "Access denied. You do not have permission to sign in.",
  Verification: "The sign-in link has expired or already been used.",
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/portfolio";
  const errorCode = params.error;
  const errorMessage = errorCode
    ? (ERROR_COPY[errorCode] ?? "Sign-in failed. Please try again.")
    : null;

  return (
    <main
      className={cn(
        "flex min-h-screen flex-col items-center justify-center p-4",
        "bg-[var(--color-background)] text-[var(--color-foreground)]",
      )}
    >
      <div
        className={cn(
          "w-full max-w-sm space-y-6 rounded-lg border border-black/10 p-8 shadow-sm",
          "dark:border-white/10",
        )}
      >
        <header className="space-y-2 text-center">
          <h1
            className={cn(
              "text-2xl font-semibold tracking-tight",
              "text-[var(--color-brand-purple)]",
            )}
          >
            FlowDev
          </h1>
          <p className="text-sm opacity-70">Sign in to continue</p>
        </header>

        {errorMessage ? (
          <div
            role="alert"
            className={cn(
              "rounded-md border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700",
              "dark:text-red-400",
            )}
          >
            {errorMessage}
          </div>
        ) : null}

        <form action={signInWithMicrosoftEntraAction} className="space-y-2">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <button
            type="submit"
            className={cn(
              "w-full rounded-md bg-[var(--color-brand-purple)] px-4 py-2",
              "text-sm font-medium text-white transition hover:opacity-90",
            )}
          >
            Sign in with Microsoft
          </button>
        </form>

        {credentialsEnabled ? (
          <>
            <div className="flex items-center gap-3 text-xs opacity-60">
              <span className="h-px flex-1 bg-current" />
              <span>or</span>
              <span className="h-px flex-1 bg-current" />
            </div>

            <form action={signInWithCredentialsAction} className="space-y-3">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className={cn(
                    "block w-full rounded-md border border-black/15 bg-transparent px-3 py-2",
                    "text-sm focus:border-[var(--color-brand-purple)] focus:outline-none",
                    "dark:border-white/15",
                  )}
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Password</span>
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  className={cn(
                    "block w-full rounded-md border border-black/15 bg-transparent px-3 py-2",
                    "text-sm focus:border-[var(--color-brand-purple)] focus:outline-none",
                    "dark:border-white/15",
                  )}
                />
              </label>
              <button
                type="submit"
                className={cn(
                  "w-full rounded-md border border-black/15 bg-transparent px-4 py-2",
                  "text-sm font-medium transition hover:bg-black/5",
                  "dark:border-white/15 dark:hover:bg-white/5",
                )}
              >
                Sign in with credentials
              </button>
            </form>
          </>
        ) : null}
      </div>
    </main>
  );
}
