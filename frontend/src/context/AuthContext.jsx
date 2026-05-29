import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  getStoredUser,
  login as loginRequest,
  logout as logoutRequest,
} from "../services/authService.js";
import { getStoredToken } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(token));

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      if (!token) {
        setIsCheckingSession(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();

        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        logoutRequest();

        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function login(email, password) {
    const result = await loginRequest(email, password);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }

  function logout() {
    logoutRequest();
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      isCheckingSession,
      login,
      logout,
      token,
      user,
    }),
    [isCheckingSession, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
