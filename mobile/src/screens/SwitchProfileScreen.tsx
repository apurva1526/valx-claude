import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getMyProfiles, Profile, switchProfile } from "../api/auth";
import Avatar from "../components/Avatar";

export default function SwitchProfileScreen({ navigation }: any) {
  const { token, activeProfile, setActiveProfile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    getMyProfiles(token!)
      .then(({ profiles }) => setProfiles(profiles))
      .catch((err) => Alert.alert("Couldn't load profiles", err.message ?? "Please try again"))
      .finally(() => setIsLoading(false));
  }, [token]);

  useFocusEffect(load);

  const handleSwitch = async (profile: Profile) => {
    if (profile.id === activeProfile?.id) return;
    setIsSwitching(profile.id);
    try {
      const { profile: switched } = await switchProfile(token!, profile.id);
      setActiveProfile(switched);
      navigation.popToTop();
    } catch (err: any) {
      Alert.alert("Couldn't switch profile", err.message ?? "Please try again");
    } finally {
      setIsSwitching(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{"‹ Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Switch Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AddProfile")}>
          <Text style={styles.addLink}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        contentInsetAdjustmentBehavior="never"
        style={styles.list}
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isActive = item.id === activeProfile?.id;
          return (
            <TouchableOpacity
              style={[styles.row, isActive && styles.rowActive]}
              onPress={() => handleSwitch(item)}
              disabled={isSwitching !== null}
            >
              <Avatar label={item.companyName} />
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{item.companyName}</Text>
                <Text style={styles.rowMeta}>
                  {item.profileType === "BUYER" ? "Buyer" : "Supplier"}
                  {item.access !== "OWNER" ? ` · ${item.access}` : ""}
                </Text>
              </View>
              {isSwitching === item.id ? (
                <ActivityIndicator />
              ) : (
                isActive && <Text style={styles.activeLabel}>Active</Text>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  addLink: { color: "#128C7E", fontWeight: "600" },
  list: { padding: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
    gap: 12,
  },
  rowActive: { borderColor: "#128C7E", backgroundColor: "#F0FBF9" },
  rowText: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: "600" },
  rowMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  activeLabel: { color: "#128C7E", fontWeight: "700", fontSize: 12 },
});
