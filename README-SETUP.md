# Cara Pakai File Ini

## 1. Komponen shadcn yang WAJIB ada dulu

Sebelum copy file-file ini, pastikan komponen shadcn berikut sudah di-add
di project kamu (kalau belum, jalankan):

```bash
npx shadcn@latest add button input label card form sonner
```

## 2. Package tambahan yang dipakai

Pastikan sudah terinstall:

```bash
npm install axios zustand react-hook-form zod @hookform/resolvers js-cookie
npm install -D @types/js-cookie
```

## 3. Cara merge ke project kamu

Copy folder `src/` di sini ke project Next.js kamu (merge, JANGAN full replace):

- File-file BARU (apiClient.ts, auth.ts, authService.ts, dll) → tinggal copy langsung.
- `src/app/layout.tsx` → **JANGAN langsung timpa**. Punya kamu (hasil create-next-app + shadcn init)
  sudah ada setup font (misal `Geist`) dan `<html>` classnya. Buka file ini,
  lalu tambahin manual 2 baris berikut ke layout.tsx kamu yang asli:

  ```tsx
  import { Toaster } from "@/components/ui/sonner";
  // ...
  // taruh <Toaster richColors position="top-center" /> tepat sebelum </body>
  ```

- `src/app/page.tsx`, `src/middleware.ts`, `src/app/(auth)/*`, `src/app/(dashboard)/*` →
  aman langsung copy/replace karena ini file baru.

## 4. Update `.env.local`

File `.env.local` di sini sudah diisi API kamu:
```
NEXT_PUBLIC_API_URL=https://moneytrackerapi-production-c176.up.railway.app/api
```
Copy ke root project kamu (sejajar dengan `package.json`).

## 5. PENTING — cek response shape API kamu

Kode di `authService.ts` dan halaman login/register **mengasumsikan** response
API kamu bentuknya:

```json
{
  "token": "xxx.yyy.zzz",
  "user": { "id": "...", "name": "...", "email": "..." }
}
```

Kalau ternyata response asli backend kamu beda (misal dibungkus `data`, atau
field-nya `access_token`, dll), sesuaikan di:
- `src/types/user.ts` (interface `AuthResponse`)
- `src/app/(auth)/login/page.tsx` dan `register/page.tsx` (bagian `res.token`, `res.user`)

Cara paling gampang cek: buka DevTools → Network → coba login → lihat response
body asli dari `/api/auth/login`.

## 6. Jalankan & test alurnya

```bash
npm run dev
```

Buka `http://localhost:3000` → otomatis redirect ke `/login` →
klik "Daftar" buat coba register → habis itu login → kalau berhasil,
otomatis masuk ke `/dashboard` dan nampilin card "✅ Berhasil masuk ke Dashboard".

Kalau ada error CORS di console browser, itu artinya backend Go kamu di Railway
belum allow origin `http://localhost:3000`. Perlu di-fix di sisi backend.

## 7. Kalau sudah CORS-nya beres tapi tetap gagal

Cek response error di Network tab, kemungkinan:
- Field body yang dikirim beda nama (misal backend expect `Email` bukan `email`)
- Endpoint path beda dari dokumen (misal bukan `/auth/login`)

Kirim screenshot error-nya ke saya kalau masih stuck.
