import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { BuyerGroupDetail, getGroupDetail, GroupSupplier, removeSupplier } from "../api/groups";

export default function GroupSuppliersScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const { token, activeProfile } = useAuth();
  const [group, setGroup] = useState<BuyerGroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<GroupSupplier | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const canManage = activeProfile?.access === "OWNER" || activeProfile?.access === "MANAGE";
  const auth = { token: token!, profileId: activeProfile!.id };

  const load = useCallback(() => {
    setIsLoading(true);
    getGroupDetail(auth, groupId)
      .then(({ group }) => setGroup(group as BuyerGroupDetail))
      .catch((err) => Alert.alert("Couldn't load suppliers", err.message ?? "Please try again"))
      .finally(() => setIsLoading(false));
  }, [token, activeProfile, groupId]);

  useFocusEffect(load);

  const handleRemove = () => {
    if (!selected) return;
    const supplier = selected;
    Alert.alert("Remove supplier", `Remove ${supplier.contactName ?? supplier.phoneNumber} from this group?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setIsRemoving(true);
          try {
            await removeSupplier(auth, groupId, supplier.id);
            setSelected(null);
            load();
          } catch (err: any) {
            Alert.alert("Couldn't remove supplier", err.message ?? "Please try again");
          } finally {
            setIsRemoving(false);
          }
        },
      },
    ]);
  };

  const statusFor = (item: GroupSupplier) => {
    if (item.supplierProfile?.deactivatedAt) return "Inactive";
    if (item.supplierProfileId) return "On ValX";
    return "Pending";
  };

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
        {canManage ? (
          <TouchableOpacity onPress={() => navigation.navigate("AddSuppliers", { groupId })}>
            <Text style={styles.addLink}>+ Add</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      <FlatList
        contentInsetAdjustmentBehavior="never"
        style={styles.body}
        data={group.suppliers}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No suppliers added yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.supplierRow} onPress={() => setSelected(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.supplierName}>{item.contactName ?? item.phoneNumber}</Text>
              <Text style={[styles.supplierMeta, item.supplierProfile?.deactivatedAt && styles.supplierMetaInactive]}>
                {item.phoneNumber} · {statusFor(item)}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setSelected(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <Text style={styles.sheetTitle}>{selected?.contactName ?? selected?.phoneNumber}</Text>
            <Text style={styles.sheetSubtitle}>{selected?.phoneNumber}</Text>
            <Text style={[styles.sheetStatus, selected?.supplierProfile?.deactivatedAt && styles.sheetStatusInactive]}>
              {selected?.supplierProfile?.deactivatedAt
                ? "Inactive (profile deactivated)"
                : selected?.supplierProfileId
                  ? "On ValX"
                  : "Hasn't joined ValX yet"}
            </Text>

            {canManage && (
              <TouchableOpacity style={styles.removeButton} onPress={handleRemove} disabled={isRemoving}>
                {isRemoving ? <ActivityIndicator color="#B00020" /> : <Text style={styles.removeButtonText}>Remove from group</Text>}
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={() => setSelected(null)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  supplierName: { fontSize: 15, fontWeight: "600" },
  supplierMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  supplierMetaInactive: { color: "#B00020" },
  chevron: { color: "#ccc", fontSize: 20 },
  emptyText: { color: "#888", marginTop: 12 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 },
  sheetTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  sheetSubtitle: { fontSize: 13, color: "#888", textAlign: "center", marginTop: 4 },
  sheetStatus: { fontSize: 13, color: "#128C7E", textAlign: "center", marginTop: 8, marginBottom: 20 },
  sheetStatusInactive: { color: "#B00020" },
  removeButton: { borderRadius: 8, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#B00020" },
  removeButtonText: { color: "#B00020", fontWeight: "600" },
  cancelButton: { marginTop: 12, borderRadius: 8, padding: 14, alignItems: "center", backgroundColor: "#eee" },
  cancelButtonText: { color: "#333", fontWeight: "600" },
});
