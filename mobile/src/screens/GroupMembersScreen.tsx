import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getGroupMembers, GroupMemberView, GroupMembers } from "../api/groups";
import Avatar from "../components/Avatar";

function MemberRow({ label, meta }: { label: string; meta: string }) {
  return (
    <View style={styles.row}>
      <Avatar label={label} />
      <View style={styles.rowText}>
        <Text style={styles.rowName}>{label}</Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
    </View>
  );
}

export default function GroupMembersScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const { token, activeProfile } = useAuth();
  const [members, setMembers] = useState<GroupMembers | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    setIsLoading(true);
    getGroupMembers({ token: token!, profileId: activeProfile!.id }, groupId)
      .then(setMembers)
      .catch((err) => Alert.alert("Couldn't load members", err.message ?? "Please try again"))
      .finally(() => setIsLoading(false));
  }, [token, activeProfile, groupId]);

  useFocusEffect(load);

  const metaFor = (m: GroupMemberView) => `${m.accessLevel}${m.pending ? " · pending" : ""}`;

  if (isLoading || !members) {
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
        <Text style={styles.headerTitle}>Group Members</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionLabel}>Buyer</Text>
        <MemberRow label={members.buyer.ownerName ?? members.buyer.companyName} meta={members.buyer.companyName} />
        {members.buyerTeamMembers.map((m, i) => (
          <MemberRow key={`buyer-team-${i}`} label={m.name} meta={metaFor(m)} />
        ))}

        <Text style={styles.sectionLabel}>Your Team</Text>
        {members.myTeamMembers.length === 0 ? (
          <Text style={styles.emptyText}>No team members with access to this group.</Text>
        ) : (
          members.myTeamMembers.map((m, i) => <MemberRow key={`my-team-${i}`} label={m.name} meta={metaFor(m)} />)
        )}

        <Text style={styles.footnote}>Other suppliers in this group are kept private and aren't shown here.</Text>
      </ScrollView>
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
  body: { padding: 16 },
  sectionLabel: { fontSize: 12, color: "#888", fontWeight: "700", marginTop: 16, marginBottom: 8, textTransform: "uppercase" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 12 },
  rowText: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: "600" },
  rowMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  emptyText: { color: "#888", fontSize: 13 },
  footnote: { color: "#aaa", fontSize: 12, textAlign: "center", marginTop: 32, fontStyle: "italic" },
});
