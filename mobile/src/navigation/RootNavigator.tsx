import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import { getLastActiveProfileId, useAuth } from "../context/AuthContext";
import { getMyProfiles } from "../api/auth";
import { ApiError } from "../api/client";
import { registerForPushNotificationsAsync } from "../lib/pushNotifications";
import { registerPushToken } from "../api/pushTokens";
import { navigateToBidFromNotification, navigationRef } from "./navigationRef";
import PhoneEntryScreen from "../screens/PhoneEntryScreen";
import OtpVerifyScreen from "../screens/OtpVerifyScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";
import NameSetupScreen from "../screens/NameSetupScreen";
import MainTabNavigator from "./MainTabNavigator";

const Stack = createNativeStackNavigator();

// Matches the android.intentFilters host in app.json + the verified assetlinks.json at
// www.valx.co.in. No path-based screen mapping yet — this just lets the OS hand the app
// these URLs instead of opening a browser; add a `config` here once specific pages
// (e.g. /bid/:id) need to deep-link to a particular screen.
const linking = {
  prefixes: ["https://www.valx.co.in"],
};

export default function RootNavigator() {
  const { isLoading, token, activeProfile, userName, setActiveProfile, setUserName, setUserPhoneNumber, signOut } = useAuth();
  const [isRestoringProfile, setIsRestoringProfile] = useState(true);
  const [hasProfiles, setHasProfiles] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateToBidFromNotification(response.notification.request.content.data ?? {});
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!token || !activeProfile) return;
    registerForPushNotificationsAsync()
      .then((pushToken) => {
        if (pushToken) {
          registerPushToken({ token, profileId: activeProfile.id }, pushToken).catch(() => {});
        }
      })
      .catch(() => {});
  }, [token, activeProfile?.id]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      setIsRestoringProfile(false);
      return;
    }
    setIsRestoringProfile(true);
    setRestoreError(null);
    Promise.all([getMyProfiles(token), getLastActiveProfileId()])
      .then(([{ profiles, name, phoneNumber }, lastProfileId]) => {
        setHasProfiles(profiles.length > 0);
        setUserName(name);
        setUserPhoneNumber(phoneNumber);
        if (profiles.length > 0) {
          const restored = profiles.find((p) => p.id === lastProfileId) ?? profiles[0];
          setActiveProfile(restored);
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          return;
        }
        setRestoreError(err.message ?? "Couldn't reach the server");
      })
      .finally(() => setIsRestoringProfile(false));
  }, [isLoading, token, retryCount]);

  const retry = useCallback(() => setRetryCount((n) => n + 1), []);

  if (isLoading || isRestoringProfile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (restoreError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ textAlign: "center", marginBottom: 16, color: "#555" }}>{restoreError}</Text>
        <TouchableOpacity onPress={retry} style={{ backgroundColor: "#128C7E", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 }}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      {!token ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
          <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
        </Stack.Navigator>
      ) : !hasProfiles && !activeProfile ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        </Stack.Navigator>
      ) : !userName ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="NameSetup" component={NameSetupScreen} />
        </Stack.Navigator>
      ) : (
        <MainTabNavigator />
      )}
    </NavigationContainer>
  );
}
