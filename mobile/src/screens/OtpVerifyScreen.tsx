import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { getMyProfiles, requestOtp, verifyOtp } from "../api/auth";
import { useAuth } from "../context/AuthContext";

const RESEND_COOLDOWN_SECONDS = 30;

export default function OtpVerifyScreen({ route, navigation }: any) {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const { signIn, setActiveProfile, setUserName, setUserPhoneNumber } = useAuth();

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await requestOtp(phoneNumber);
      setOtp("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      Alert.alert("OTP sent", `A new code was sent to ${phoneNumber}`);
    } catch (err: any) {
      Alert.alert("Couldn't resend OTP", err.message ?? "Please try again");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    if (otp.trim().length !== 6) {
      Alert.alert("Enter the 6-digit code");
      return;
    }
    setIsSubmitting(true);
    try {
      const { token } = await verifyOtp(phoneNumber, otp.trim());
      await signIn(token);

      const { profiles, name, phoneNumber: verifiedPhoneNumber } = await getMyProfiles(token);
      setUserName(name);
      setUserPhoneNumber(verifiedPhoneNumber);
      setActiveProfile(profiles.length > 0 ? profiles[0] : null);
      // RootNavigator swaps to the right screen automatically based on profiles/name.
    } catch (err: any) {
      Alert.alert("Verification failed", err.message ?? "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Sent to {phoneNumber}</Text>
        <TextInput
          style={styles.input}
          placeholder="6-digit code"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          autoFocus
        />
        <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={isResending || cooldown > 0}>
          {isResending ? (
            <ActivityIndicator color="#128C7E" />
          ) : (
            <Text style={[styles.resendText, cooldown > 0 && styles.resendTextDisabled]}>
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 24, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16, textAlign: "center", letterSpacing: 8 },
  button: { backgroundColor: "#128C7E", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  resendButton: { marginTop: 16, alignItems: "center", padding: 8 },
  resendText: { color: "#128C7E", fontSize: 14, fontWeight: "600" },
  resendTextDisabled: { color: "#999" },
});
