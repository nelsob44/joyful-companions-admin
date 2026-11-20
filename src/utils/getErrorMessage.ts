/** Returns a readable message from a value caught in a `catch` block. */
export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
