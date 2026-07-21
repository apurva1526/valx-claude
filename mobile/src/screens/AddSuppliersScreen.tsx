import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Contacts from "expo-contacts";
import { useAuth } from "../context/AuthContext";
import { addSuppliers } from "../api/groups";

interface ContactEntry {
  id: string;
  name: string;
  phoneNumber: string;
}

export default function AddSuppliersScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const { token, activeProfile } = useAuth();
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        setPermissionDenied(true);
        setIsLoadingContacts(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
      const entries: ContactEntry[] = data
        .filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0 && c.name)
        .map((c) => ({
          id: c.id!,
          name: c.name!,
          phoneNumber: c.phoneNumbers![0].number!.replace(/[\s\-()]/g, ""),
        }));
      setContacts(entries);
      setIsLoadingContacts(false);
    })();
  }, []);

  const filtered = useMemo(
    () => contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [contacts, search]
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    const chosen = contacts.filter((c) => selected.has(c.id));
    if (chosen.length === 0) {
      Alert.alert("Select at least one contact");
      return;
    }
    setIsSubmitting(true);
    try {
      await addSuppliers(
        { token: token!, profileId: activeProfile!.id },
        groupId,
        chosen.map((c) => ({ phoneNumber: c.phoneNumber, name: c.name }))
      );
      navigation.goBack();
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{"‹ Cancel"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Suppliers</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator /> : <Text style={styles.done}>Add ({selected.size})</Text>}
        </TouchableOpacity>
      </View>

      <TextInput style={styles.search} placeholder="Search contacts" value={search} onChangeText={setSearch} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
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
