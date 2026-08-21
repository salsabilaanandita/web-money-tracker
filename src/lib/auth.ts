import Cookies from "js-cookie";

const TOKEN_KEY = "token";

// JWT backend berlaku 24 jam, jadi cookie ikut expire 1 hari
export function setToken(token: string) {
  Cookies.set(TOKEN_KEY, token, { expires: 1, path: "/" });
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function removeToken() {
  Cookies.remove(TOKEN_KEY, { path: "/" });
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
