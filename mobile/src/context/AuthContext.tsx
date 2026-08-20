import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Profile } from "../api/auth";

const TOKEN_KEY = "valx_token";
const LAST_PROFILE_KEY = "valx_last_active_profile_id";

interface AuthContextValue {
  isLoading: boolean;
  token: string | null;
  activeProfile: Profile | null;
  userName: string | null;
  userPhoneNumber: string | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  setActiveProfile: (profile: Profile | null) => void;
  setUserName: (name: string | null) => void;
  setUserPhoneNumber: (phoneNumber: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string | null>(null);

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
    await SecureStore.deleteItemAsync(LAST_PROFILE_KEY);
    setToken(null);
    setActiveProfileState(null);
    setUserName(null);
    setUserPhoneNumber(null);
  };

  const chooseActiveProfile = (profile: Profile | null) => {
    setActiveProfileState(profile);
    if (profile) {
      SecureStore.setItemAsync(LAST_PROFILE_KEY, profile.id).catch(() => {});
    }
  };

  const value = useMemo(
    () => ({
      isLoading,
      token,
      activeProfile,
      userName,
      userPhoneNumber,
      signIn,
      signOut,
      setActiveProfile: chooseActiveProfile,
      setUserName,
      setUserPhoneNumber,
    }),
    [isLoading, token, activeProfile, userName, userPhoneNumber]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function getLastActiveProfileId(): Promise<string | null> {
  return SecureStore.getItemAsync(LAST_PROFILE_KEY);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
