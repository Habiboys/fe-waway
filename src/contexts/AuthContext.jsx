import { useCallback, useEffect, useMemo, useState } from "react";
import { setCurrentOrganizationId } from "../lib/organization";
import { clearToken, getToken, setToken } from "../lib/token";
import { authService } from "../services/authService";
import { AuthContext } from "./authContextStore";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootLoading, setIsBootLoading] = useState(true);

  const bootstrapSession = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setIsBootLoading(false);
      return;
    }

    try {
      const me = await authService.me();
      setUser(me);
      setCurrentOrganizationId(me.organization_id || null);
    } catch {
      clearToken();
      setUser(null);
      setCurrentOrganizationId(null);
    } finally {
      setIsBootLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      bootstrapSession();
    }, 0);

    return () => clearTimeout(timer);
  }, [bootstrapSession]);

  const login = useCallback(async (payload) => {
    const data = await authService.login(payload);
    setToken(data.token);
    setUser(data.user);
    setCurrentOrganizationId(data.user?.organization_id || null);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // silent fail on logout endpoint
    } finally {
      clearToken();
      setUser(null);
      setCurrentOrganizationId(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootLoading,
      login,
      register,
      logout,
      refreshUser: bootstrapSession,
    }),
    [bootstrapSession, isBootLoading, login, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
