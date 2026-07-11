"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/utils/supabase/client";

type Note = {
  id: string;
  title: string;
  body: string;
  updated_at: string;
};

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export default function WorkspaceClient({ initialId }: { initialId?: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [dark, setDark] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const saveTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const activeId = initialId ?? null;

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("notes")
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) { setLoadError(true); }
        else if (data) setNotes(data as Note[]);
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    return () => {
      Object.values(saveTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const activeNote = notes.find((n) => n.id === activeId) ?? null;
  const sorted = [...notes].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const filtered = sorted.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  async function newDocument() {
    const supabase = createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    if (!claimsData?.claims) return;
    const claims = claimsData.claims;
    const { data, error } = await supabase
      .from("notes")
      .insert({ title: "", body: "", user_id: claims.sub })
      .select()
      .single();
    if (error || !data) return;
    setNotes((prev) => [data as Note, ...prev]);
    router.push(`/docs/${data.id}`);
  }

  async function deleteDocument(id: string) {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNote?.id === id) router.push("/docs");
  }

  function update(field: "title" | "body", value: string) {
    const targetId = activeNote?.id;
    if (!targetId) return;
    const now = new Date().toISOString();
    setNotes((prev) =>
      prev.map((n) =>
        n.id === targetId ? { ...n, [field]: value, updated_at: now } : n
      )
    );
    if (saveTimeouts.current[field]) clearTimeout(saveTimeouts.current[field]);
    saveTimeouts.current[field] = setTimeout(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("notes")
        .update({ [field]: value, updated_at: now })
        .eq("id", targetId);
      if (error) setSaveError(true);
      else setSaveError(false);
    }, 500);
  }

  function downloadMarkdown() {
    if (!activeNote) return;
    const filename =
      activeNote.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "untitled";
    const content = `# ${activeNote.title || "Untitled"}\n\n${activeNote.body}`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) { setSignOutError(true); return; }
    router.push("/auth/sign-in");
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

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.cookie = `theme=${next ? "dark" : "light"};path=/;max-age=31536000`;
  }

  const darkToggleButton = (
    <button
      onClick={toggleDark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-lg p-1.5 text-ink-muted hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas text-ink md:flex-row">

      {/* Mobile header bar */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-black/5 bg-surface px-4 dark:border-white/5 md:hidden">
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle sidebar"
          className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect y="3" width="18" height="1.5" rx="0.75" fill="currentColor" />
            <rect y="8.25" width="18" height="1.5" rx="0.75" fill="currentColor" />
            <rect y="13.5" width="18" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
        </button>
        <span className="flex-1 truncate text-sm font-medium text-ink-muted">
          {activeNote?.title || "Documents"}
        </span>
        {darkToggleButton}
      </div>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-ink/10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-12 bottom-0 left-0 z-30 flex w-64 shrink-0 flex-col gap-3 bg-cream border-r border-black/5 dark:border-white/5 p-4 transition-transform duration-200 md:static md:top-0 md:w-[15vw] md:min-w-72 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-black/8 bg-black/3 px-3 py-2 text-xs outline-none placeholder-ink-muted dark:border-white/8 dark:bg-white/5"
        />

        {/* New document */}
        <button
          onClick={newDocument}
          className="w-full rounded-xl bg-brand px-4 py-2.5 text-left text-sm font-semibold text-white shadow-sm hover:bg-brand/90 active:bg-brand/80 transition-colors"
        >
          + New document
        </button>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto" aria-live="polite">
          {loadError ? (
            <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
              <p className="text-sm font-semibold text-ink">Unable to load notes</p>
              <p className="text-xs leading-relaxed text-ink-muted">
                Check your connection and reload the page.
              </p>
            </div>
          ) : loaded && notes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
              <p className="text-sm font-semibold text-ink">No Documents Yet</p>
              <p className="text-xs leading-relaxed text-ink-muted">
                Create your first document to start organising your work.
              </p>
              <button
                onClick={newDocument}
                className="mt-2 rounded-lg border border-brand/25 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/8 transition-colors"
              >
                New Document
              </button>
            </div>
          ) : loaded && filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
              <p className="text-sm font-semibold text-ink">No Results</p>
              <p className="text-xs leading-relaxed text-ink-muted">
                Nothing matches &ldquo;{search}&rdquo;.
              </p>
              <button
                onClick={() => setSearch("")}
                className="mt-2 rounded-lg border border-brand/25 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/8 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {filtered.map((note) => (
                <li
                  key={note.id}
                  className={`group flex items-center rounded-xl transition-colors ${
                    note.id === activeNote?.id
                      ? "bg-brand/10"
                      : "hover:bg-black/4 dark:hover:bg-white/6"
                  }`}
                >
                  <Link
                    href={`/docs/${note.id}`}
                    onClick={() => setSidebarOpen(false)}
                    className={`min-w-0 flex-1 truncate px-3 py-2 text-sm transition-colors ${
                      note.id === activeNote?.id
                        ? "font-medium text-brand"
                        : "text-ink/75 dark:text-ink/80"
                    }`}
                  >
                    {note.title || "Untitled"}
                  </Link>
                  <button
                    onClick={() => deleteDocument(note.id)}
                    className="mr-2 flex shrink-0 rounded-lg p-1 text-ink-muted/40 hover:bg-black/8 hover:text-ink dark:hover:bg-white/10 transition-colors md:hidden md:group-hover:flex"
                    aria-label="Delete document"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-black/5 pt-3 dark:border-white/5">
          <Link
            href="/"
            className="w-full rounded-xl bg-brand px-4 py-2.5 text-left text-sm font-semibold text-white shadow-sm hover:bg-brand/90 active:bg-brand/80 transition-colors"
          >
            ← Home
          </Link>
          <button
            onClick={signOut}
            className="w-full rounded-xl border border-black/8 px-4 py-2 text-left text-sm text-ink-muted hover:bg-black/4 dark:border-white/8 dark:hover:bg-white/6 transition-colors"
          >
            Sign out
          </button>
          {signOutError && (
            <p className="text-xs text-red-500">Sign-out failed. Try again.</p>
          )}
          <div className="flex justify-end">
            {darkToggleButton}
          </div>
        </div>
      </aside>

      {/* Editor */}
      <main className="flex flex-1 flex-col overflow-hidden px-6 py-8 md:px-16 md:py-12">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
          {activeNote ? (
            <>
              {/* Title row */}
              <div className="flex items-center justify-between border-b border-black/6 pb-4 dark:border-white/6">
                <input
                  ref={titleRef}
                  type="text"
                  placeholder="Untitled"
                  value={activeNote.title}
                  onChange={(e) => update("title", e.target.value)}
                  onKeyDown={onTitleKeyDown}
                  className="min-w-0 flex-1 bg-transparent font-display text-3xl outline-none placeholder-ink-muted/40"
                />
                <div className="ml-4 flex shrink-0 items-center gap-2">
                  {saveError && (
                    <span className="text-xs text-red-500">Unsaved changes</span>
                  )}
                  <div className="flex rounded-full border border-black/8 bg-black/3 p-0.5 text-xs dark:border-white/8 dark:bg-white/5">
                    <button
                      onClick={() => setPreview(false)}
                      className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
                        !preview
                          ? "bg-ink text-surface"
                          : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setPreview(true)}
                      className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
                        preview
                          ? "bg-ink text-surface"
                          : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                  <button
                    onClick={downloadMarkdown}
                    aria-label="Download as Markdown"
                    title="Download as Markdown"
                    className="rounded-lg p-1.5 text-ink-muted hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <DownloadIcon />
                  </button>
                  {darkToggleButton}
                </div>
              </div>

              {/* Body */}
              {preview ? (
                <div className="mt-6 flex-1 overflow-y-auto text-base leading-loose">
                  {activeNote.body.trim() ? (
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="font-display mt-6 mb-3 text-2xl text-ink">{children}</h1>,
                        h2: ({ children }) => <h2 className="font-display mt-5 mb-2 text-xl text-ink">{children}</h2>,
                        h3: ({ children }) => <h3 className="mt-4 mb-2 text-lg font-semibold text-ink">{children}</h3>,
                        p:  ({ children }) => <p className="mb-4 text-ink/85">{children}</p>,
                        ul: ({ children }) => <ul className="mb-4 list-disc pl-5">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-4 list-decimal pl-8">{children}</ol>,
                        li: ({ children }) => <li className="mb-1 text-ink/85">{children}</li>,
                        strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                      }}
                    >
                      {activeNote.body}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-ink-muted">Nothing to preview yet.</p>
                  )}
                </div>
              ) : (
                <textarea
                  ref={bodyRef}
                  placeholder="Start writing…"
                  value={activeNote.body}
                  onChange={(e) => update("body", e.target.value)}
                  className="mt-6 flex-1 resize-none bg-transparent text-base leading-loose outline-none placeholder-ink-muted/40"
                />
              )}
            </>
          ) : initialId && loaded ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <p className="text-sm text-ink-muted">Document not found.</p>
              <Link
                href="/docs"
                className="text-sm font-semibold text-brand hover:text-brand/80 transition-colors"
              >
                ← Back to workspace
              </Link>
            </div>
          ) : loaded ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm text-ink-muted">
                Select a document or create a new one.
              </p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
