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
          Everything lives in your browser — no account required.
        </p>
        <Link
          href="/docs"
          className="mt-10 inline-block rounded-2xl bg-brand px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-colors"
        >
          Go to workspace →
        </Link>
      </div>
    </main>
  );
}
