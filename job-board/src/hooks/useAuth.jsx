import React, { createContext, useContext, useMemo, useState } from "react";
import { api } from "../lib/api.js";

const AuthCtx = createContext(null);

function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1] || ""));
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("jb_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (username, password) => {
    const { token } = await api("/api/auth/login", {
      method: "POST",
      body: { username, password },
    });
    const payload = decodeJwt(token);
    const info = {
      token,
      username: payload.username,
      role: payload.role,
      id: payload.id,
    };
    localStorage.setItem("jb_user", JSON.stringify(info));
    setUser(info); // <-- triggers app-wide re-render immediately
  };

  const register = async (form) => {
    await api("/api/auth/register", { method: "POST", body: form });
  };

  const logout = () => {
    localStorage.removeItem("jb_user");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token: user?.token ?? null,
      role: user?.role ?? null,
      login,
      register,
      logout,
    }),
    [user]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export default function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
