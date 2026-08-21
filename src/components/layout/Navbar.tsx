"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { menuItems, useLogout } from "@/components/layout/Sidebar";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const handleLogout = useLogout();

  return (
    <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex min-w-0 items-center gap-2">
        <span className="size-2 shrink-0 rotate-45 rounded-[2px] bg-gold" />
        <span className="truncate font-sans text-base font-semibold">
          Money Tracker
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-xl"
        aria-label="Buka menu navigasi"
      >
        <Menu className="size-5" />
        <span className="sr-only">Buka menu</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-3 max-h-[calc(100dvh-1.5rem)] max-w-[calc(100%-1.5rem)] translate-y-0 overflow-y-auto rounded-2xl p-5 sm:max-w-[calc(100%-2rem)]">
          <DialogTitle className="pr-8 text-lg">Menu navigasi</DialogTitle>
          <DialogDescription className="sr-only">
            Navigasi halaman Money Tracker
          </DialogDescription>
          <nav className="mt-2 flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                    isActive
                      ? "bg-secondary font-medium text-secondary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Button
              variant="ghost"
              className="mt-2 justify-start gap-3 text-muted-foreground"
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </Button>
          </nav>
        </DialogContent>
      </Dialog>
    </header>
  );
}
