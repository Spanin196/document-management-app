import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-10">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold text-gray-900">
          Document Manager
        </h1>
        <p className="mt-3 text-base leading-relaxed text-gray-500">
          A simple workspace to write, search, and organise your documents.
          Everything is saved locally in your browser — no account required.
        </p>
        <Link
          href="/docs"
          className="mt-8 inline-block rounded border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Go to workspace
        </Link>
      </div>
    </main>
  );
}
