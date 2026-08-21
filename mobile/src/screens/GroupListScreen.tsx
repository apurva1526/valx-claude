import React, { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getMyGroups, GroupListItem, pinGroup, unpinGroup } from "../api/groups";
import { Bid, getOngoingBids } from "../api/bids";
import Avatar from "../components/Avatar";
import SwipeableRow from "../components/SwipeableRow";
import { makeTogglePin } from "../hooks/useTogglePin";

type TabView = "ALL" | "ONGOING_BIDS";
type Row = { kind: "valx" } | { kind: "group"; group: GroupListItem };

export default function GroupListScreen({ navigation }: any) {
  const { token, activeProfile } = useAuth();
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [ongoingBids, setOngoingBids] = useState<(Bid & { groupName: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<TabView>("ALL");
  const [search, setSearch] = useState("");

  const isBuyer = activeProfile?.profileType === "BUYER";
  const canManage = activeProfile?.access === "OWNER" || activeProfile?.access === "MANAGE";
  const auth = { token: token!, profileId: activeProfile!.id };

  const loadGroups = useCallback(() => {
    setIsLoading(true);
    Promise.all([getMyGroups(auth), getOngoingBids(auth)])
      .then(([{ groups }, { bids }]) => {
        setGroups(groups);
        setOngoingBids(bids);
      })
      .catch((err) => Alert.alert("Couldn't load groups", err.message ?? "Please try again"))
      .finally(() => setIsLoading(false));
  }, [token, activeProfile]);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  const handleTogglePin = makeTogglePin<GroupListItem>(
    setGroups,
    (id) => pinGroup(auth, id),
    (id) => unpinGroup(auth, id),
    loadGroups
  );

  const handleOpenBid = (bid: Bid & { groupName: string }) => {
    const chatsRoutes = [
      { name: "GroupList" },
      { name: "GroupDetail", params: { groupId: bid.groupId } },
      { name: "BidDetail", params: { bidId: bid.id } },
    ];
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: "UpdatesTab" },
          { name: "ChatsTab", state: { routes: chatsRoutes, index: chatsRoutes.length - 1 } },
          { name: "ProfileTab" },
        ],
      })
    );
  };

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, search]);

  const filteredBids = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ongoingBids;
    return ongoingBids.filter(
      (b) => b.title.toLowerCase().includes(q) || b.groupName.toLowerCase().includes(q)
    );
  }, [ongoingBids, search]);

  const rows = useMemo<Row[]>(() => {
    const groupRows: Row[] = filteredGroups.map((group) => ({ kind: "group", group }));
    return [...groupRows, { kind: "valx" }];
  }, [filteredGroups]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{activeProfile?.companyName}</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search"
        value={search}
        onChangeText={setSearch}
        clearButtonMode="while-editing"
      />

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, view === "ALL" && styles.tabActive]}
          onPress={() => setView("ALL")}
        >
          <Text style={[styles.tabText, view === "ALL" && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === "ONGOING_BIDS" && styles.tabActive]}
          onPress={() => setView("ONGOING_BIDS")}
        >
          <Text style={[styles.tabText, view === "ONGOING_BIDS" && styles.tabTextActive]}>Bids</Text>
        </TouchableOpacity>
      </View>

      {view === "ALL" ? (
        <FlatList
          contentInsetAdjustmentBehavior="never"
          data={rows}
          keyExtractor={(row) => (row.kind === "valx" ? "__valx__" : row.group.id)}
          refreshing={isLoading}
          onRefresh={loadGroups}
          renderItem={({ item: row }) => {
            if (row.kind === "valx") {
              return (
                <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("ValXChat")}>
                  <Avatar label="ValX" />
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>ValX</Text>
                    <Text style={styles.rowSubtitle}>Tap for a quick guide + support</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            const item = row.group;
            return (
              <SwipeableRow isPinned={!!item.isPinned} onTogglePin={() => handleTogglePin(item)}>
                <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("GroupDetail", { groupId: item.id })}>
                  <Avatar label={item.name} />
                  <View style={styles.rowText}>
                    <View style={styles.rowTitleLine}>
                      {item.isPinned && <Ionicons name="pin" size={13} color="#128C7E" style={styles.pinIcon} />}
                      <Text style={styles.rowTitle}>{item.name}</Text>
                      {item.hasUnread && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.rowSubtitle}>
                      {isBuyer ? `${item._count?.suppliers ?? 0} supplier(s)` : item.buyerProfile?.companyName}
                    </Text>
                  </View>
                </TouchableOpacity>
              </SwipeableRow>
            );
          }}
        />
      ) : (
        <FlatList
          contentInsetAdjustmentBehavior="never"
          data={filteredBids}
          keyExtractor={(item) => item.id}
          refreshing={isLoading}
          onRefresh={loadGroups}
          contentContainerStyle={filteredBids.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            !isLoading ? (
              <Text style={styles.emptyText}>
                {search ? "No bids match your search." : "No bids right now."}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => handleOpenBid(item)}>
              <Avatar label={item.title} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowSubtitle}>
                  {item.groupName} · Valid till {new Date(item.validityDeadline).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {isBuyer && canManage && view === "ALL" && (
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
  search: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
  },
  tabRow: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 10 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: "#f0f0f0" },
  tabActive: { backgroundColor: "#128C7E" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#555" },
  tabTextActive: { color: "#fff" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12, backgroundColor: "#fff" },
  rowText: { flex: 1 },
  rowTitleLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  pinIcon: { marginRight: 2 },
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
