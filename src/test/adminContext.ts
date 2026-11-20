import { vi } from "vitest";
import type { AdminContextValue } from "../types/admin";

/**
 * Builds a complete AdminContext value for tests, with mock functions for
 * every action. Pass only the fields a test cares about as `overrides`.
 */
export const createAdminContextValue = (
  overrides: Partial<AdminContextValue> = {},
): AdminContextValue => ({
  adminToken: "",
  setAdminToken: vi.fn(),
  backendUrl: "http://api.test",
  companions: [],
  getAllCompanions: vi.fn().mockResolvedValue(undefined),
  changeAvailability: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});
