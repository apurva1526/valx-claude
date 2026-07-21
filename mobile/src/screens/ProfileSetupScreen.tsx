import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { createProfile, ProfileType } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import CompanyProfileFields from "../components/CompanyProfileFields";

export default function ProfileSetupScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [profileType, setProfileType] = useState<ProfileType>("BUYER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token, setActiveProfile, setUserName } = useAuth();

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
      setUserName(name.trim());
      // RootNavigator swaps to the main app automatically once `activeProfile`/`userName` are set.
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

      <CompanyProfileFields
        companyName={companyName}
        onCompanyNameChange={setCompanyName}
        gstNumber={gstNumber}
        onGstNumberChange={setGstNumber}
        profileType={profileType}
        onProfileTypeChange={setProfileType}
      />

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
  button: { backgroundColor: "#128C7E", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
