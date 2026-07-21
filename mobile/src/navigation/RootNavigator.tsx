import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { getMyProfiles } from "../api/auth";
import PhoneEntryScreen from "../screens/PhoneEntryScreen";
import OtpVerifyScreen from "../screens/OtpVerifyScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";
import GroupListScreen from "../screens/GroupListScreen";
import CreateGroupScreen from "../screens/CreateGroupScreen";
import GroupDetailScreen from "../screens/GroupDetailScreen";
import GroupSuppliersScreen from "../screens/GroupSuppliersScreen";
import AddSuppliersScreen from "../screens/AddSuppliersScreen";
import CreateBidScreen from "../screens/CreateBidScreen";
import BidDetailScreen from "../screens/BidDetailScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isLoading, token, activeProfile, setActiveProfile } = useAuth();
  const [isRestoringProfile, setIsRestoringProfile] = useState(true);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      setIsRestoringProfile(false);
      return;
    }
    setIsRestoringProfile(true);
    setRestoreError(null);
    getMyProfiles(token)
      .then(({ profiles }) => {
        if (profiles.length > 0) setActiveProfile(profiles[0]);
      })
      .catch((err) => setRestoreError(err.message ?? "Couldn't reach the server"))
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
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <>
            <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
            <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
          </>
        ) : !activeProfile ? (
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        ) : (
          <>
            <Stack.Screen name="GroupList" component={GroupListScreen} />
            <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
            <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
            <Stack.Screen name="GroupSuppliers" component={GroupSuppliersScreen} />
            <Stack.Screen name="AddSuppliers" component={AddSuppliersScreen} />
            <Stack.Screen name="CreateBid" component={CreateBidScreen} />
            <Stack.Screen name="BidDetail" component={BidDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
