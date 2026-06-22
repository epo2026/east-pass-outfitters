// Admin authentication for the dashboard.
//
// SANDBOX NOTE: localStorage/cookies are blocked in the deployed iframe, so the
// session token is kept in a module-level variable + React state. It survives
// in-app navigation but NOT a hard page refresh (you'll be asked to log in
// again). In production this should be swapped for an httpOnly cookie session.

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

// Module-level token so non-React helpers (adminRequest) can read it too.
let adminToken: string | null = null;

export function getAdminToken(): string | null {
  return adminToken;
}

/**
 * Authenticated fetch for admin endpoints. Attaches the Bearer token and
 * throws on non-2xx with the server's error message.
 */
export async function adminRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (data !== undefined) headers["Content-Type"] = "application/json";
  if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.clone().json();
      msg = j.message || msg;
    } catch {
      /* ignore */
    }
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res;
}

interface AdminContextValue {
  isAuthed: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState<boolean>(!!adminToken);

  const login = useCallback(async (password: string) => {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      let msg = "Incorrect password";
      try {
        msg = (await res.json()).message || msg;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    const { token } = await res.json();
    adminToken = token;
    setIsAuthed(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/admin/logout`, {
        method: "POST",
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      });
    } catch {
      /* ignore */
    }
    adminToken = null;
    setIsAuthed(false);
  }, []);

  return (
    <AdminContext.Provider value={{ isAuthed, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
