import axios from "axios";

import { getToken } from "@/lib/auth";

import { User } from "@/types/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* =====================================================
   ERROR HANDLER
===================================================== */

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Terjadi kesalahan pada server"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan";
}

/* =====================================================
   AUTH HEADERS
===================================================== */

function getHeaders() {
  const token = getToken();

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/* =====================================================
   GET PROFILE
   GET /profile
===================================================== */

export async function getProfile(): Promise<User> {
  try {
    const response = await axios.get(
      `${API_URL}/profile`,
      {
        headers: getHeaders(),
      }
    );

    return (
      response.data?.data ??
      response.data
    );
  } catch (error) {
    console.error(
      "GET /profile error:",
      error
    );

    throw new Error(
      getErrorMessage(error)
    );
  }
}

/* =====================================================
   UPDATE PROFILE
   PUT /profile
===================================================== */

export async function updateProfile(
  payload: {
    name: string;
  }
): Promise<User> {
  try {
    const response = await axios.put(
      `${API_URL}/profile`,
      payload,
      {
        headers: getHeaders(),
      }
    );

    return (
      response.data?.data ??
      response.data
    );
  } catch (error) {
    console.error(
      "PUT /profile error:",
      error
    );

    throw new Error(
      getErrorMessage(error)
    );
  }
}

/* =====================================================
   CHANGE PASSWORD
   PUT /profile/password
===================================================== */

export async function changePassword(
  payload: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }
): Promise<void> {
  try {
    await axios.put(
      `${API_URL}/profile/password`,
      payload,
      {
        headers: getHeaders(),
      }
    );
  } catch (error) {
    console.error(
      "PUT /profile/password error:",
      error
    );

    throw new Error(
      getErrorMessage(error)
    );
  }
}

/* =====================================================
   UPLOAD AVATAR
   POST /profile/avatar
===================================================== */

export async function uploadAvatar(
  file: File
): Promise<User> {
  try {
    const token = getToken();

    const formData = new FormData();

    formData.append(
      "avatar",
      file
    );

    const response = await axios.post(
      `${API_URL}/profile/avatar`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return (
      response.data?.data ??
      response.data?.user ??
      response.data
    );
  } catch (error) {
    console.error(
      "POST /profile/avatar error:",
      error
    );

    throw new Error(
      getErrorMessage(error)
    );
  }
}