import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16 bg-canvas">
      <div className="max-w-sm text-center">
        <p className="font-mono text-sm text-ink-muted tracking-widest uppercase">404</p>
        <h1 className="mt-3 font-display text-5xl text-ink">Page not found</h1>
        <p className="mt-5 text-base leading-relaxed text-ink-muted">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/docs"
            className="inline-block rounded-2xl bg-brand px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-colors"
          >
            Go to workspace →
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-ink-muted hover:text-ink transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
