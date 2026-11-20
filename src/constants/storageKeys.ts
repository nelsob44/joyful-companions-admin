// localStorage key for the admin's auth token. Use this constant everywhere
// the token is read, written or removed so the key can't drift out of sync.
export const ADMIN_TOKEN_KEY = "adminToken";

// Key that older builds of Login.tsx wrote by mistake. Nothing reads it, so
// AdminContextProvider deletes it on startup to clear out the stale token.
export const LEGACY_ADMIN_TOKEN_KEY = "AdminToken";
