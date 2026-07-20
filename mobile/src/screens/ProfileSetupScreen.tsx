import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { createProfile, ProfileType } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function ProfileSetupScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [profileType, setProfileType] = useState<ProfileType>("BUYER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token, setActiveProfile } = useAuth();

  const handleSubmit = async () => {
    if (!name.trim() || !companyName.trim()) {
      Alert.alert("Name and Company Name are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const { profile } = await createProfile(token!, {
        name: name.trim(),
        companyName: companyName.trim(),
        profileType,
        gstNumber: gstNumber.trim() || undefined,
      });
      setActiveProfile(profile);
      // RootNavigator swaps to Home automatically once `activeProfile` is set.
    } catch (err: any) {
      Alert.alert("Couldn't create profile", err.message ?? "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete your profile</Text>

      <TextInput style={styles.input} placeholder="Your name" value={name} onChangeText={setName} autoFocus />
      <TextInput style={styles.input} placeholder="Company name" value={companyName} onChangeText={setCompanyName} />
      <TextInput style={styles.input} placeholder="GST number (optional)" value={gstNumber} onChangeText={setGstNumber} />

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, profileType === "BUYER" && styles.toggleButtonActive]}
          onPress={() => setProfileType("BUYER")}
        >
          <Text style={[styles.toggleText, profileType === "BUYER" && styles.toggleTextActive]}>Buyer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, profileType === "SUPPLIER" && styles.toggleButtonActive]}
          onPress={() => setProfileType("SUPPLIER")}
        >
          <Text style={[styles.toggleText, profileType === "SUPPLIER" && styles.toggleTextActive]}>Supplier</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 24, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 },
  toggleRow: { flexDirection: "row", marginBottom: 24, gap: 12 },
  toggleButton: { flex: 1, borderWidth: 1, borderColor: "#128C7E", borderRadius: 8, padding: 12, alignItems: "center" },
  toggleButtonActive: { backgroundColor: "#128C7E" },
  toggleText: { color: "#128C7E", fontWeight: "600" },
  toggleTextActive: { color: "#fff" },
  button: { backgroundColor: "#128C7E", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
