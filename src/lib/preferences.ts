import Cookies from "js-cookie";

const PRIVATE_MODE_KEY = "private_mode";
const HIDE_BALANCE_KEY = "hide_balance";

export function getPrivateMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return Cookies.get(PRIVATE_MODE_KEY) === "true";
}

export function setPrivateMode(value: boolean) {
  Cookies.set(PRIVATE_MODE_KEY, String(value), {
    expires: 30,
    path: "/",
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("private-mode-change", {
        detail: value,
      })
    );
  }
}

export function getHideBalance(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return Cookies.get(HIDE_BALANCE_KEY) === "true";
}

export function setHideBalance(value: boolean) {
  Cookies.set(HIDE_BALANCE_KEY, String(value), {
    expires: 30,
    path: "/",
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("hide-balance-change", {
        detail: value,
      })
    );
  }
}