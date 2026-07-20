import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { getMyProfiles } from "../api/auth";
import PhoneEntryScreen from "../screens/PhoneEntryScreen";
import OtpVerifyScreen from "../screens/OtpVerifyScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";
import HomeScreen from "../screens/HomeScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isLoading, token, activeProfile, setActiveProfile } = useAuth();
  const [isRestoringProfile, setIsRestoringProfile] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      setIsRestoringProfile(false);
      return;
    }
    getMyProfiles(token)
      .then(({ profiles }) => {
        if (profiles.length > 0) setActiveProfile(profiles[0]);
      })
      .finally(() => setIsRestoringProfile(false));
  }, [isLoading, token]);

  if (isLoading || isRestoringProfile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
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
          <Stack.Screen name="Home" component={HomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
