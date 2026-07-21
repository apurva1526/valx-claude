import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { listTeamMembers, removeTeamMember, TeamMember } from "../api/teamMembers";

export default function TeamMembersScreen({ route, navigation }: any) {
  const { groupId } = route.params ?? {};
  const { token, activeProfile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const auth = { token: token!, profileId: activeProfile!.id };

  const load = useCallback(() => {
    setIsLoading(true);
    listTeamMembers(auth, activeProfile!.id)
      .then(({ teamMembers }) => setTeamMembers(teamMembers))
      .catch((err) => Alert.alert("Couldn't load team members", err.message ?? "Please try again"))
      .finally(() => setIsLoading(false));
  }, [token, activeProfile]);

  useFocusEffect(load);

  const handleRemove = (teamMember: TeamMember) => {
    Alert.alert("Remove team member", `Remove ${teamMember.contactName ?? teamMember.phoneNumber}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          removeTeamMember(auth, teamMember.id)
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
        style={styles.list}
        data={teamMembers}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No team members yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.user?.name ?? item.contactName ?? item.phoneNumber}</Text>
              <Text style={styles.meta}>
                {item.phoneNumber} · {item.accessLevel}
                {item.scopeGroupId ? " · this group only" : " · all groups"}
                {!item.userId ? " · pending" : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleRemove(item)}>
              <Text style={styles.removeLink}>Remove</Text>
            </TouchableOpacity>
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
  removeLink: { color: "#B00020", fontWeight: "600" },
});
