import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getMyProfiles, verifyOtp } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function OtpVerifyScreen({ route, navigation }: any) {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, setActiveProfile } = useAuth();

  const handleVerify = async () => {
    if (otp.trim().length !== 4) {
      Alert.alert("Enter the 4-digit code");
      return;
    }
    setIsSubmitting(true);
    try {
      const { token } = await verifyOtp(phoneNumber, otp.trim());
      await signIn(token);

      const { profiles } = await getMyProfiles(token);
      if (profiles.length > 0) {
        setActiveProfile(profiles[0]);
      }
      // No profile yet -> RootNavigator swaps to ProfileSetup automatically once `token` is set.
    } catch (err: any) {
      Alert.alert("Verification failed", err.message ?? "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>Sent to {phoneNumber} (dev code: 1234)</Text>
      <TextInput
        style={styles.input}
        placeholder="4-digit code"
        keyboardType="number-pad"
        maxLength={4}
        value={otp}
        onChangeText={setOtp}
        autoFocus
      />
      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 24, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16, textAlign: "center", letterSpacing: 8 },
  button: { backgroundColor: "#128C7E", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
