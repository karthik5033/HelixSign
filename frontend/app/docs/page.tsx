"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Home,
  PlayCircle,
  Layers,
  Terminal,
  GitBranch,
  Share2,
  BarChart3,
  Crosshair,
  Activity,
  ShieldCheck,
  Code2,
  FileCode,
  Radio,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  ExternalLink,
  BookOpen,
  Sliders,
  Cpu,
  Database,
  ArrowUpRight,
  Info,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { AppLogo } from "@/components/ui/AppLogo";
import { Button } from "@/components/ui/button";
import { DOCS_NAV_GROUPS, DOC_ARTICLES, DocArticle } from "@/components/docs/docsData";
import { DocsSearchModal } from "@/components/docs/DocsSearchModal";

const ICON_MAP: Record<string, React.ElementType> = {
  Home,
  PlayCircle,
  Layers,
  Terminal,
  GitBranch,
  Share2,
  BarChart3,
  Crosshair,
  Activity,
  ShieldCheck,
  Code2,
  FileCode,
  Radio,
  CheckCircle2,
};

const FRAMEWORK_PILLS = [
  { name: "Python SDK", badge: "v2.0", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { name: "reedsolo GF(2⁸)", badge: "RS(16,8)", color: "text-zinc-300 border-zinc-700 bg-zinc-800/60" },
  { name: "PyTorch", badge: "WGAN-GP", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { name: "FastAPI", badge: "REST", color: "text-teal-400 border-teal-500/30 bg-teal-500/10" },
  { name: "Biopython", badge: "SeqIO", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { name: "Table 11", badge: "Bacterial", color: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
];

export default function DocsPage() {
  const [activeTopicId, setActiveTopicId] = useState<string>("overview");
  const [activeCodeTab, setActiveCodeTab] = useState<"python" | "curl" | "typescript" | "cpp">("python");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSubNavCollapsed, setIsSubNavCollapsed] = useState(false);
  const mainContentRef = React.useRef<HTMLElement>(null);

  // Read URL query or hash on mount if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const topic = params.get("topic") || window.location.hash.replace("#", "");
      if (topic && DOC_ARTICLES[topic]) {
        setActiveTopicId(topic);
      }
    }
  }, []);

  const currentArticle: DocArticle = DOC_ARTICLES[activeTopicId] || DOC_ARTICLES.overview;

  // Active Category & its sub-topics for secondary sidebar
  const activeNavGroup =
    DOCS_NAV_GROUPS.find((group) => group.items.some((item) => item.id === activeTopicId)) ||
    DOCS_NAV_GROUPS[0];

  const handleSelectTopic = (topicId: string) => {
    setActiveTopicId(topicId);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/docs?topic=${topicId}`);
    }
    mainContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    // Reset code tab to available snippet
    const art = DOC_ARTICLES[topicId];
    if (art?.content.codeSnippets) {
      if (art.content.codeSnippets.python) setActiveCodeTab("python");
      else if (art.content.codeSnippets.curl) setActiveCodeTab("curl");
      else if (art.content.codeSnippets.typescript) setActiveCodeTab("typescript");
      else if (art.content.codeSnippets.cpp) setActiveCodeTab("cpp");
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyMarkdown = () => {
    const md = `# ${currentArticle.title}
${currentArticle.lead}

${currentArticle.content.overviewText}`;
    navigator.clipboard.writeText(md);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="h-screen bg-[#111115] text-[#e4e4e7] flex flex-col font-sans overflow-hidden selection:bg-[#FF5500] selection:text-white">
      {/* ========================================================= */}
      {/* 1. TOP GLOBAL NAVIGATION HEADER                           */}
      {/* ========================================================= */}
      <header className="h-14 shrink-0 border-b border-[#212128] bg-[#111115]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between select-none z-40">
        {/* Left: Brand + Docs Pill */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <AppLogo size="sm" showText={true} />
          </Link>
          <span className="text-zinc-600 font-light">|</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 bg-[#1c1c22] border border-[#2a2a34] px-2 py-0.5 rounded-md">
            Docs
          </span>
        </div>

        {/* Center: Search Trigger Input Bar */}
        <div className="hidden md:flex items-center justify-center flex-1 max-w-md px-4">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-[#18181f] hover:bg-[#1f1f28] border border-[#262630] hover:border-[#353542] text-xs text-zinc-400 transition-all cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
              <span>Search documentation...</span>
            </div>
            <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#23232c] border border-[#2e2e38] text-[10px] font-mono text-zinc-400 group-hover:text-zinc-300">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Quick Links & Console Button */}
        <div className="flex items-center gap-3">
          <Link href="/architecture" className="hidden sm:inline-block">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-400 hover:text-white hover:bg-[#1a1a22] h-8"
            >
              Architecture
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              size="sm"
              className="bg-[#FF5500] hover:bg-[#E54B00] text-white text-xs font-medium h-8 px-3.5 rounded-lg shadow-[0_0_15px_rgba(255,85,0,0.35)] transition-all cursor-pointer gap-1.5"
            >
              <span>Launch Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. DUAL-SIDEBAR & MAIN DOCUMENTATION VIEWPORT             */}
      {/* ========================================================= */}
      <div className="flex flex-1 h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* ------------------------------------------------------- */}
        {/* PRIMARY SIDEBAR (Left Column: Categories & Core Hub)    */}
        {/* ------------------------------------------------------- */}
        <aside className="w-60 h-full border-r border-[#212128] bg-[#111115] shrink-0 p-4 hidden lg:flex flex-col select-none">
          <div className="flex-1 overflow-y-auto space-y-6 pr-1">
            {DOCS_NAV_GROUPS.map((group) => (
              <div key={group.name} className="space-y-1">
                <span className="text-[11px] font-mono font-semibold tracking-wider text-zinc-500 uppercase px-2 mb-2 block">
                  {group.name}
                </span>

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = ICON_MAP[item.iconName] || Home;
                    const isActive = activeTopicId === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTopic(item.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                          isActive
                            ? "bg-[#1c1c24] text-white font-medium border border-[#2b2b36] shadow-sm"
                            : "text-zinc-400 hover:text-white hover:bg-[#17171d]"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? "text-[#FF5500]" : "text-zinc-500 group-hover:text-zinc-400"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer info */}
          <div className="pt-4 mt-auto border-t border-[#1d1d24] text-[11px] font-mono text-zinc-500 space-y-1 shrink-0">
            <div className="flex items-center justify-between">
              <span>Spec v2.4.0</span>
              <span className="text-zinc-400">EN 1330-9</span>
            </div>
            <div className="text-[10px] text-zinc-600">
              HelixSign &bull; Table 11 Codec
            </div>
          </div>
        </aside>

        {/* ------------------------------------------------------- */}
        {/* SECONDARY SIDEBAR (Contextual Sub-Nav Tree)             */}
        {/* ------------------------------------------------------- */}
        {!isSubNavCollapsed && (
          <aside className="w-56 h-full border-r border-[#212128] bg-[#141419] shrink-0 p-4 hidden md:flex flex-col select-none">
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {/* Back / Category Root Label */}
              <div className="pb-2 border-b border-[#22222a]">
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#FF5500] uppercase block">
                  {activeNavGroup.name}
                </span>
                <span className="text-xs font-semibold text-white truncate block mt-0.5">
                  {currentArticle.categoryTitle}
                </span>
              </div>

              {/* Group Topics */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-semibold tracking-wider text-zinc-500 uppercase px-2 mb-1.5 block">
                  Articles in Section
                </span>
                {activeNavGroup.items.map((subItem) => {
                  const isActive = activeTopicId === subItem.id;
                  return (
                    <button
                      key={subItem.id}
                      onClick={() => handleSelectTopic(subItem.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isActive
                          ? "bg-[#20202a] text-white font-medium border border-[#2d2d3a]"
                          : "text-zinc-400 hover:text-white hover:bg-[#1a1a22]"
                      }`}
                    >
                      <span className="truncate">{subItem.label}</span>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#FF5500] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Related Standards */}
              <div className="pt-4 border-t border-[#202028] space-y-2">
                <span className="text-[10px] font-mono font-semibold tracking-wider text-zinc-500 uppercase px-2 block">
                  Standards
                </span>
                <div className="px-2 space-y-1 text-[11px] text-zinc-400">
                  <div className="hover:text-zinc-200 transition-colors flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-zinc-500" />
                    <span>ASTM E1316</span>
                  </div>
                  <div className="hover:text-zinc-200 transition-colors flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-zinc-500" />
                    <span>ISO/IEC 27001 Provenance</span>
                  </div>
                  <div className="hover:text-zinc-200 transition-colors flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-zinc-500" />
                    <span>IEEE 1588 PTP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapse toggle */}
            <button
              onClick={() => setIsSubNavCollapsed(true)}
              className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 pt-3 mt-auto shrink-0 border-t border-[#202028] cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Hide sub-nav</span>
            </button>
          </aside>
        )}

        {/* ------------------------------------------------------- */}
        {/* MAIN DOCUMENTATION ARTICLE PANE                         */}
        {/* ------------------------------------------------------- */}
        <main
          ref={mainContentRef}
          className="flex-1 h-full overflow-y-auto px-6 sm:px-10 lg:px-12 py-10 max-w-5xl mx-auto"
        >
          {/* Breadcrumb / Category Kicker */}
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider">
              <span>{currentArticle.category}</span>
              <ChevronRight className="w-3 h-3 text-zinc-600" />
              <span className="text-zinc-400 font-semibold">{currentArticle.subcategory}</span>
            </div>

            {/* Quick Unhide Subnav pill if collapsed */}
            {isSubNavCollapsed && (
              <button
                onClick={() => setIsSubNavCollapsed(false)}
                className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-[#1c1c24] border border-[#2b2b36] text-[11px] text-zinc-400 hover:text-white cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
                <span>Show sub-nav</span>
              </button>
            )}
          </div>

          {/* Signature Title with Orange Underscore Cursor */}
          <div className="space-y-3 pb-6 border-b border-[#22222a]">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-white leading-tight">
              {currentArticle.title}
              <span className="text-[#FF5500] font-extrabold ml-0.5 animate-pulse">_</span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-sans max-w-3xl">
              {currentArticle.lead}
            </p>

            {/* Meta Row: Reading Time + Badges + Top Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-zinc-400 bg-[#1c1c24] border border-[#282834] px-2.5 py-0.5 rounded-full">
                  {currentArticle.readingTime}
                </span>
                {currentArticle.badges.map((b) => (
                  <span
                    key={b}
                    className="text-[11px] font-mono text-zinc-400 bg-[#181820] border border-[#262632] px-2 py-0.5 rounded"
                  >
                    {b}
                  </span>
                ))}
              </div>

              {/* Action Buttons: Copy Markdown & Raw */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a22] hover:bg-[#23232c] border border-[#2a2a36] text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedRaw ? (
                    <Check className="w-3.5 h-3.5 text-zinc-300" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  <span>{copiedRaw ? "Copied" : "Copy Markdown"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Article Body Content */}
          <div className="py-8 space-y-10 text-sm leading-relaxed text-zinc-300">
            {/* 1. Overview Paragraph */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-white tracking-tight">Overview</h2>
              <p className="text-zinc-300 leading-relaxed text-sm">
                {currentArticle.content.overviewText}
              </p>
            </section>

            {/* 2. Framework & Quickstart Pills (on overview article) */}
            {activeTopicId === "overview" && (
              <section className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                    Supported Runtimes &amp; Core Engines
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">v2.4 LTS</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {FRAMEWORK_PILLS.map((fw) => (
                    <div
                      key={fw.name}
                      className={`flex flex-col justify-between p-3 rounded-lg border bg-[#16161d] ${fw.color} transition-all hover:border-zinc-500`}
                    >
                      <span className="text-xs font-semibold text-white">{fw.name}</span>
                      <span className="text-[10px] font-mono mt-2 opacity-80">{fw.badge}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3. Key Points Grid */}
            {currentArticle.content.keyPoints && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-white tracking-tight">
                  Core Architectural Capabilities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentArticle.content.keyPoints.map((point) => (
                    <div
                      key={point.title}
                      className="p-5 rounded-xl border border-[#24242e] bg-[#16161c] hover:border-[#32323e] transition-colors space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />
                        <h4 className="text-xs font-semibold text-white tracking-tight">{point.title}</h4>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                        {point.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. Mathematical Formula Box */}
            {currentArticle.content.mathFormula && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white tracking-tight">
                  {currentArticle.content.mathFormula.title}
                </h2>
                <div className="rounded-xl border border-[#2b2b36] bg-[#0e0e13] p-5 shadow-lg space-y-3 font-mono">
                  <div className="text-center py-4 px-2 text-sm sm:text-base text-zinc-100 bg-[#16161d] rounded-lg border border-[#22222b] overflow-x-auto select-all">
                    {currentArticle.content.mathFormula.formula}
                  </div>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    {currentArticle.content.mathFormula.explanation}
                  </p>
                </div>
              </section>
            )}

            {/* 5. Interactive Code Block with Language Tabs */}
            {currentArticle.content.codeSnippets && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white tracking-tight">
                    Implementation Example
                  </h2>

                  {/* Language Tab Switcher */}
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-[#181820] border border-[#24242e]">
                    {currentArticle.content.codeSnippets.python && (
                      <button
                        onClick={() => setActiveCodeTab("python")}
                        className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                          activeCodeTab === "python"
                            ? "bg-[#252530] text-white font-medium"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Python
                      </button>
                    )}
                    {currentArticle.content.codeSnippets.curl && (
                      <button
                        onClick={() => setActiveCodeTab("curl")}
                        className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                          activeCodeTab === "curl"
                            ? "bg-[#252530] text-white font-medium"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        cURL
                      </button>
                    )}
                    {currentArticle.content.codeSnippets.typescript && (
                      <button
                        onClick={() => setActiveCodeTab("typescript")}
                        className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                          activeCodeTab === "typescript"
                            ? "bg-[#252530] text-white font-medium"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        TypeScript
                      </button>
                    )}
                    {currentArticle.content.codeSnippets.cpp && (
                      <button
                        onClick={() => setActiveCodeTab("cpp")}
                        className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                          activeCodeTab === "cpp"
                            ? "bg-[#252530] text-white font-medium"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        reedsolo GF(2⁸)
                      </button>
                    )}
                  </div>
                </div>

                {/* Code Window Container */}
                <div className="rounded-xl border border-[#2b2b36] bg-[#0c0c10] overflow-hidden shadow-2xl">
                  {/* Code Window Header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#14141a] border-b border-[#22222a] text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                      <span className="text-zinc-400 font-medium">
                        {activeCodeTab === "python" && "pipeline.py"}
                        {activeCodeTab === "curl" && "request.sh"}
                        {activeCodeTab === "typescript" && "client.ts"}
                        {activeCodeTab === "cpp" && "homology.cpp"}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const snippet = currentArticle.content.codeSnippets?.[activeCodeTab] || "";
                        handleCopyCode(snippet);
                      }}
                      className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedCode ? (
                        <Check className="w-3.5 h-3.5 text-zinc-300" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[11px]">{copiedCode ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  {/* Code Editor Body */}
                  <pre className="p-4 sm:p-5 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed bg-[#0c0c10]">
                    <code>{currentArticle.content.codeSnippets[activeCodeTab]}</code>
                  </pre>
                </div>
              </section>
            )}

            {/* 6. Benchmark Table (if present) */}
            {currentArticle.content.tableData && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white tracking-tight">
                  Quantitative Verification Results
                </h2>
                <div className="rounded-xl border border-[#252530] bg-[#14141a] overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-[#1b1b22] border-b border-[#252530] text-zinc-400 font-mono text-[11px]">
                        <tr>
                          {currentArticle.content.tableData.headers.map((h, i) => (
                            <th key={i} className="py-3 px-4 font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#21212a] font-mono text-zinc-300">
                        {currentArticle.content.tableData.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-[#181820]/70 transition-colors">
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className={`py-3 px-4 ${
                                  cIdx === 0
                                    ? "font-semibold text-white font-sans"
                                    : cIdx === 2 && cell === "0.938"
                                    ? "text-zinc-200 font-semibold"
                                    : "text-zinc-300"
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* 7. Schema JSON (if present) */}
            {currentArticle.content.schemaJson && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white tracking-tight">
                  Schema Specification
                </h2>
                <div className="rounded-xl border border-[#252530] bg-[#0c0c10] p-4 font-mono text-xs text-zinc-300 overflow-x-auto">
                  <pre>
                    <code>{currentArticle.content.schemaJson}</code>
                  </pre>
                </div>
              </section>
            )}

            {/* 8. Callout Box */}
            {currentArticle.content.callout && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                  currentArticle.content.callout.type === "caution"
                    ? "border-amber-500/30 bg-amber-950/15 text-amber-200"
                    : currentArticle.content.callout.type === "tip"
                    ? "border-[#FF5500]/30 bg-[#FF5500]/10 text-zinc-200"
                    : "border-zinc-700/60 bg-[#16161d] text-zinc-300"
                }`}
              >
                {currentArticle.content.callout.type === "caution" && (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                {currentArticle.content.callout.type === "tip" && (
                  <Lightbulb className="w-4 h-4 text-[#FF5500] shrink-0 mt-0.5" />
                )}
                {currentArticle.content.callout.type === "note" && (
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold block text-white mb-0.5">
                    {currentArticle.content.callout.title}
                  </span>
                  <span>{currentArticle.content.callout.text}</span>
                </div>
              </div>
            )}

            {/* 9. Related Topics / Next Steps Cards */}
            {currentArticle.content.relatedTopics && (
              <section className="pt-6 border-t border-[#22222a] space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  Next Guides &amp; References
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {currentArticle.content.relatedTopics.map((rel) => (
                    <button
                      key={rel.id}
                      onClick={() => handleSelectTopic(rel.id)}
                      className="p-4 rounded-xl border border-[#252530] bg-[#15151c] hover:border-[#383846] hover:bg-[#1a1a22] transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white group-hover:text-[#FF5500] transition-colors">
                          {rel.title}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {rel.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* 3. CTRL+K SEARCH MODAL                                    */}
      {/* ========================================================= */}
      <DocsSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTopic={handleSelectTopic}
      />
    </div>
  );
}
