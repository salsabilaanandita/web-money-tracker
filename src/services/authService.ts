import axios from "axios";
import apiClient from "@/lib/apiClient";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  message?: string;
  token?: string;
  user?: unknown;
}

// ===============================
// REGISTER
// ===============================
export async function register(
  payload: RegisterPayload
): Promise<AuthResponse> {
  try {
    console.log("========== REGISTER ==========");
    console.log(
      "PAYLOAD:",
      JSON.stringify(payload, null, 2)
    );

    const res = await apiClient.post<AuthResponse>(
      "/auth/register",
      payload
    );

    console.log("STATUS:", res.status);
    console.log(
      "RESPONSE:",
      JSON.stringify(res.data, null, 2)
    );
    console.log("==============================");

    return res.data;
  } catch (error: unknown) {
    console.error("========== REGISTER ERROR ==========");

    if (axios.isAxiosError(error)) {
      console.error("STATUS:", error.response?.status);

      console.error(
        "DATA:",
        JSON.stringify(
          error.response?.data,
          null,
          2
        )
      );

      console.error(
        "HEADERS:",
        JSON.stringify(
          error.response?.headers,
          null,
          2
        )
      );

      console.error(
        "URL:",
        error.config?.url
      );

      console.error(
        "BASE URL:",
        error.config?.baseURL
      );

      console.error(
        "PAYLOAD:",
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      console.error(
        "MESSAGE:",
        error.message
      );
    } else if (error instanceof Error) {
      console.error(
        "ERROR:",
        error.message
      );
    } else {
      console.error(
        "UNKNOWN ERROR:",
        error
      );
    }

    console.error(
      "===================================="
    );

    throw error;
  }
}

// ===============================
// LOGIN
// ===============================
export async function login(
  payload: LoginPayload
): Promise<AuthResponse> {
  try {
    console.log("============ LOGIN ============");

    console.log(
      "PAYLOAD:",
      JSON.stringify(payload, null, 2)
    );

    const res = await apiClient.post<AuthResponse>(
      "/auth/login",
      payload
    );

    console.log("STATUS:", res.status);

    console.log(
      "RESPONSE:",
      JSON.stringify(res.data, null, 2)
    );

    console.log("===============================");

    return res.data;
  } catch (error: unknown) {
    console.error("============ LOGIN ERROR ============");

    if (axios.isAxiosError(error)) {
      console.error(
        "STATUS:",
        error.response?.status
      );

      console.error(
        "DATA:",
        JSON.stringify(
          error.response?.data,
          null,
          2
        )
      );

      console.error(
        "URL:",
        error.config?.url
      );

      console.error(
        "BASE URL:",
        error.config?.baseURL
      );

      console.error(
        "PAYLOAD:",
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      console.error(
        "MESSAGE:",
        error.message
      );
    } else if (error instanceof Error) {
      console.error(
        "ERROR:",
        error.message
      );
    } else {
      console.error(
        "UNKNOWN ERROR:",
        error
      );
    }

    console.error(
      "======================================"
    );

    throw error;
  }
}