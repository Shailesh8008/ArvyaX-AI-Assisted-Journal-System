"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";

const DEFAULT_AMBIENCE = "forest";

export type JournalEntry = {
  id: string | number;
  text: string;
  ambience: string;
  createdAt: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type UserDetailsResponse = {
  ok?: boolean;
  userId?: string;
  user?: unknown;
  journals?: unknown[];
};

type JournalContextValue = {
  userId: string | null;
  user: AuthUser | null;
  journals: JournalEntry[];
  isLoading: boolean;
  requiresLogin: boolean;
  setJournals: Dispatch<SetStateAction<JournalEntry[]>>;
  prependJournal: (entry: JournalEntry) => void;
  setAuthenticatedSession: (session: {
    userId: string;
    user: AuthUser;
    journals?: JournalEntry[];
  }) => void;
};

const JournalContext = createContext<JournalContextValue | null>(null);

function formatCreatedAt(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return new Date().toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeJournal(entry: unknown, index: number): JournalEntry {
  if (!entry || typeof entry !== "object") {
    return {
      id: Date.now() + index,
      text: "",
      ambience: DEFAULT_AMBIENCE,
      createdAt: formatCreatedAt(undefined),
    };
  }

  const record = entry as Record<string, unknown>;
  const rawId = record.id;
  const parsedId =
    typeof rawId === "number"
      ? rawId
      : typeof rawId === "string" && rawId.trim()
        ? rawId
        : Number.NaN;

  return {
    id: typeof parsedId === "string" || !Number.isNaN(parsedId) ? parsedId : Date.now() + index,
    text:
      typeof record.text === "string"
        ? record.text
        : typeof record.content === "string"
          ? record.content
          : typeof record.body === "string"
            ? record.body
            : "",
    ambience:
      typeof record.ambience === "string" && record.ambience.trim()
        ? record.ambience
        : DEFAULT_AMBIENCE,
    createdAt: formatCreatedAt(record.createdAt ?? record.created_at),
  };
}

function normalizeUser(user: unknown): AuthUser | null {
  if (!user || typeof user !== "object") {
    return null;
  }

  const record = user as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.email !== "string"
  ) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    createdAt: formatCreatedAt(record.createdAt ?? record.created_at),
  };
}

export function JournalProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresLogin, setRequiresLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUserDetails() {
      try {
        const response = await fetch("/api/user-details", {
          credentials: "include",
        });
        const data = (await response.json()) as UserDetailsResponse;

        if (!response.ok || data.ok === false) {
          if (!cancelled) {
            setRequiresLogin(true);
            setUserId(null);
            setUser(null);
            setJournals([]);
          }
          return;
        }

        if (!cancelled) {
          const normalizedUser = normalizeUser(data.user);
          setRequiresLogin(false);
          setUserId(typeof data.userId === "string" ? data.userId : null);
          setUser(normalizedUser);
          setJournals(
            Array.isArray(data.journals)
              ? data.journals.map(normalizeJournal)
              : [],
          );
        }
      } catch {
        if (!cancelled) {
          setRequiresLogin(true);
          setUserId(null);
          setUser(null);
          setJournals([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadUserDetails();

    return () => {
      cancelled = true;
    };
  }, []);

  const prependJournal = (entry: JournalEntry) => {
    setJournals((current) => [entry, ...current]);
  };

  const setAuthenticatedSession = (session: {
    userId: string;
    user: AuthUser;
    journals?: JournalEntry[];
  }) => {
    setUserId(session.userId);
    setUser(session.user);
    setRequiresLogin(false);
    if (session.journals) {
      setJournals(session.journals);
    }
  };

  return (
    <JournalContext.Provider
      value={{
        userId,
        user,
        journals,
        isLoading,
        requiresLogin,
        setJournals,
        prependJournal,
        setAuthenticatedSession,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
}

export function useJournalContext() {
  const context = useContext(JournalContext);

  if (!context) {
    throw new Error("useJournalContext must be used within a JournalProvider.");
  }

  return context;
}
