"use client";

import React, { useState, useEffect } from "react";
import { Search, X, ChevronRight, FileText } from "lucide-react";
import { DOC_ARTICLES } from "./docsData";

interface DocsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topicId: string) => void;
}

export function DocsSearchModal({ isOpen, onClose, onSelectTopic }: DocsSearchModalProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results = Object.values(DOC_ARTICLES).filter((doc) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.lead.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      doc.subcategory.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in-0 duration-150">
      <div className="w-full max-w-xl rounded-xl border border-[#2b2b36] bg-[#15151a] shadow-2xl overflow-hidden flex flex-col">
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#24242e] bg-[#18181f]">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search documentation (e.g. Reed-Solomon, Codon Codec, WGAN-GP, REST API)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded hover:bg-[#252530] text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#23232c] border border-[#2e2e38] text-[10px] font-mono text-zinc-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No documentation articles match &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTopic(item.id);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#1f1f26] text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-[#22222b] border border-[#2c2c38] flex items-center justify-center text-zinc-400 group-hover:text-white shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white truncate">{item.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#252530] text-zinc-400">
                        {item.readingTime}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{item.lead}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 shrink-0 ml-2" />
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#22222b] bg-[#121216] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>Search HelixSign Documentation v2.4.0</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}

