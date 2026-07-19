"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useTalentsState, type TalentsController } from "@/hooks/use-talents";

const TalentsContext = createContext<TalentsController | null>(null);

export function TalentsProvider({ children }: { children: ReactNode }) {
  const value = useTalentsState();
  return <TalentsContext.Provider value={value}>{children}</TalentsContext.Provider>;
}

export function useTalents(): TalentsController {
  const context = useContext(TalentsContext);
  if (!context) {
    throw new Error("useTalents must be used within TalentsProvider");
  }
  return context;
}
