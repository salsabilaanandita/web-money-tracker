"use client";

import { useSyncExternalStore } from "react";

// Store super simpel: cuma nyimpen angka "versi".
// Setiap kali triggerNotificationRefresh() dipanggil, angkanya
// naik satu, dan semua komponen yang subscribe (Sidebar) langsung
// tau harus refetch notifikasi.
//
// Dipanggil dari halaman manapun setelah:
// - berhasil bikin/update/hapus transaksi
// - berhasil bikin/hapus budget
// - berhasil setor tabungan / bikin saving goal

let version = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function triggerNotificationRefresh() {
  version += 1;
  notify();
}

export function useNotificationRefreshSignal() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => version,
    () => 0
  );
}
