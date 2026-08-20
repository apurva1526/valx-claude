import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
  listTeamMembers,
  removeTeamMember,
  TeamMember,
  TeamMemberAccessLevel,
  TeamOwner,
  updateTeamMember,
} from "../api/teamMembers";

const LEVELS: TeamMemberAccessLevel[] = ["VIEW", "EDIT", "MANAGE"];

export default function TeamMembersScreen({ route, navigation }: any) {
  const { groupId } = route.params ?? {};
  const { token, activeProfile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [owner, setOwner] = useState<TeamOwner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const auth = { token: token!, profileId: activeProfile!.id };

  const load = useCallback(() => {
    setIsLoading(true);
    listTeamMembers(auth, activeProfile!.id)
      .then(({ teamMembers, owner }) => {
        setTeamMembers(teamMembers);
        setOwner(owner);
      })
      .catch((err) => Alert.alert("Couldn't load team members", err.message ?? "Please try again"))
      .finally(() => setIsLoading(false));
  }, [token, activeProfile]);

  useFocusEffect(load);

  const visibleTeamMembers = useMemo(
    () => (groupId ? teamMembers.filter((tm) => !tm.scopeGroupId || tm.scopeGroupId === groupId) : teamMembers),
    [teamMembers, groupId]
  );

  const handleChangeLevel = async (level: TeamMemberAccessLevel) => {
    if (!selected || level === selected.accessLevel) return;
    setIsSaving(true);
    try {
      await updateTeamMember(auth, selected.id, { accessLevel: level });
      setSelected(null);
      load();
    } catch (err: any) {
      Alert.alert("Couldn't update access", err.message ?? "Please try again");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = () => {
    if (!selected) return;
    const member = selected;
    Alert.alert("Remove team member", `Remove ${member.contactName ?? member.phoneNumber}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setSelected(null);
          removeTeamMember(auth, member.id)
            .then(load)
            .catch((err) => Alert.alert("Couldn't remove", err.message ?? "Please try again"));
        },
      },
    ]);
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
        <Text style={styles.headerTitle}>Team Members</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AddTeamMember", { groupId })}>
          <Text style={styles.addLink}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        contentInsetAdjustmentBehavior="never"
        style={styles.list}
        data={visibleTeamMembers}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          owner ? (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{owner.name ?? owner.phoneNumber}</Text>
                <Text style={styles.meta}>{owner.phoneNumber} · Owner</Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No team members yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => setSelected(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.user?.name ?? item.contactName ?? item.phoneNumber}</Text>
              <Text style={styles.meta}>
                {item.phoneNumber} · {item.accessLevel}
                {item.scopeGroupId ? " · this group only" : " · all groups"}
                {!item.userId ? " · pending" : ""}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setSelected(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <Text style={styles.sheetTitle}>{selected?.user?.name ?? selected?.contactName ?? selected?.phoneNumber}</Text>
            <Text style={styles.sheetSubtitle}>{selected?.phoneNumber}</Text>

            <Text style={styles.sectionLabel}>Access Level</Text>
            {LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.levelOption, selected?.accessLevel === level && styles.levelOptionActive]}
                onPress={() => handleChangeLevel(level)}
                disabled={isSaving}
              >
                <Text style={[styles.levelText, selected?.accessLevel === level && styles.levelTextActive]}>{level}</Text>
                {selected?.accessLevel === level && <Text style={styles.levelCheck}>✓</Text>}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.removeButton} onPress={handleRemove} disabled={isSaving}>
              <Text style={styles.removeButtonText}>Remove from team</Text>
            </TouchableOpacity>

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
  list: { padding: 16 },
  emptyText: { color: "#888", textAlign: "center", marginTop: 32 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  name: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, color: "#888", marginTop: 2 },
  chevron: { color: "#ccc", fontSize: 20 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 },
  sheetTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  sheetSubtitle: { fontSize: 13, color: "#888", textAlign: "center", marginBottom: 20 },
  sectionLabel: { fontSize: 12, color: "#888", fontWeight: "600", marginBottom: 8 },
  levelOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  levelOptionActive: { borderColor: "#128C7E", backgroundColor: "#F0FBF9" },
  levelText: { fontSize: 15, fontWeight: "600", color: "#333" },
  levelTextActive: { color: "#128C7E" },
  levelCheck: { color: "#128C7E", fontWeight: "700" },
  removeButton: { marginTop: 16, borderRadius: 8, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#B00020" },
  removeButtonText: { color: "#B00020", fontWeight: "600" },
  cancelButton: { marginTop: 12, borderRadius: 8, padding: 14, alignItems: "center", backgroundColor: "#eee" },
  cancelButtonText: { color: "#333", fontWeight: "600" },
});
