export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  email: string;
  password: string;
  password_confirmation: string;
  name: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
}
