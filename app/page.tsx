"use client";

import { useMemo, useState } from "react";
import AuthDialog from "./components/AuthDialog";
import Popup from "./components/Popup";
import { useJournalContext, type JournalEntry } from "./context/JournalContext";

const DEFAULT_AMBIENCE = "forest";

const positiveWords = [
  "calm",
  "better",
  "good",
  "great",
  "happy",
  "confident",
  "win",
  "hopeful",
  "grateful",
  "focused",
];

const heavyWords = [
  "tired",
  "overwhelmed",
  "stress",
  "stressed",
  "heavy",
  "anxious",
  "sad",
  "worried",
  "angry",
];

function analyzeEntries(entries: JournalEntry[]) {
  const joined = entries.map((entry) => entry.text.toLowerCase()).join(" ");
  const words = joined.split(/\s+/).filter(Boolean);
  const positiveCount = words.filter((word) =>
    positiveWords.includes(word.replace(/[^a-z]/g, "")),
  ).length;
  const heavyCount = words.filter((word) =>
    heavyWords.includes(word.replace(/[^a-z]/g, "")),
  ).length;

  const mood =
    positiveCount > heavyCount
      ? "Mostly steady with some positive momentum"
      : positiveCount < heavyCount
        ? "A bit emotionally loaded right now"
        : "Balanced, with mixed emotions showing up";

  const commonTheme =
    joined.includes("work") || joined.includes("task")
      ? "Work and productivity"
      : joined.includes("family") || joined.includes("friend")
        ? "Relationships and connection"
        : "Personal reflection and emotional regulation";

  const suggestion =
    heavyCount >= positiveCount
      ? "Keep entries short and consistent for a few days. Look for one recurring pressure point you can reduce."
      : "You seem to recover well after difficult moments. Capture what helped so you can repeat it intentionally.";

  return {
    mood,
    commonTheme,
    suggestion,
    totalEntries: entries.length,
    positiveCount,
    heavyCount,
  };
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

function PreviousEntriesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="h-[118px] animate-pulse rounded-[24px] border border-stone-200 bg-stone-50 p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="h-4 w-24 rounded bg-stone-200" />
            <div className="h-3 w-20 rounded bg-stone-200" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-stone-200" />
            <div className="h-3 w-[82%] rounded bg-stone-200" />
            <div className="h-3 w-[65%] rounded bg-stone-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [ambience, setAmbience] = useState("");
  const [text, setText] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const {
    userId,
    user,
    journals,
    isLoading,
    requiresLogin,
    prependJournal,
    setAuthenticatedSession,
  } = useJournalContext();

  const insights = useMemo(() => analyzeEntries(journals), [journals]);
  const recentEntries = journals.slice(0, 2);

  const handleSave = async () => {
    const trimmedText = text.trim();

    if (!trimmedText || isSaving) {
      return;
    }

    if (!userId) {
      setErrorMessage("Please login to save journal entries.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const nextEntry: JournalEntry = {
      id: Date.now(),
      text: trimmedText,
      ambience: ambience.trim() || DEFAULT_AMBIENCE,
      createdAt: new Date().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId,
          ambience: nextEntry.ambience,
          text: trimmedText,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || "Unable to save journal entry.");
      }

      prependJournal(nextEntry);
      setAmbience(DEFAULT_AMBIENCE);
      setText("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save journal entry.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_30%),linear-gradient(180deg,_#fffdf7_0%,_#f3efe4_100%)] px-6 py-10 text-stone-900">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-stone-200/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(120,83,32,0.12)] backdrop-blur">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-amber-700">
                Journal Space
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-900">
                Write, review, analyze.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                Capture today&apos;s thoughts, revisit earlier entries, and run
                a lightweight reflection summary.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInsights((current) => !current)}
              className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
            >
              {showInsights ? "Hide Insights" : "Analyze"}
            </button>
          </div>

          <div className="space-y-4">
            <input
              value={ambience}
              onChange={(event) => setAmbience(event.target.value)}
              placeholder="Ambience (for example: forest, rain, ocean)"
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
            />
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="What happened today? What are you feeling right now?"
              className="min-h-[220px] w-full rounded-[28px] border border-stone-200 bg-stone-50 px-4 py-4 text-sm leading-6 outline-none transition focus:border-amber-500 focus:bg-white"
            />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-stone-500">
                  {journals.length} saved{" "}
                  {journals.length === 1 ? "entry" : "entries"}
                </p>
                {errorMessage ? (
                  <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-full bg-amber-500 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          {showInsights ? (
            <section className="rounded-[32px] border border-stone-200/70 bg-stone-950 p-6 text-stone-50 shadow-[0_24px_80px_rgba(28,25,23,0.22)]">
              <p className="text-sm uppercase tracking-[0.28em] text-amber-300">
                Insights
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Reflection summary
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-300">
                    Entries
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {insights.totalEntries}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-300">
                    Positive
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {insights.positiveCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-300">
                    Heavy
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {insights.heavyCount}
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-4 text-sm leading-6 text-stone-300">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-amber-300">
                    Mood pattern
                  </p>
                  <p className="mt-1 text-base text-white">{insights.mood}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-amber-300">
                    Main theme
                  </p>
                  <p className="mt-1 text-base text-white">
                    {insights.commonTheme}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-amber-300">
                    Suggested prompt
                  </p>
                  <p className="mt-1 text-base text-white">
                    {insights.suggestion}
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-[32px] border border-dashed border-stone-300 bg-white/65 p-6 text-stone-600">
              <p className="text-sm uppercase tracking-[0.28em] text-stone-500">
                Insights
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-900">
                Analysis is off
              </h2>
              <p className="mt-3 text-sm leading-6">
                Click Analyze to generate a quick emotional summary from the
                entries shown here.
              </p>
            </section>
          )}

          <section className="rounded-[32px] border border-stone-200/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(120,83,32,0.1)]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-amber-700">
                  Previous Entries
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-stone-900">
                  Recent journal history
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAllHistory(true)}
                disabled={isLoading || requiresLogin || journals.length === 0}
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                View All
              </button>
            </div>
            {isLoading ? <PreviousEntriesSkeleton /> : null}
            {!isLoading && requiresLogin ? (
              <div className="rounded-[24px] border border-dashed border-stone-300 bg-stone-50 p-5">
                <p className="text-sm text-stone-600">
                  Please login to see your journal history.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("register")}
                    className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900"
                  >
                    Register
                  </button>
                </div>
              </div>
            ) : null}
            {!isLoading && !requiresLogin && recentEntries.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-stone-600">
                No journal history yet.
              </div>
            ) : null}
            {!isLoading && !requiresLogin && recentEntries.length > 0 ? (
              <div className="space-y-4">
                {recentEntries.map((entry) => (
                  <article
                    key={entry.id}
                    className="h-[118px] rounded-[24px] border border-stone-200 bg-stone-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-base font-semibold capitalize text-stone-900">
                        {entry.ambience}
                      </h3>
                      <span className="text-xs text-stone-500">
                        {entry.createdAt}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      {truncateText(entry.text, 125)}
                    </p>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </aside>
      </div>

      {showAllHistory ? (
        <Popup entries={journals} setShowAllHistory={setShowAllHistory} />
      ) : null}
      {authMode ? (
        <AuthDialog
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitchMode={setAuthMode}
          onAuthenticated={(session) => {
            setAuthenticatedSession(session);
            setErrorMessage("");
          }}
        />
      ) : null}
    </main>
  );
}
