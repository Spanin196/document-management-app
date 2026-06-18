"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [preview, setPreview] = useState(false);

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
    if (activeId) {
      titleRef.current?.focus();
      setPreview(false);
    }
  }, [activeId]);

  function onTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      bodyRef.current?.focus();
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      {/* Mobile header bar */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-gray-200 px-3 md:hidden">
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle sidebar"
          className="rounded p-1.5 hover:bg-gray-100"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect y="3" width="18" height="1.5" rx="0.75" fill="currentColor" />
            <rect y="8.25" width="18" height="1.5" rx="0.75" fill="currentColor" />
            <rect y="13.5" width="18" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
        </button>
        <span className="truncate text-sm font-medium text-gray-700">
          {activeDoc?.title || "Documents"}
        </span>
      </div>

      {/* Backdrop — mobile only, closes sidebar on tap */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar
          Mobile: fixed overlay from below the header, slides in from left.
          Desktop: static in the flex row, always visible. */}
      <aside
        className={`fixed top-12 bottom-0 left-0 z-30 flex w-60 shrink-0 flex-col gap-2 border-r border-gray-200 bg-white p-3 transition-transform duration-200 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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
                    onClick={() => setSidebarOpen(false)}
                    className="min-w-0 flex-1 truncate px-3 py-2 text-sm"
                  >
                    {doc.title || "Untitled"}
                  </Link>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="mr-1 flex shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 md:hidden md:group-hover:flex"
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
      <main className="flex flex-1 flex-col overflow-hidden p-6 md:p-10">
        {activeDoc ? (
          <>
            <div className="flex items-end justify-between border-b border-gray-200 pb-3">
              <input
                ref={titleRef}
                type="text"
                placeholder="Title"
                value={activeDoc.title}
                onChange={(e) => update("title", e.target.value)}
                onKeyDown={onTitleKeyDown}
                className="min-w-0 flex-1 text-2xl font-semibold outline-none"
              />
              <div className="ml-4 flex shrink-0 rounded border border-gray-200 text-xs">
                <button
                  onClick={() => setPreview(false)}
                  className={`px-3 py-1 ${!preview ? "bg-gray-100 font-medium" : "hover:bg-gray-50"}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setPreview(true)}
                  className={`border-l border-gray-200 px-3 py-1 ${preview ? "bg-gray-100 font-medium" : "hover:bg-gray-50"}`}
                >
                  Preview
                </button>
              </div>
            </div>
            {preview ? (
              <div className="mt-4 flex-1 overflow-y-auto text-base leading-relaxed">
                {activeDoc.body.trim() ? (
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="mt-6 mb-3 text-2xl font-bold">{children}</h1>,
                      h2: ({ children }) => <h2 className="mt-5 mb-2 text-xl font-semibold">{children}</h2>,
                      h3: ({ children }) => <h3 className="mt-4 mb-2 text-lg font-semibold">{children}</h3>,
                      p:  ({ children }) => <p className="mb-3">{children}</p>,
                      ul: ({ children }) => <ul className="mb-3 list-disc pl-5">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-3 list-decimal pl-5">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                    }}
                  >
                    {activeDoc.body}
                  </ReactMarkdown>
                ) : (
                  <p className="text-gray-400">Nothing to preview.</p>
                )}
              </div>
            ) : (
              <textarea
                ref={bodyRef}
                placeholder="Start typing…"
                value={activeDoc.body}
                onChange={(e) => update("body", e.target.value)}
                className="mt-4 flex-1 resize-none text-base leading-relaxed outline-none"
              />
            )}
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
