import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getGroupDetail } from "../api/groups";
import { Bid, getGroupBids } from "../api/bids";

export default function GroupDetailScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const { token, activeProfile } = useAuth();
  const [groupName, setGroupName] = useState<string>("");
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isBuyer = activeProfile?.profileType === "BUYER";
  const auth = { token: token!, profileId: activeProfile!.id };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      Promise.all([getGroupDetail(auth, groupId), getGroupBids(auth, groupId)])
        .then(([{ group }, { bids }]) => {
          setGroupName(group.name);
          setBids(bids);
        })
        .catch((err) => Alert.alert("Couldn't load group", err.message ?? "Please try again"))
        .finally(() => setIsLoading(false));
    }, [token, activeProfile, groupId])
  );

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {groupName}
        </Text>
        {isBuyer ? (
          <TouchableOpacity onPress={() => navigation.navigate("GroupSuppliers", { groupId })}>
            <Text style={styles.suppliersLink}>Suppliers</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <FlatList
        contentContainerStyle={bids.length === 0 ? styles.emptyContainer : styles.list}
        data={bids}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {isBuyer ? "No bids yet. Tap + to raise one." : "No bids have been raised in this group yet."}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.bidRow} onPress={() => navigation.navigate("BidDetail", { bidId: item.id })}>
            <View style={styles.bidRowHeader}>
              <View style={[styles.statusDot, item.status === "ONGOING" ? styles.dotOngoing : styles.dotClosed]} />
              <Text style={styles.bidTitle} numberOfLines={1}>
                {item.title}
              </Text>
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
        )}
      />

      {isBuyer && (
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
  headerTitle: { fontSize: 17, fontWeight: "700", flex: 1, textAlign: "center", marginHorizontal: 8 },
  suppliersLink: { color: "#128C7E", fontWeight: "600" },
  list: { padding: 16 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#888", textAlign: "center", paddingHorizontal: 32 },
  bidRow: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  bidRowHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  dotOngoing: { backgroundColor: "#25D366" },
  dotClosed: { backgroundColor: "#999" },
  bidTitle: { fontSize: 16, fontWeight: "700", flex: 1 },
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
