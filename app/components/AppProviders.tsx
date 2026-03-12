"use client";

import type { ReactNode } from "react";
import { JournalProvider } from "../context/JournalContext";

export default function AppProviders({ children }: { children: ReactNode }) {
  return <JournalProvider>{children}</JournalProvider>;
}
