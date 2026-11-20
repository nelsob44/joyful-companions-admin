import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount rendered components and reset storage between tests.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
