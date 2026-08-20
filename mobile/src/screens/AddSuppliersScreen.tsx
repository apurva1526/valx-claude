import React, { useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { addSuppliers } from "../api/groups";
import { useContactsPicker } from "../hooks/useContactsPicker";

export default function AddSuppliersScreen({ route, navigation }: any) {
  const { groupId, fromCreate } = route.params;
  const { token, activeProfile } = useAuth();
  const { isLoadingContacts, permissionDenied, search, setSearch, filtered, selected, toggle, selectedContacts } =
    useContactsPicker();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const finish = () => {
    if (fromCreate) {
      navigation.replace("GroupDetail", { groupId });
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert("Select at least one contact");
      return;
    }
    setIsSubmitting(true);
    try {
      const { skipped } = await addSuppliers(
        { token: token!, profileId: activeProfile!.id },
        groupId,
        selectedContacts.map((c) => ({ phoneNumber: c.phoneNumber, name: c.name }))
      );
      if (skipped.length > 0) {
        Alert.alert(
          "Some contacts weren't added",
          skipped.map((s) => `${s.phoneNumber}: ${s.reason}`).join("\n"),
          [{ text: "OK", onPress: finish }]
        );
      } else {
        finish();
      }
    } catch (err: any) {
      Alert.alert("Couldn't add suppliers", err.message ?? "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingContacts) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>
          ValX needs access to your contacts to add suppliers. Enable it in Settings and try again.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={finish}>
          <Text style={styles.back}>{fromCreate ? "Skip" : "‹ Cancel"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Suppliers</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator /> : <Text style={styles.done}>Add ({selected.size})</Text>}
        </TouchableOpacity>
      </View>

      <TextInput style={styles.search} placeholder="Search contacts" value={search} onChangeText={setSearch} />

      <FlatList
        contentInsetAdjustmentBehavior="never"
        data={filtered}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.emptyText}>No contacts with phone numbers found.</Text>}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          return (
            <TouchableOpacity style={styles.row} onPress={() => toggle(item.id)}>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowPhone}>{item.phoneNumber}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  permissionText: { textAlign: "center", color: "#555" },
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
  search: {
    margin: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#128C7E",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: { backgroundColor: "#128C7E" },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: "700" },
  rowName: { fontSize: 15, fontWeight: "600" },
  rowPhone: { fontSize: 13, color: "#888" },
  emptyText: { color: "#888", textAlign: "center", marginTop: 32 },
});
