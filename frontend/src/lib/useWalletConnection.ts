"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

type WalletStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

export function useWalletConnection() {
  const wallet = useWallet();
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const adapter = wallet.wallet?.adapter;
    if (!adapter) return;

    const handleConnect = () => {
      setStatus("connected");
      setError(null);
    };
    const handleDisconnect = () => setStatus("disconnected");
    const handleError = (err: any) => {
      setStatus("error");
      setError(err?.message || "Wallet error");
    };

    adapter.on("connect", handleConnect);
    adapter.on("disconnect", handleDisconnect);
    adapter.on("error", handleError);

    return () => {
      adapter.off("connect", handleConnect);
      adapter.off("disconnect", handleDisconnect);
      adapter.off("error", handleError);
    };
  }, [wallet.wallet?.adapter]);

  useEffect(() => {
    if (wallet.connecting) {
      setStatus("connecting");
      return;
    }
    if (wallet.connected) {
      setStatus("connected");
      setError(null);
      return;
    }
    if (!wallet.connected && status === "idle") {
      setStatus("disconnected");
    }
  }, [wallet.connected, wallet.connecting, status]);

  const ensureConnected = async () => {
    if (wallet.connected) return true;
    if (wallet.connecting) {
      // Wait for the current attempt to finish
      await new Promise((resolve) => setTimeout(resolve, 300));
      return wallet.connected;
    }
    if (wallet.connect) {
      try {
        setStatus("connecting");
        await wallet.connect();
        setStatus("connected");
        setError(null);
        return true;
      } catch (err: any) {
        setStatus("error");
        setError(err?.message || "Failed to connect wallet");
        return false;
      }
    }
    setStatus("error");
    setError("No wallet adapter available");
    return false;
  };

  const statusLabel = useMemo(() => {
    switch (status) {
      case "connecting":
        return "Connecting...";
      case "connected":
        return "Connected";
      case "error":
        return "Wallet error";
      default:
        return "Connect to create";
    }
  }, [status]);

  return {
    status,
    statusLabel,
    error,
    ensureConnected,
    wallet,
  };
}
