"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  PieChart,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { setToken } from "@/lib/auth";
import { login } from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Email dan password wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await login({ email, password });

      if (!data.token) {
        toast.error("Login gagal: token tidak diterima dari server.");
        return;
      }

      setToken(data.token);
      toast.success("Berhasil masuk!");
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Login error:", error);

      const response = (
        error as {
          response?: {
            data?: {
              message?: string;
              error?: string;
            };
          };
        }
      )?.response?.data;

      const message =
        response?.message ?? response?.error ?? "Email atau password salah.";

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="h-screen overflow-hidden bg-background">
      <div className="grid h-full lg:grid-cols-2">
        {/* =====================================================
            LEFT SIDE
        ===================================================== */}
        <section className="flex h-full items-center justify-center overflow-y-auto bg-background px-6 py-8 sm:px-12">
          <div className="w-full max-w-[360px]">
            {/* Logo */}
            <div className="mb-10 flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
                <Wallet className="size-4 text-primary-foreground" />
              </div>

              <div>
                <p className="font-sans text-[15px] font-bold leading-none text-primary">
                  Money Tracker
                </p>

                <p className="mt-1 text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                  Personal Finance
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                Welcome back
              </p>

              <h1 className="font-display text-[30px] font-bold leading-tight tracking-tight">
                Halo lagi.
              </h1>

              <p className="mt-2 max-w-[330px] text-[13px] leading-relaxed text-muted-foreground">
                Masuk untuk melanjutkan perjalanan kamu dalam mengatur keuangan
                dengan lebih mudah.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  Email
                </Label>

                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  className="h-11 rounded-xl text-sm"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">
                  Password
                </Label>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="h-11 rounded-xl pr-11 text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full rounded-xl text-sm font-semibold"
              >
                {isLoading ? (
                  "Memproses..."
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="ml-1 size-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />

              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                atau
              </span>

              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Security */}
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="size-3.5 text-gold" />

              <span className="text-[10px] text-muted-foreground">
                Data kamu aman dan terlindungi
              </span>
            </div>

            {/* Register */}
            <p className="mt-5 text-center text-xs text-muted-foreground">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="font-semibold text-primary hover:underline"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </section>

        {/* =====================================================
            RIGHT SIDE
        ===================================================== */}
        <section className="relative hidden h-full overflow-hidden bg-primary lg:block">
          {/* Background */}
          <div className="absolute inset-0">
            <div className="absolute -right-32 -top-32 size-[420px] rounded-full bg-white/10 blur-3xl" />

            <div className="absolute -bottom-40 -left-32 size-[420px] rounded-full bg-black/10 blur-3xl" />

            <div className="absolute left-1/2 top-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
          </div>

          <div className="relative z-10 flex h-full flex-col px-10 py-8 xl:px-14">
            {/* Right Heading */}
            <div className="mx-auto w-full max-w-[650px]">
              <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.25em] text-white/60">
                Smart money management
              </p>

              <h2 className="font-display text-[32px] font-bold leading-[1.1] tracking-tight text-white xl:text-[38px]">
                Control your finances.
                <br />
                <span className="text-white/65">Build better habits.</span>
              </h2>

              <p className="mt-3 max-w-[430px] text-xs leading-relaxed text-white/60">
                Pantau pemasukan, pengeluaran, budget, dan tabungan kamu dalam
                satu dashboard yang sederhana.
              </p>
            </div>

            {/* Dashboard */}
            <div className="relative mx-auto mt-7 w-full max-w-[650px] flex-1">
              {/* Shadow */}
              <div className="absolute bottom-0 left-1/2 h-[80%] w-[90%] -translate-x-1/2 rounded-3xl bg-black/20 blur-2xl" />

              {/* Browser */}
              <div className="relative h-[min(58vh,500px)] overflow-hidden rounded-2xl border border-white/25 bg-background shadow-2xl">
                {/* Browser header */}
                <div className="flex h-8 items-center border-b border-border bg-muted/50 px-3">
                  <div className="flex gap-1">
                    <span className="size-1.5 rounded-full bg-red-300" />
                    <span className="size-1.5 rounded-full bg-yellow-300" />
                    <span className="size-1.5 rounded-full bg-green-300" />
                  </div>

                  <div className="mx-auto rounded bg-background px-12 py-1">
                    <span className="text-[6px] text-muted-foreground">
                      moneytracker.app
                    </span>
                  </div>
                </div>

                {/* Dashboard */}
                <div className="flex h-[calc(100%-32px)]">
                  {/* Sidebar */}
                  <aside className="hidden w-[105px] shrink-0 border-r border-border p-3 sm:block">
                    <div className="mb-6 flex items-center gap-1.5">
                      <div className="size-4 rounded bg-primary" />

                      <span className="text-[8px] font-bold">Money</span>
                    </div>

                    <div className="space-y-1">
                      {[
                        "Overview",
                        "Wallet",
                        "Transactions",
                        "Budget",
                        "Savings",
                      ].map((item, index) => (
                        <div
                          key={item}
                          className={`rounded px-2 py-1.5 ${
                            index === 0 ? "bg-primary/10" : ""
                          }`}
                        >
                          <span
                            className={`text-[7px] ${
                              index === 0
                                ? "font-medium text-primary"
                                : "text-muted-foreground"
                            }`}
                          >
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </aside>

                  {/* Content */}
                  <div className="min-w-0 flex-1 overflow-hidden p-4">
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-[6px] text-muted-foreground">
                          Overview
                        </p>

                        <p className="text-xs font-bold">Dashboard</p>
                      </div>

                      <div className="size-5 rounded-full bg-muted" />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-border p-2.5">
                        <Wallet className="mb-2 size-3 text-primary" />

                        <p className="text-[6px] text-muted-foreground">
                          Balance
                        </p>

                        <p className="mt-0.5 text-[10px] font-bold">
                          Rp 8.450K
                        </p>
                      </div>

                      <div className="rounded-lg border border-border p-2.5">
                        <TrendingUp className="mb-2 size-3 text-emerald-500" />

                        <p className="text-[6px] text-muted-foreground">
                          Income
                        </p>

                        <p className="mt-0.5 text-[10px] font-bold">
                          Rp 5.200K
                        </p>
                      </div>

                      <div className="rounded-lg border border-border p-2.5">
                        <TrendingDown className="mb-2 size-3 text-red-500" />

                        <p className="text-[6px] text-muted-foreground">
                          Expense
                        </p>

                        <p className="mt-0.5 text-[10px] font-bold">
                          Rp 1.850K
                        </p>
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="mt-2 grid grid-cols-[1.6fr_1fr] gap-2">
                      <div className="rounded-lg border border-border p-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[7px] font-semibold">
                              Cash Flow
                            </p>

                            <p className="text-[5px] text-muted-foreground">
                              Monthly overview
                            </p>
                          </div>
                        </div>

                        <div className="relative mt-3 h-[105px]">
                          <div className="absolute inset-0 flex flex-col justify-between">
                            <span className="border-t border-border/50" />
                            <span className="border-t border-border/50" />
                            <span className="border-t border-border/50" />
                            <span className="border-t border-border/50" />
                          </div>

                          <svg
                            viewBox="0 0 500 120"
                            className="absolute inset-0 h-full w-full"
                            preserveAspectRatio="none"
                          >
                            <polyline
                              points="0,90 45,75 90,82 135,45 180,60 225,35 270,52 315,25 360,42 405,18 450,35 500,12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              className="text-primary"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Budget */}
                      <div className="rounded-lg border border-border p-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[7px] font-semibold">Budget</p>

                          <PieChart className="size-3 text-muted-foreground" />
                        </div>

                        <div className="mt-4 flex justify-center">
                          <div className="relative flex size-[70px] items-center justify-center rounded-full border-[8px] border-primary/15">
                            <div className="absolute inset-[-8px] rounded-full border-[8px] border-transparent border-l-primary border-t-primary" />

                            <div className="text-center">
                              <p className="text-xs font-bold">72%</p>

                              <p className="text-[5px] text-muted-foreground">
                                used
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-[6px]">Food</span>

                            <span className="text-[6px] font-semibold">
                              Rp 850K
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-[6px]">Transport</span>

                            <span className="text-[6px] font-semibold">
                              Rp 420K
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transactions */}
                    <div className="mt-2 rounded-lg border border-border p-2.5">
                      <div className="mb-2 flex justify-between">
                        <p className="text-[7px] font-semibold">
                          Recent Transactions
                        </p>

                        <span className="text-[6px] text-primary">
                          View all
                        </span>
                      </div>

                      {[
                        ["Gaji Bulanan", "+ Rp 5.000K", true],
                        ["Makan Siang", "- Rp 35K", false],
                        ["Transportasi", "- Rp 18K", false],
                      ].map(([name, amount, income]) => (
                        <div
                          key={name}
                          className="flex items-center justify-between py-1"
                        >
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`flex size-4 items-center justify-center rounded-full ${
                                income ? "bg-emerald-500/10" : "bg-red-500/10"
                              }`}
                            >
                              {income ? (
                                <ArrowUpRight className="size-2 text-emerald-500" />
                              ) : (
                                <ArrowDownRight className="size-2 text-red-500" />
                              )}
                            </div>

                            <span className="text-[6px]">{name}</span>
                          </div>

                          <span
                            className={`text-[6px] font-semibold ${
                              income ? "text-emerald-500" : "text-red-500"
                            }`}
                          >
                            {amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[9px] text-white/40">
                Track • Plan • Save
              </span>

              <span className="text-[9px] text-white/40">
                Your money, your control.
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
