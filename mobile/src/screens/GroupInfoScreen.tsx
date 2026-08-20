import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { BuyerGroupDetail, getGroupDetail, SupplierGroupDetail } from "../api/groups";
import { exitTeamMembership, listTeamMembers, TeamMember } from "../api/teamMembers";
import { getMyProfiles } from "../api/auth";
import Avatar from "../components/Avatar";

export default function GroupInfoScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const { token, activeProfile, setActiveProfile, signOut } = useAuth();
  const [group, setGroup] = useState<BuyerGroupDetail | SupplierGroupDetail | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const isBuyer = activeProfile?.profileType === "BUYER";
  const isOwner = activeProfile?.access === "OWNER";
  const auth = { token: token!, profileId: activeProfile!.id };

  const load = useCallback(() => {
    setIsLoading(true);
    Promise.all([getGroupDetail(auth, groupId), listTeamMembers(auth, activeProfile!.id)])
      .then(([{ group }, { teamMembers }]) => {
        setGroup(group);
        setTeamMembers(teamMembers.filter((tm) => !tm.scopeGroupId || tm.scopeGroupId === groupId));
      })
      .catch((err) => Alert.alert("Couldn't load group details", err.message ?? "Please try again"))
      .finally(() => setIsLoading(false));
  }, [token, activeProfile, groupId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleExit = () => {
    Alert.alert(
      "Exit this group?",
      "You'll lose your access as a team member. Someone with Manage access would need to add you back.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Exit Group",
          style: "destructive",
          onPress: async () => {
            setIsExiting(true);
            try {
              await exitTeamMembership(auth, activeProfile!.id);
              const { profiles } = await getMyProfiles(token!);
              if (profiles.length > 0) {
                setActiveProfile(profiles[0]);
              } else {
                await signOut();
              }
            } catch (err: any) {
              Alert.alert("Couldn't exit group", err.message ?? "Please try again");
            } finally {
              setIsExiting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading || !group) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const supplierCount = isBuyer ? (group as BuyerGroupDetail).suppliers.length : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{"‹ Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Details</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <Avatar label={group.name} size={72} />
          <Text style={styles.groupName}>{group.name}</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("TeamMembers", { groupId })}>
            <Text style={styles.rowTitle}>Team Members</Text>
            <Text style={styles.rowMeta}>{teamMembers.length}  ›</Text>
          </TouchableOpacity>

          {isBuyer ? (
            <TouchableOpacity
              style={[styles.row, styles.rowLast]}
              onPress={() => navigation.navigate("GroupSuppliers", { groupId })}
            >
              <Text style={styles.rowTitle}>Suppliers</Text>
              <Text style={styles.rowMeta}>{supplierCount}  ›</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.row, styles.rowLast]}
              onPress={() => navigation.navigate("GroupMembers", { groupId })}
            >
              <Text style={styles.rowTitle}>Buyer & Members</Text>
              <Text style={styles.rowMeta}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isOwner && (
          <TouchableOpacity style={styles.exitButton} onPress={handleExit} disabled={isExiting}>
            {isExiting ? <ActivityIndicator color="#B00020" /> : <Text style={styles.exitButtonText}>Exit Group</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
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
  scrollContent: { padding: 20 },
  avatarSection: { alignItems: "center", marginBottom: 28 },
  groupName: { fontSize: 19, fontWeight: "700", marginTop: 12, textAlign: "center" },
  section: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  rowLast: { borderBottomWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowMeta: { fontSize: 14, color: "#999" },
  exitButton: {
    borderWidth: 1,
    borderColor: "#B00020",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  exitButtonText: { color: "#B00020", fontWeight: "600", fontSize: 15 },
});
