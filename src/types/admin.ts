import type { Dispatch, SetStateAction } from "react";

/**
 * Shape of every response from the backend API: either a success payload
 * (with endpoint-specific fields) or a failure with an error message.
 */
export type ApiResponse<T extends object = object> =
  | ({ success: true } & T)
  | { success: false; message: string };

export type LoginResponse = ApiResponse<{ token: string }>;
export type MessageResponse = ApiResponse<{ message: string }>;
export type AllCompanionsResponse = ApiResponse<{ companions: Companion[] }>;

/** A companion as returned by the admin API (the fields this app uses). */
export interface Companion {
  _id: string;
  image: string;
  firstName?: string;
  lastName?: string;
  /** Only on companions created before the name was split in two. */
  name?: string;
  location: string;
  available: boolean;
}

export interface AdminContextValue {
  adminToken: string;
  setAdminToken: Dispatch<SetStateAction<string>>;
  backendUrl: string;
  companions: Companion[];
  getAllCompanions: () => Promise<void>;
  changeAvailability: (compId: string) => Promise<void>;
}
