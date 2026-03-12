import type { Dispatch, SetStateAction } from "react";
import type { JournalEntry } from "../context/JournalContext";

type PopupProps = {
  setShowAllHistory: Dispatch<SetStateAction<boolean>>;
  entries: JournalEntry[];
};

export default function Popup({
  setShowAllHistory,
  entries,
}: PopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-[0_30px_120px_rgba(28,25,23,0.28)]">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-amber-700">
              Journal History
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-900">
              All saved entries
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowAllHistory(false)}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Close
          </button>
        </div>
        <div className="max-h-[calc(85vh-96px)] space-y-4 overflow-y-auto px-6 py-5">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-[24px] border border-stone-200 bg-stone-50 p-4"
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
                {entry.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
