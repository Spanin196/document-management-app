"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Doc = {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
};

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function WorkspaceClient({ initialId }: { initialId?: string }) {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialId ?? null);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("docs");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setDocs(parsed as Doc[]);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("docs", JSON.stringify(docs));
  }, [docs, loaded]);

  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const activeDoc = docs.find((d) => d.id === activeId) ?? null;
  const sorted = [...docs].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  const filtered = sorted.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  function newDocument() {
    if (!loaded) return;
    const doc: Doc = { id: uid(), title: "", body: "", updatedAt: Date.now() };
    const next = [doc, ...docs];
    // Write synchronously so the new page finds the doc in localStorage
    try { localStorage.setItem("docs", JSON.stringify(next)); } catch {}
    setDocs(next);
    router.push(`/docs/${doc.id}`);
  }

  function deleteDocument(id: string) {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (id === activeId) {
      router.push("/docs");
    }
  }

  function update(field: "title" | "body", value: string) {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === activeId ? { ...d, [field]: value, updatedAt: Date.now() } : d
      )
    );
  }

  useEffect(() => {
    if (activeId) titleRef.current?.focus();
  }, [activeId]);

  function onTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      bodyRef.current?.focus();
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col gap-2 border-r border-gray-200 p-3 shrink-0">
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={newDocument}
          className="w-full rounded border border-gray-200 px-3 py-2 text-sm text-left hover:bg-gray-50"
        >
          + New document
        </button>
        <div className="overflow-y-auto" aria-live="polite">
          {loaded && docs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
              <p className="text-sm font-medium text-gray-700">No Documents Yet</p>
              <p className="text-xs text-gray-400">
                Create your first document to start organising your work in one place.
              </p>
              <button
                onClick={newDocument}
                className="mt-1 rounded border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50"
              >
                New Document
              </button>
            </div>
          ) : loaded && filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
              <p className="text-sm font-medium text-gray-700">No Documents Match Your Search</p>
              <p className="text-xs text-gray-400">
                No results for &ldquo;{search}&rdquo;. Try a different term.
              </p>
              <button
                onClick={() => setSearch("")}
                className="mt-1 rounded border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {filtered.map((doc) => (
                <li
                  key={doc.id}
                  className={`group flex items-center rounded ${
                    doc.id === activeId ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <Link
                    href={`/docs/${doc.id}`}
                    className="min-w-0 flex-1 truncate px-3 py-2 text-sm"
                  >
                    {doc.title || "Untitled"}
                  </Link>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="mr-1 hidden shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 group-hover:flex"
                    aria-label="Delete document"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Editor */}
      <main className="flex flex-1 flex-col overflow-hidden p-10">
        {activeDoc ? (
          <>
            <input
              ref={titleRef}
              type="text"
              placeholder="Title"
              value={activeDoc.title}
              onChange={(e) => update("title", e.target.value)}
              onKeyDown={onTitleKeyDown}
              className="border-b border-gray-200 pb-3 text-2xl font-semibold outline-none"
            />
            <textarea
              ref={bodyRef}
              placeholder="Start typing…"
              value={activeDoc.body}
              onChange={(e) => update("body", e.target.value)}
              className="mt-4 flex-1 resize-none text-base leading-relaxed outline-none"
            />
          </>
        ) : initialId && loaded ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-gray-400">
            <p>Document not found.</p>
            <Link
              href="/docs"
              className="text-gray-500 underline underline-offset-2"
            >
              Back to workspace
            </Link>
          </div>
        ) : loaded ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
            Click &quot;+ New document&quot; to get started.
          </div>
        ) : null}
      </main>
    </div>
  );
}
