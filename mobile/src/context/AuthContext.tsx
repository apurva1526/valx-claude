import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Profile } from "../api/auth";

const TOKEN_KEY = "valx_token";

interface AuthContextValue {
  isLoading: boolean;
  token: string | null;
  activeProfile: Profile | null;
  userName: string | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  setActiveProfile: (profile: Profile) => void;
  setUserName: (name: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY).then((stored) => {
      setToken(stored);
      setIsLoading(false);
    });
  }, []);

  const signIn = async (newToken: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    setToken(newToken);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setActiveProfile(null);
    setUserName(null);
  };

  const value = useMemo(
    () => ({ isLoading, token, activeProfile, userName, signIn, signOut, setActiveProfile, setUserName }),
    [isLoading, token, activeProfile, userName]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
