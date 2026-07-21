import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";

export default function ProfileScreen() {
  const { activeProfile, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Profile</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.avatarRow}>
          <Avatar label={activeProfile?.companyName ?? "?"} size={64} />
          <View style={styles.avatarText}>
            <Text style={styles.companyName}>{activeProfile?.companyName}</Text>
            <Text style={styles.profileType}>
              {activeProfile?.profileType === "BUYER" ? "Buyer" : "Supplier"}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Phone Number</Text>
          <Text style={styles.value}>{activeProfile?.phoneNumber}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>GST Number</Text>
          <Text style={styles.value}>{activeProfile?.gstNumber ?? "Not set"}</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  body: { padding: 20 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
  avatarText: { flex: 1 },
  companyName: { fontSize: 18, fontWeight: "700" },
  profileType: { fontSize: 13, color: "#128C7E", fontWeight: "600", marginTop: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  label: { fontSize: 14, color: "#888" },
  value: { fontSize: 14, fontWeight: "600" },
  logoutButton: { marginTop: 32, backgroundColor: "#eee", borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  logoutText: { color: "#333", fontWeight: "600" },
});
