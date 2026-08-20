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
  View,
} from "react-native";
import { createProfile, DeactivatedProfile, getMyProfiles, ProfileType, reactivateProfile } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import CompanyProfileFields from "../components/CompanyProfileFields";
import Avatar from "../components/Avatar";

export default function ProfileSetupScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [profileType, setProfileType] = useState<ProfileType>("BUYER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deactivatedProfiles, setDeactivatedProfiles] = useState<DeactivatedProfile[]>([]);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [knownName, setKnownName] = useState<string | null>(null);
  const { token, setActiveProfile, setUserName, setUserPhoneNumber, signOut } = useAuth();

  useEffect(() => {
    getMyProfiles(token!)
      .then(({ deactivatedProfiles, name, phoneNumber }) => {
        setDeactivatedProfiles(deactivatedProfiles);
        setKnownName(name);
        setUserPhoneNumber(phoneNumber);
      })
      .catch(() => {});
  }, [token]);

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
      setActiveProfile({ ...profile, access: "OWNER", scopeGroupId: null });
      setUserName(name.trim());
      // RootNavigator swaps to the main app automatically once `activeProfile`/`userName` are set.
    } catch (err: any) {
      Alert.alert("Couldn't create profile", err.message ?? "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivate = async (profile: DeactivatedProfile) => {
    setReactivatingId(profile.id);
    try {
      const { profile: reactivated } = await reactivateProfile(token!, profile.id);
      setActiveProfile({ ...reactivated, access: "OWNER", scopeGroupId: null });
      if (knownName) setUserName(knownName);
      // RootNavigator swaps to the main app automatically once `activeProfile` is set.
    } catch (err: any) {
      Alert.alert("Couldn't reactivate profile", err.message ?? "Please try again");
    } finally {
      setReactivatingId(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {deactivatedProfiles.length > 0 && (
          <View style={styles.reactivateSection}>
            <Text style={styles.reactivateTitle}>Reactivate a previous profile</Text>
            {deactivatedProfiles.map((profile) => (
              <TouchableOpacity
                key={profile.id}
                style={styles.reactivateRow}
                onPress={() => handleReactivate(profile)}
                disabled={reactivatingId !== null}
              >
                <Avatar label={profile.companyName} />
                <View style={styles.reactivateRowText}>
                  <Text style={styles.reactivateRowName}>{profile.companyName}</Text>
                  <Text style={styles.reactivateRowMeta}>
                    {profile.profileType === "BUYER" ? "Buyer" : "Supplier"}
                  </Text>
                </View>
                {reactivatingId === profile.id ? <ActivityIndicator /> : <Text style={styles.reactivateLink}>Reactivate</Text>}
              </TouchableOpacity>
            ))}
            <Text style={styles.orDivider}>— or create a new profile —</Text>
          </View>
        )}

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

        <TouchableOpacity style={styles.logoutLink} onPress={() => signOut()}>
          <Text style={styles.logoutLinkText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 24, textAlign: "center" },
  logoutLink: { marginTop: 20, alignItems: "center" },
  logoutLinkText: { color: "#888", fontWeight: "600", fontSize: 13 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: "#128C7E", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  reactivateSection: { marginBottom: 24 },
  reactivateTitle: { fontSize: 14, fontWeight: "700", color: "#333", marginBottom: 12, textAlign: "center" },
  reactivateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    marginBottom: 8,
  },
  reactivateRowText: { flex: 1 },
  reactivateRowName: { fontSize: 15, fontWeight: "600" },
  reactivateRowMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  reactivateLink: { color: "#128C7E", fontWeight: "700" },
  orDivider: { textAlign: "center", color: "#aaa", fontSize: 12, marginTop: 8, marginBottom: 4 },
});
