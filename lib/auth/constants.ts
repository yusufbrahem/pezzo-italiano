// Kept in its own file (no other imports) so proxy.ts can read the cookie
// name without pulling the DB client into its bundle.
export const SESSION_COOKIE = "pi_admin_session";
