import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { createProfile, ProfileType } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import CompanyProfileFields from "../components/CompanyProfileFields";

export default function AddProfileScreen({ navigation }: any) {
  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [profileType, setProfileType] = useState<ProfileType>("BUYER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token, setActiveProfile } = useAuth();

  const handleSubmit = async () => {
    if (!companyName.trim()) {
      Alert.alert("Company name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const { profile } = await createProfile(token!, {
        companyName: companyName.trim(),
        profileType,
        gstNumber: gstNumber.trim() || undefined,
      });
      setActiveProfile(profile);
      navigation.popToTop();
    } catch (err: any) {
      Alert.alert("Couldn't create profile", err.message ?? "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{"‹ Cancel"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Profile</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.body}>
        <CompanyProfileFields
          companyName={companyName}
          onCompanyNameChange={setCompanyName}
          gstNumber={gstNumber}
          onGstNumberChange={setGstNumber}
          profileType={profileType}
          onProfileTypeChange={setProfileType}
          autoFocusCompanyName
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Profile</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  back: { color: "#128C7E", fontWeight: "600" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  body: { padding: 24 },
  button: { backgroundColor: "#128C7E", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
