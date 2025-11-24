import React from "react";

// Simple local-only metadata store for video/demo labels.
// No on-chain persistence; used to show custom subject and side names in the UI.
export type BetMetadata = {
  subject?: string;
  sideAName?: string;
  sideBName?: string;
  createdAt?: number;
};

const STORAGE_KEY = "arena-bet-meta";

const safeParse = (raw: string | null): Record<string, BetMetadata> => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (_err) {
    // ignore
  }
  return {};
};

export const getBetMetadata = (betPubkey: string): BetMetadata | null => {
  if (typeof window === "undefined") return null;
  const all = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return all[betPubkey] ?? null;
};

export const saveBetMetadata = (betPubkey: string, meta: BetMetadata) => {
  if (typeof window === "undefined") return;
  const all = safeParse(window.localStorage.getItem(STORAGE_KEY));
  all[betPubkey] = {
    createdAt: all[betPubkey]?.createdAt ?? Date.now(),
    ...all[betPubkey],
    ...meta,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

export const useBetMetadata = (betPubkey?: string) => {
  const [meta, setMeta] = React.useState<BetMetadata | null>(null);

  React.useEffect(() => {
    if (!betPubkey) return;
    const value = getBetMetadata(betPubkey);
    setMeta(value);
  }, [betPubkey]);

  return meta;
};
