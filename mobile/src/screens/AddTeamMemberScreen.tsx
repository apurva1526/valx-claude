import React, { useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { addTeamMember, TeamMemberAccessLevel } from "../api/teamMembers";
import { useContactsPicker } from "../hooks/useContactsPicker";

const LEVELS: TeamMemberAccessLevel[] = ["VIEW", "EDIT", "MANAGE"];

export default function AddTeamMemberScreen({ route, navigation }: any) {
  const { groupId } = route.params ?? {};
  const { token, activeProfile } = useAuth();
  const { isLoadingContacts, permissionDenied, search, setSearch, filtered, selected, toggle, selectedContacts } =
    useContactsPicker();
  const [accessLevel, setAccessLevel] = useState<TeamMemberAccessLevel>("MANAGE");
  const [scopeToGroup, setScopeToGroup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert("Select a contact");
      return;
    }
    const contact = selectedContacts[0];
    setIsSubmitting(true);
    try {
      await addTeamMember({ token: token!, profileId: activeProfile!.id }, activeProfile!.id, {
        phoneNumber: contact.phoneNumber,
        name: contact.name,
        accessLevel,
        scopeGroupId: scopeToGroup ? groupId : undefined,
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Couldn't add team member", err.message ?? "Please try again");
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
          ValX needs access to your contacts to add a team member. Enable it in Settings and try again.
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
        <Text style={styles.headerTitle}>Add Team Member</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator /> : <Text style={styles.done}>Add</Text>}
        </TouchableOpacity>
      </View>

      <TextInput style={styles.search} placeholder="Search contacts" value={search} onChangeText={setSearch} />

      <View style={styles.optionsBlock}>
        <Text style={styles.optionsLabel}>Access Level</Text>
        <View style={styles.levelRow}>
          {LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.levelOption, accessLevel === level && styles.levelOptionActive]}
              onPress={() => setAccessLevel(level)}
            >
              <Text style={[styles.levelText, accessLevel === level && styles.levelTextActive]}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {groupId && (
          <TouchableOpacity style={styles.scopeRow} onPress={() => setScopeToGroup((v) => !v)}>
            <View style={[styles.checkbox, scopeToGroup && styles.checkboxChecked]}>
              {scopeToGroup && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.scopeLabel}>Limit to this group only</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        contentInsetAdjustmentBehavior="never"
        data={filtered}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.emptyText}>No contacts with phone numbers found.</Text>}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          return (
            <TouchableOpacity style={styles.row} onPress={() => toggle(item.id, true)}>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
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
  search: { marginHorizontal: 16, marginTop: 16, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, fontSize: 15 },
  optionsBlock: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  optionsLabel: { fontSize: 12, color: "#888", marginBottom: 6, fontWeight: "600" },
  levelRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  levelOption: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#128C7E", alignItems: "center" },
  levelOptionActive: { backgroundColor: "#128C7E" },
  levelText: { color: "#128C7E", fontWeight: "600", fontSize: 13 },
  levelTextActive: { color: "#fff" },
  scopeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: "#128C7E", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#128C7E" },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "700" },
  scopeLabel: { fontSize: 13, color: "#333" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#128C7E",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: "#128C7E" },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#128C7E" },
  rowName: { fontSize: 15, fontWeight: "600" },
  rowPhone: { fontSize: 13, color: "#888" },
  emptyText: { color: "#888", textAlign: "center", marginTop: 32 },
});
