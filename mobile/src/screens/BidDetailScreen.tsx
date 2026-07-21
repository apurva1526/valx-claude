import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { Bid, getBidDetail } from "../api/bids";

export default function BidDetailScreen({ route, navigation }: any) {
  const { bidId } = route.params;
  const { token, activeProfile } = useAuth();
  const [bid, setBid] = useState<Bid | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isBuyer = activeProfile?.profileType === "BUYER";

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      getBidDetail({ token: token!, profileId: activeProfile!.id }, bidId)
        .then(({ bid }) => setBid(bid))
        .catch((err) => Alert.alert("Couldn't load bid", err.message ?? "Please try again"))
        .finally(() => setIsLoading(false));
    }, [token, activeProfile, bidId])
  );

  if (isLoading || !bid) {
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
        <Text style={styles.headerTitle}>Bid Details</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, bid.status === "ONGOING" ? styles.dotOngoing : styles.dotClosed]} />
          <Text style={styles.statusText}>{bid.status === "ONGOING" ? "Ongoing" : "Closed"}</Text>
        </View>

        <Text style={styles.title}>{bid.title}</Text>
        <Text style={styles.description}>{bid.description}</Text>

        {bid.targetPrice != null && (
          <View style={styles.row}>
            <Text style={styles.label}>Target Price</Text>
            <Text style={styles.value}>
              {bid.targetPriceCurrency === "USD" ? "$" : "₹"}
              {bid.targetPrice}
            </Text>
          </View>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>Valid Till</Text>
          <Text style={styles.value}>{new Date(bid.validityDeadline).toLocaleString()}</Text>
        </View>

        {!isBuyer && bid.createdByProfile && (
          <View style={styles.row}>
            <Text style={styles.label}>Posted By</Text>
            <Text style={styles.value}>{bid.createdByProfile.companyName}</Text>
          </View>
        )}
      </View>
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
  back: { color: "#128C7E", fontWeight: "600", width: 50 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  body: { padding: 20 },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  dotOngoing: { backgroundColor: "#25D366" },
  dotClosed: { backgroundColor: "#999" },
  statusText: { fontSize: 13, color: "#555", fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  description: { fontSize: 15, color: "#444", marginBottom: 20, lineHeight: 21 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  label: { fontSize: 14, color: "#888" },
  value: { fontSize: 14, fontWeight: "600" },
});
