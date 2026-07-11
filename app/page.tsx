import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16 bg-canvas">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-5xl text-ink">
          Document Manager
        </h1>
        <p className="mt-5 text-base leading-relaxed text-ink-muted">
          A calm place to write, search, and organise your documents.
          Sign in to access your private, cloud-synced workspace.
        </p>
        <p className="mt-10 font-display text-4xl italic leading-snug text-lavender">
          Just Be Here Now
        </p>
        <Link
          href="/docs"
          className="mt-6 inline-block rounded-2xl bg-brand px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-colors"
        >
          Go to workspace →
        </Link>
      </div>
    </main>
  );
}
