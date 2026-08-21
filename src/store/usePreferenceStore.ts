"use client";

import { useSyncExternalStore } from "react";

export type PreferenceState = {
  private_mode: boolean;
  hide_balance: boolean;
};

const STORAGE_KEY = "money-tracker-preferences";

const DEFAULT_STATE: PreferenceState = {
  private_mode: false,
  hide_balance: false,
};

let state: PreferenceState = DEFAULT_STATE;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function loadInitialState(): PreferenceState {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(saved);

    return {
      private_mode:
        typeof parsed.private_mode === "boolean"
          ? parsed.private_mode
          : false,

      hide_balance:
        typeof parsed.hide_balance === "boolean"
          ? parsed.hide_balance
          : false,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

if (typeof window !== "undefined") {
  state = loadInitialState();

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;

    state = loadInitialState();
    notify();
  });
}

export function getPreferenceState() {
  return state;
}

export function setPreferenceState(
  preferences: Partial<PreferenceState>
) {
  state = {
    ...state,
    ...preferences,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );
  }

  notify();

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("money-tracker-preferences", {
        detail: state,
      })
    );
  }
}

export function resetPreferenceState() {
  state = DEFAULT_STATE;

  if (typeof window !== "undefined") {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );
  }

  notify();
}

export function usePreferenceStore() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    () => state,
    () => DEFAULT_STATE
  );
}

// ------------------------------------------------------------------
// Mode Privasi -> khusus menyembunyikan nominal di halaman Dashboard
// (saldo, pemasukan, pengeluaran, chart, breakdown kategori, tabungan).
// TIDAK terpengaruh oleh toggle "Sembunyikan saldo".
// ------------------------------------------------------------------
export function useHideBalance() {
  const preferences = usePreferenceStore();
  return preferences.private_mode;
}

// ------------------------------------------------------------------
// Sembunyikan Saldo -> khusus menyembunyikan saldo wallet di halaman
// Wallet (daftar wallet & saldo utama). TIDAK terpengaruh oleh
// toggle "Mode privasi".
// ------------------------------------------------------------------
export function useHideWalletBalance() {
  const preferences = usePreferenceStore();
  return preferences.hide_balance;
}