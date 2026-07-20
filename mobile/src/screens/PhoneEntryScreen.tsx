import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { requestOtp } from "../api/auth";

export default function PhoneEntryScreen({ navigation }: any) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGetOtp = async () => {
    if (phoneNumber.trim().length < 10) {
      Alert.alert("Enter a valid phone number");
      return;
    }
    setIsSubmitting(true);
    try {
      await requestOtp(phoneNumber.trim());
      navigation.navigate("OtpVerify", { phoneNumber: phoneNumber.trim() });
    } catch (err: any) {
      Alert.alert("Couldn't send OTP", err.message ?? "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ValX</Text>
      <Text style={styles.subtitle}>Enter your phone number</Text>
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        autoFocus
      />
      <TouchableOpacity style={styles.button} onPress={handleGetOtp} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get OTP</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 24, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: "#128C7E", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
