import React, { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getMyGroups, GroupListItem } from "../api/groups";
import Avatar from "../components/Avatar";

export default function GroupListScreen({ navigation }: any) {
  const { token, activeProfile } = useAuth();
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isBuyer = activeProfile?.profileType === "BUYER";

  const loadGroups = useCallback(() => {
    setIsLoading(true);
    getMyGroups({ token: token!, profileId: activeProfile!.id })
      .then(({ groups }) => setGroups(groups))
      .catch((err) => Alert.alert("Couldn't load groups", err.message ?? "Please try again"))
      .finally(() => setIsLoading(false));
  }, [token, activeProfile]);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{activeProfile?.companyName}</Text>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        onRefresh={loadGroups}
        contentContainerStyle={groups.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>
              {isBuyer ? "No groups yet. Tap + to create one." : "You haven't been added to any groups yet."}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("GroupDetail", { groupId: item.id })}>
            <Avatar label={item.name} />
            <View style={styles.rowText}>
              <View style={styles.rowTitleLine}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                {item.hasUnread && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.rowSubtitle}>
                {isBuyer ? `${item._count?.suppliers ?? 0} supplier(s)` : item.buyerProfile?.companyName}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {isBuyer && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("CreateGroup")}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
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
  headerTitle: { fontSize: 18, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  rowText: { flex: 1 },
  rowTitleLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30" },
  rowSubtitle: { fontSize: 13, color: "#777", marginTop: 2 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#888", textAlign: "center", paddingHorizontal: 32 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#128C7E",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 28, lineHeight: 30 },
});
