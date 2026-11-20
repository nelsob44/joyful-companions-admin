import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { useContext } from "react";
import { toast } from "react-toastify";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Navbar from "../../components/Navbar";
import { ADMIN_TOKEN_KEY } from "../../constants/storageKeys";
import { createAdminContextValue } from "../../test/adminContext";
import AdminContextProvider, { AdminContext } from "../../context/AdminContext";
import Login from "../Login";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));
vi.mock("react-toastify", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const mockedPost = vi.mocked(axios.post);
const BACKEND_URL = "http://api.test";

const renderLogin = () => {
  const setAdminToken = vi.fn();
  const utils = render(
    <AdminContext.Provider
      value={createAdminContextValue({ setAdminToken, backendUrl: BACKEND_URL })}
    >
      <Login />
    </AdminContext.Provider>,
  );
  return { ...utils, setAdminToken, user: userEvent.setup() };
};

// The inputs have no associated <label>, so look them up by type.
const getEmailInput = () => screen.getByRole("textbox") as HTMLInputElement;
const getPasswordInput = () =>
  document.querySelector('input[type="password"]') as HTMLInputElement;
const getLoginButton = () => screen.getByRole("button", { name: "Login" });
const getForm = () => document.querySelector("form") as HTMLFormElement;

const fillCredentials = async (
  user: ReturnType<typeof userEvent.setup>,
  email = "admin@example.com",
  password = "Secret$123",
) => {
  await user.type(getEmailInput(), email);
  await user.type(getPasswordInput(), password);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Login – rendering", () => {
  it("shows the Admin login form by default", () => {
    renderLogin();

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText(/Login$/, { selector: "p" })).toHaveTextContent(
      "Admin Login",
    );
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(getLoginButton()).toBeInTheDocument();
    expect(screen.getByText(/Companion Login\?/)).toBeInTheDocument();
  });

  it("renders an email input and a masked password input, both required", () => {
    renderLogin();

    expect(getEmailInput()).toHaveAttribute("type", "email");
    expect(getEmailInput()).toBeRequired();
    expect(getPasswordInput()).toHaveAttribute("type", "password");
    expect(getPasswordInput()).toBeRequired();
  });

  it("starts with empty inputs and reflects what the user types", async () => {
    const { user } = renderLogin();

    expect(getEmailInput()).toHaveValue("");
    expect(getPasswordInput()).toHaveValue("");

    await fillCredentials(user, "someone@example.com", "pa55word");

    expect(getEmailInput()).toHaveValue("someone@example.com");
    expect(getPasswordInput()).toHaveValue("pa55word");
  });
});

describe("Login – switching between Admin and Companion", () => {
  it("switches to Companion login and back to Admin login", async () => {
    const { user } = renderLogin();

    await user.click(screen.getByText("Click here"));
    expect(screen.getByText("Companion")).toBeInTheDocument();
    expect(screen.getByText(/Admin Login\?/)).toBeInTheDocument();
    expect(screen.queryByText(/Companion Login\?/)).not.toBeInTheDocument();

    await user.click(screen.getByText("Click here"));
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText(/Companion Login\?/)).toBeInTheDocument();
    expect(screen.queryByText(/Admin Login\?/)).not.toBeInTheDocument();
  });

  it("keeps the typed credentials when switching modes", async () => {
    const { user } = renderLogin();
    await fillCredentials(user, "keep@example.com", "keepme");

    await user.click(screen.getByText("Click here"));

    expect(getEmailInput()).toHaveValue("keep@example.com");
    expect(getPasswordInput()).toHaveValue("keepme");
  });
});

