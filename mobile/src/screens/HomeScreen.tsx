import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function HomeScreen() {
  const { activeProfile, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You're logged in</Text>
      {activeProfile && (
        <Text style={styles.subtitle}>
          {activeProfile.companyName} · {activeProfile.profileType === "BUYER" ? "Buyer" : "Supplier"}
        </Text>
      )}
      <Text style={styles.note}>Groups, Bids, and everything else start in Step 2+.</Text>
      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#333", marginBottom: 24 },
  note: { fontSize: 13, color: "#888", marginBottom: 32, textAlign: "center" },
  button: { backgroundColor: "#eee", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  buttonText: { color: "#333", fontSize: 15, fontWeight: "600" },
});
