import { createContext, startTransition, useContext, useEffect, useState } from "react";

import authService from "../services/authService";

const TOKEN_KEY = "heartlink_chat_token";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const restoreSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getMe();

        if (!ignore) {
          startTransition(() => {
            setUser(response.user);
          });
        }
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY);

        if (!ignore) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      ignore = true;
    };
  }, [token]);

  const establishSession = (response) => {
    localStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);

    startTransition(() => {
      setUser(response.user);
    });
  };

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    establishSession(response);
    return response;
  };

  const register = async (payload) => {
    const response = await authService.register(payload);
    establishSession(response);
    return response;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