describe("Login – Admin submission", () => {
  it("prevents the browser's default form submission", () => {
    mockedPost.mockResolvedValue({ data: { success: false, message: "x" } });
    renderLogin();

    // fireEvent returns false when preventDefault() was called.
    expect(fireEvent.submit(getForm())).toBe(false);
  });

  it("posts the credentials to the admin login endpoint", async () => {
    mockedPost.mockResolvedValue({ data: { success: true, token: "tok" } });
    const { user } = renderLogin();
    await fillCredentials(user, "admin@example.com", "Secret$123");

    await user.click(getLoginButton());

    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(mockedPost).toHaveBeenCalledWith(`${BACKEND_URL}/api/admin/login`, {
      email: "admin@example.com",
      password: "Secret$123",
    });
  });

  it("submits when Enter is pressed in the password field", async () => {
    mockedPost.mockResolvedValue({ data: { success: true, token: "tok" } });
    const { user } = renderLogin();
    await fillCredentials(user);

    await user.type(getPasswordInput(), "{Enter}");

    expect(mockedPost).toHaveBeenCalledTimes(1);
  });

  it("on success, saves the token to localStorage and updates the context", async () => {
    mockedPost.mockResolvedValue({ data: { success: true, token: "abc123" } });
    const { user, setAdminToken } = renderLogin();
    await fillCredentials(user);

    await user.click(getLoginButton());

    await waitFor(() => expect(setAdminToken).toHaveBeenCalledWith("abc123"));
    expect(setAdminToken).toHaveBeenCalledTimes(1);
    // Must match the key AdminContext reads and Navbar removes.
    expect(localStorage.getItem(ADMIN_TOKEN_KEY)).toBe("abc123");
    expect(localStorage.length).toBe(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("on failure, shows the server's error message and does not log in", async () => {
    mockedPost.mockResolvedValue({
      data: { success: false, message: "Invalid credentials" },
    });
    const { user, setAdminToken } = renderLogin();
    await fillCredentials(user, "admin@example.com", "wrong");

    await user.click(getLoginButton());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Invalid credentials"),
    );
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(setAdminToken).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
  });

  it("on a network error, does not log in and does not throw (error is currently swallowed silently)", async () => {
    mockedPost.mockRejectedValue(new Error("Network Error"));
    const { user, setAdminToken } = renderLogin();
    await fillCredentials(user);

    await user.click(getLoginButton());

    await waitFor(() => expect(mockedPost).toHaveBeenCalledTimes(1));
    expect(setAdminToken).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    // Login.tsx has an empty catch block, so the user gets no feedback.
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("does not submit when the required fields are empty", async () => {
    const { user } = renderLogin();

    await user.click(getLoginButton());

    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("does not submit when the email is not a valid email address", async () => {
    const { user } = renderLogin();
    await fillCredentials(user, "not-an-email", "Secret$123");

    await user.click(getLoginButton());

    expect(mockedPost).not.toHaveBeenCalled();
  });
});

describe("Login – Companion submission", () => {
  it("does not call the API or log in (Companion login is not implemented yet)", async () => {
    const { user, setAdminToken } = renderLogin();
    await user.click(screen.getByText("Click here"));
    await fillCredentials(user);

    await user.click(getLoginButton());

    expect(mockedPost).not.toHaveBeenCalled();
    expect(setAdminToken).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
  });
});

describe("Login – with the real AdminContextProvider", () => {
  const TokenProbe = () => {
    const { adminToken } = useContext(AdminContext);
    return <p data-testid="token">{adminToken}</p>;
  };

  it("builds the login URL from VITE_BACKEND_URL and updates the provider's token", async () => {
    vi.stubEnv("VITE_BACKEND_URL", BACKEND_URL);
    mockedPost.mockResolvedValue({ data: { success: true, token: "live-token" } });
    const user = userEvent.setup();
    render(
      <AdminContextProvider>
        <Login />
        <TokenProbe />
      </AdminContextProvider>,
    );
    await fillCredentials(user);

    await user.click(getLoginButton());

    expect(mockedPost).toHaveBeenCalledWith(
      `${BACKEND_URL}/api/admin/login`,
      expect.any(Object),
    );
    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("live-token"),
    );
    vi.unstubAllEnvs();
  });

  // Regression tests: Login.tsx used to store the token under "AdminToken"
  // while AdminContext reads (and Navbar removes) "adminToken", so the admin
  // was logged out on every refresh and the token was never cleared on logout.
  it("keeps the admin logged in after a page reload", async () => {
    mockedPost.mockResolvedValue({
      data: { success: true, token: "persisted-token" },
    });
    const user = userEvent.setup();
    const { unmount } = render(
      <AdminContextProvider>
        <Login />
      </AdminContextProvider>,
    );
    await fillCredentials(user);
    await user.click(getLoginButton());
    await waitFor(() => expect(mockedPost).toHaveBeenCalled());
    unmount();

    // Simulate a reload: a fresh provider initialises from localStorage.
    render(
      <AdminContextProvider>
        <TokenProbe />
      </AdminContextProvider>,
    );

    expect(screen.getByTestId("token")).toHaveTextContent("persisted-token");
  });

  it("removes the stored token when the admin logs out", async () => {
    mockedPost.mockResolvedValue({
      data: { success: true, token: "session-token" },
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminContextProvider>
          <Login />
          <Navbar />
          <TokenProbe />
        </AdminContextProvider>
      </MemoryRouter>,
    );
    await fillCredentials(user);
    await user.click(getLoginButton());
    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("session-token"),
    );

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(screen.getByTestId("token")).toBeEmptyDOMElement();
    expect(localStorage.length).toBe(0);
  });
});
