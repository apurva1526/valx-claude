import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { BuyerGroupDetail, getGroupDetail, SupplierGroupDetail } from "../api/groups";

export default function GroupDetailScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const { token, activeProfile } = useAuth();
  const [group, setGroup] = useState<BuyerGroupDetail | SupplierGroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isBuyer = activeProfile?.profileType === "BUYER";

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      getGroupDetail({ token: token!, profileId: activeProfile!.id }, groupId)
        .then(({ group }) => setGroup(group))
        .catch((err) => Alert.alert("Couldn't load group", err.message ?? "Please try again"))
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

  const buyerGroup = group as BuyerGroupDetail;
  const supplierGroup = group as SupplierGroupDetail;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{"‹ Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{group.name}</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.body}>
        {group.description ? <Text style={styles.description}>{group.description}</Text> : null}
        <Text style={styles.meta}>
          {isBuyer ? `Owned by ${activeProfile?.companyName}` : `Buyer: ${supplierGroup.buyerCompanyName}`}
        </Text>

        {isBuyer && (
          <>
            <View style={styles.rosterHeader}>
              <Text style={styles.rosterTitle}>Suppliers ({buyerGroup.suppliers.length})</Text>
              <TouchableOpacity onPress={() => navigation.navigate("AddSuppliers", { groupId })}>
                <Text style={styles.addLink}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={buyerGroup.suppliers}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text style={styles.emptyText}>No suppliers added yet.</Text>}
              renderItem={({ item }) => (
                <View style={styles.supplierRow}>
                  <Text style={styles.supplierName}>{item.contactName ?? item.phoneNumber}</Text>
                  <Text style={styles.supplierStatus}>{item.supplierProfileId ? "On ValX" : "Pending"}</Text>
                </View>
              )}
            />
          </>
        )}
      </View>
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
  back: { color: "#128C7E", fontWeight: "600", width: 50 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  body: { padding: 16, flex: 1 },
  description: { fontSize: 14, color: "#555", marginBottom: 8 },
  meta: { fontSize: 13, color: "#888", marginBottom: 20 },
  rosterHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  rosterTitle: { fontSize: 15, fontWeight: "700" },
  addLink: { color: "#128C7E", fontWeight: "600" },
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
