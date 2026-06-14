"use client";

import { useState, useRef, useEffect } from "react";

type Doc = {
  id: string;
  title: string;
  body: string;
};

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function Home() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const activeDoc = docs.find((d) => d.id === activeId) ?? null;
  const filtered = docs.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  function newDocument() {
    const doc: Doc = { id: uid(), title: "", body: "" };
    setDocs((prev) => [doc, ...prev]);
    setActiveId(doc.id);
  }

  function update(field: "title" | "body", value: string) {
    setDocs((prev) =>
      prev.map((d) => (d.id === activeId ? { ...d, [field]: value } : d))
    );
  }

  // Focus title whenever a new doc becomes active
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
        <ul className="flex flex-col gap-0.5 overflow-y-auto">
          {filtered.map((doc) => (
            <li key={doc.id}>
              <button
                onClick={() => setActiveId(doc.id)}
                className={`w-full truncate rounded px-3 py-2 text-left text-sm ${
                  doc.id === activeId ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                {doc.title || "Untitled"}
              </button>
            </li>
          ))}
        </ul>
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
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
            Click &quot;+ New document&quot; to get started.
          </div>
        )}
      </main>
    </div>
  );
}
