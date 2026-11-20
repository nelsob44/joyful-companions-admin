import { render, screen } from "@testing-library/react";
import { useContext } from "react";
import { describe, expect, it } from "vitest";
import {
  ADMIN_TOKEN_KEY,
  LEGACY_ADMIN_TOKEN_KEY,
} from "../../constants/storageKeys";
import AdminContextProvider, { AdminContext } from "../AdminContext";

const TokenProbe = () => {
  const { adminToken } = useContext(AdminContext);
  return <p data-testid="token">{adminToken}</p>;
};

const renderProvider = () =>
  render(
    <AdminContextProvider>
      <TokenProbe />
    </AdminContextProvider>,
  );

describe("storage keys", () => {
  it("pins the exact key names (renaming them would log admins out or skip the cleanup)", () => {
    expect(ADMIN_TOKEN_KEY).toBe("adminToken");
    expect(LEGACY_ADMIN_TOKEN_KEY).toBe("AdminToken");
  });
});

describe("AdminContextProvider – startup", () => {
  it("removes the token stored under the old key", () => {
    localStorage.setItem(LEGACY_ADMIN_TOKEN_KEY, "stale-token");

    renderProvider();

    expect(localStorage.getItem(LEGACY_ADMIN_TOKEN_KEY)).toBeNull();
    // The old token must not be used to log the admin in.
    expect(screen.getByTestId("token")).toBeEmptyDOMElement();
  });

  it("keeps the token stored under the current key and logs the admin in", () => {
    localStorage.setItem(ADMIN_TOKEN_KEY, "current-token");

    renderProvider();

    expect(localStorage.getItem(ADMIN_TOKEN_KEY)).toBe("current-token");
    expect(screen.getByTestId("token")).toHaveTextContent("current-token");
  });

  it("removes only the old key when both keys are present", () => {
    localStorage.setItem(LEGACY_ADMIN_TOKEN_KEY, "stale-token");
    localStorage.setItem(ADMIN_TOKEN_KEY, "current-token");

    renderProvider();

    expect(localStorage.getItem(LEGACY_ADMIN_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(ADMIN_TOKEN_KEY)).toBe("current-token");
    expect(screen.getByTestId("token")).toHaveTextContent("current-token");
  });

  it("leaves unrelated localStorage entries alone", () => {
    localStorage.setItem("someOtherKey", "keep-me");
    localStorage.setItem(LEGACY_ADMIN_TOKEN_KEY, "stale-token");

    renderProvider();

    expect(localStorage.getItem("someOtherKey")).toBe("keep-me");
    expect(localStorage.length).toBe(1);
  });

  it("starts logged out when nothing is stored", () => {
    renderProvider();

    expect(screen.getByTestId("token")).toBeEmptyDOMElement();
    expect(localStorage.length).toBe(0);
  });
});
