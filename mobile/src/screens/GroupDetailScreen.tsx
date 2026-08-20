import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getGroupDetail } from "../api/groups";
import { Bid, getGroupBids, pinBid, unpinBid } from "../api/bids";
import SwipeableRow from "../components/SwipeableRow";

export default function GroupDetailScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const { token, activeProfile } = useAuth();
  const [groupName, setGroupName] = useState<string>("");
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ONGOING" | "PAST">("ONGOING");
  const [search, setSearch] = useState("");

  const isBuyer = activeProfile?.profileType === "BUYER";
  const canManage = activeProfile?.access === "OWNER" || activeProfile?.access === "MANAGE";
  const canEdit = canManage || activeProfile?.access === "EDIT";
  const auth = { token: token!, profileId: activeProfile!.id };

  const load = useCallback(() => {
    setIsLoading(true);
    Promise.all([getGroupDetail(auth, groupId), getGroupBids(auth, groupId)])
      .then(([{ group }, { bids }]) => {
        setGroupName(group.name);
        setBids(bids);
      })
      .catch((err) => Alert.alert("Couldn't load group", err.message ?? "Please try again"))
      .finally(() => setIsLoading(false));
  }, [token, activeProfile, groupId]);

  useFocusEffect(load);

  const handleTogglePin = async (item: Bid) => {
    setBids((prev) => prev.map((b) => (b.id === item.id ? { ...b, isPinned: !b.isPinned } : b)));
    try {
      if (item.isPinned) {
        await unpinBid(auth, item.id);
      } else {
        await pinBid(auth, item.id);
      }
      load();
    } catch (err: any) {
      Alert.alert("Couldn't update pin", err.message ?? "Please try again");
      load();
    }
  };

  const filteredBids = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bids.filter((b) => {
      const matchesFilter = filter === "ONGOING" ? b.status === "ONGOING" : b.status === "CLOSED";
      if (!matchesFilter) return false;
      if (!q) return true;
      return b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q);
    });
  }, [bids, filter, search]);

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
        <TouchableOpacity style={styles.headerTitleTouchable} onPress={() => navigation.navigate("GroupInfo", { groupId })}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {groupName}
          </Text>
        </TouchableOpacity>
        {isBuyer ? (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.navigate("GroupSuppliers", { groupId })}>
              <Text style={styles.suppliersLink}>Suppliers</Text>
            </TouchableOpacity>
            {canManage && (
              <TouchableOpacity onPress={() => navigation.navigate("TeamMembers", { groupId })}>
                <Text style={styles.suppliersLink}>Team</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate("GroupMembers", { groupId })}>
            <Text style={styles.suppliersLink}>Members</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search"
        value={search}
        onChangeText={setSearch}
        clearButtonMode="while-editing"
      />

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterOption, filter === "ONGOING" && styles.filterOptionActive]}
          onPress={() => setFilter("ONGOING")}
        >
          <Text style={[styles.filterText, filter === "ONGOING" && styles.filterTextActive]}>Ongoing</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterOption, filter === "PAST" && styles.filterOptionActive]}
          onPress={() => setFilter("PAST")}
        >
          <Text style={[styles.filterText, filter === "PAST" && styles.filterTextActive]}>Past</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={filteredBids.length === 0 ? styles.emptyContainer : styles.list}
        data={filteredBids}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {search
              ? "No bids match your search."
              : filter === "ONGOING"
                ? isBuyer
                  ? "No bids yet. Tap + to raise one."
                  : "No bids have been raised in this group yet."
                : "No past bids yet."}
          </Text>
        }
        renderItem={({ item }) => {
          const isExpired = item.status === "ONGOING" && new Date(item.validityDeadline).getTime() <= Date.now();
          const statusLabel = item.status !== "ONGOING" ? "Closed" : isExpired ? "Expired" : "Ongoing";
          return (
            <SwipeableRow isPinned={!!item.isPinned} onTogglePin={() => handleTogglePin(item)}>
              <TouchableOpacity style={styles.bidRow} onPress={() => navigation.navigate("BidDetail", { bidId: item.id })}>
                <View style={styles.bidRowHeader}>
                  <View style={[styles.statusDot, statusLabel === "Ongoing" ? styles.dotOngoing : styles.dotClosed]} />
                  {item.isPinned && <Ionicons name="pin" size={13} color="#128C7E" style={styles.pinIcon} />}
                  <Text style={styles.bidTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {statusLabel !== "Ongoing" && <Text style={styles.statusBadge}>{statusLabel}</Text>}
                </View>
                <Text style={styles.bidDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                {item.targetPrice != null && (
                  <Text style={styles.bidPrice}>
                    Target: {item.targetPriceCurrency === "USD" ? "$" : "₹"}
                    {item.targetPrice}
                  </Text>
                )}
                <Text style={styles.bidMeta}>Valid till {new Date(item.validityDeadline).toLocaleString()}</Text>
              </TouchableOpacity>
            </SwipeableRow>
          );
        }}
      />

      {isBuyer && canEdit && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("CreateBid", { groupId })}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
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
  headerTitleTouchable: { flex: 1, marginHorizontal: 8 },
  headerTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  suppliersLink: { color: "#128C7E", fontWeight: "600" },
  headerActions: { flexDirection: "row", gap: 14 },
  search: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
  },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  filterOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: "#f0f0f0" },
  filterOptionActive: { backgroundColor: "#128C7E" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#555" },
  filterTextActive: { color: "#fff" },
  list: { padding: 16 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#888", textAlign: "center", paddingHorizontal: 32 },
  bidRow: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  bidRowHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  pinIcon: { marginRight: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  dotOngoing: { backgroundColor: "#25D366" },
  dotClosed: { backgroundColor: "#999" },
  bidTitle: { fontSize: 16, fontWeight: "700", flex: 1 },
  statusBadge: { fontSize: 11, color: "#999", fontWeight: "600" },
  bidDescription: { fontSize: 13, color: "#555", marginBottom: 6 },
  bidPrice: { fontSize: 13, color: "#128C7E", fontWeight: "600", marginBottom: 4 },
  bidMeta: { fontSize: 12, color: "#888" },
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
