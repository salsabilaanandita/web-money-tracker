export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// POST /auth/register -> { "data": User }  (TIDAK ada token)
export interface RegisterResponse {
  data: User;
}

// POST /auth/login -> { "token": string }  (TIDAK ada field user)
export interface LoginResponse {
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  name: string;
}
 
export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
};
 