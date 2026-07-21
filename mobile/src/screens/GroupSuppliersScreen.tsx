import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { BuyerGroupDetail, getGroupDetail } from "../api/groups";

export default function GroupSuppliersScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const { token, activeProfile } = useAuth();
  const [group, setGroup] = useState<BuyerGroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      getGroupDetail({ token: token!, profileId: activeProfile!.id }, groupId)
        .then(({ group }) => setGroup(group as BuyerGroupDetail))
        .catch((err) => Alert.alert("Couldn't load suppliers", err.message ?? "Please try again"))
        .finally(() => setIsLoading(false));
    }, [token, activeProfile, groupId])
  );

  if (isLoading || !group) {
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
        <Text style={styles.headerTitle}>Suppliers</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AddSuppliers", { groupId })}>
          <Text style={styles.addLink}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.body}
        data={group.suppliers}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No suppliers added yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.supplierRow}>
            <Text style={styles.supplierName}>{item.contactName ?? item.phoneNumber}</Text>
            <Text style={styles.supplierStatus}>{item.supplierProfileId ? "On ValX" : "Pending"}</Text>
          </View>
        )}
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
  body: { padding: 16 },
  supplierRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  supplierName: { fontSize: 15 },
  supplierStatus: { fontSize: 12, color: "#888" },
  emptyText: { color: "#888", marginTop: 12 },
});
