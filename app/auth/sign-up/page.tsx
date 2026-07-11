import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/docs");

  const { error, success } = await searchParams;

  async function signUp(formData: FormData) {
    "use server";
    const email = (formData.get("email") as string).trim();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      redirect(
        `/auth/sign-up?error=${encodeURIComponent("Passwords do not match")}`
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      redirect(`/auth/sign-up?error=${encodeURIComponent(error.message)}`);
    }

    if (data.session) {
      redirect("/docs");
    }

    redirect("/auth/sign-up?success=1");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/8 bg-surface p-8 shadow-sm dark:border-white/8">
        <h1 className="mb-6 font-display text-2xl text-ink">Create account</h1>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {decodeURIComponent(error)}
          </p>
        )}

        {success && (
          <p className="mb-4 rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand">
            Check your email to confirm your account, then sign in.
          </p>
        )}

        <form action={signUp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-ink-muted">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-xl border border-black/8 bg-black/3 px-3 py-2.5 text-sm text-ink outline-none placeholder-ink-muted focus:border-brand/40 focus:ring-2 focus:ring-brand/15 dark:border-white/8 dark:bg-white/5"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-ink-muted">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="rounded-xl border border-black/8 bg-black/3 px-3 py-2.5 text-sm text-ink outline-none placeholder-ink-muted focus:border-brand/40 focus:ring-2 focus:ring-brand/15 dark:border-white/8 dark:bg-white/5"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-medium text-ink-muted">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="rounded-xl border border-black/8 bg-black/3 px-3 py-2.5 text-sm text-ink outline-none placeholder-ink-muted focus:border-brand/40 focus:ring-2 focus:ring-brand/15 dark:border-white/8 dark:bg-white/5"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 active:bg-brand/80 transition-colors"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
