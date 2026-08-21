import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { setMyName, updateProfile } from "../api/auth";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";

export default function EditProfileScreen({ navigation }: any) {
  const { token, activeProfile, setActiveProfile, userName, setUserName } = useAuth();
  const [name, setName] = useState(userName ?? "");
  const [companyName, setCompanyName] = useState(activeProfile?.companyName ?? "");
  const [gstNumber, setGstNumber] = useState(activeProfile?.gstNumber ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (name.trim().length === 0) {
      Alert.alert("Your name is required");
      return;
    }
    if (companyName.trim().length === 0) {
      Alert.alert("Company name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const auth = { token: token!, profileId: activeProfile!.id };
      const [{ profile }] = await Promise.all([
        updateProfile(auth, activeProfile!.id, {
          companyName: companyName.trim(),
          gstNumber: gstNumber.trim(),
        }),
        name.trim() !== userName ? setMyName(token!, name.trim()) : Promise.resolve(),
      ]);
      setActiveProfile({ ...activeProfile!, companyName: profile.companyName, gstNumber: profile.gstNumber });
      setUserName(name.trim());
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Couldn't save", err.message ?? "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingScreen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{"‹ Cancel"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator /> : <Text style={styles.done}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <TextInput style={styles.input} placeholder="Your name" value={name} onChangeText={setName} autoFocus />
        <TextInput style={styles.input} placeholder="Company name" value={companyName} onChangeText={setCompanyName} />
        <TextInput style={styles.input} placeholder="GST number (optional)" value={gstNumber} onChangeText={setGstNumber} />
      </ScrollView>
    </KeyboardAvoidingScreen>
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
  done: { color: "#128C7E", fontWeight: "700" },
  body: { padding: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 },
});
