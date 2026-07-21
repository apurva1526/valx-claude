import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { Bid, getBidDetail } from "../api/bids";
import { BuyerResponseRow, getBuyerResponses, getSupplierResponses, RevisionEntry, YourResponse } from "../api/bidResponses";
import MakeBidModal from "../components/MakeBidModal";

export default function BidDetailScreen({ route, navigation }: any) {
  const { bidId } = route.params;
  const { token, activeProfile } = useAuth();
  const [bid, setBid] = useState<Bid | null>(null);
  const [buyerResponses, setBuyerResponses] = useState<BuyerResponseRow[]>([]);
  const [bestPrice, setBestPrice] = useState<number | null>(null);
  const [yourResponse, setYourResponse] = useState<YourResponse | null>(null);
  const [yourHistory, setYourHistory] = useState<RevisionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const isBuyer = activeProfile?.profileType === "BUYER";
  const auth = { token: token!, profileId: activeProfile!.id };

  const load = useCallback(() => {
    setIsLoading(true);
    const responsesPromise = isBuyer ? getBuyerResponses(auth, bidId) : getSupplierResponses(auth, bidId);
    Promise.all([getBidDetail(auth, bidId), responsesPromise])
      .then(([bidResult, responsesResult]) => {
        setBid(bidResult.bid);
        if (isBuyer) {
          setBuyerResponses((responsesResult as { responses: BuyerResponseRow[] }).responses);
        } else {
          const r = responsesResult as { bestPrice: number | null; yourResponse: YourResponse | null; yourHistory: RevisionEntry[] };
          setBestPrice(r.bestPrice);
          setYourResponse(r.yourResponse);
          setYourHistory(r.yourHistory);
        }
      })
      .catch((err) => Alert.alert("Couldn't load bid", err.message ?? "Please try again"))
      .finally(() => setIsLoading(false));
  }, [token, activeProfile, bidId]);

  useFocusEffect(load);

  if (isLoading || !bid) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const currencySymbol = bid.targetPriceCurrency === "USD" ? "$" : "₹";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{"‹ Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bid Details</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
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
              {currencySymbol}
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

        <View style={styles.sectionDivider} />

        {isBuyer ? (
          <>
            <Text style={styles.sectionTitle}>Responses ({buyerResponses.length})</Text>
            {buyerResponses.length === 0 ? (
              <Text style={styles.emptyText}>No responses yet.</Text>
            ) : (
              buyerResponses.map((r) => (
                <View key={r.supplierProfileId} style={styles.responseCard}>
                  <View style={styles.responseHeader}>
                    <Text style={styles.responseName}>{r.companyName}</Text>
                    <Text style={styles.responsePrice}>
                      {currencySymbol}
                      {r.price}
                    </Text>
                  </View>
                  {r.comment && <Text style={styles.responseComment}>{r.comment}</Text>}
                  <Text style={styles.responseMeta}>
                    Revision {r.revisionNumber} of 5 · {new Date(r.updatedAt).toLocaleString()}
                  </Text>

                  {r.history.length > 1 && (
                    <View style={styles.historyBlock}>
                      <Text style={styles.historyTitle}>Revision history</Text>
                      {r.history.map((h) => (
                        <View key={h.revisionNumber} style={styles.historyRow}>
                          <Text style={styles.historyLabel}>Rev {h.revisionNumber}</Text>
                          <Text style={styles.historyPrice}>
                            {currencySymbol}
                            {h.price}
                          </Text>
                          <Text style={styles.historyDate}>{new Date(h.createdAt).toLocaleString()}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Your Bid</Text>

            <View style={styles.rankSummary}>
              <View>
                <Text style={styles.rankSummaryLabel}>Best Price (Market)</Text>
                <Text style={styles.rankSummaryValue}>
                  {bestPrice != null ? `${currencySymbol}${bestPrice}` : "—"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.rankSummaryLabel}>Your Price</Text>
                <Text style={styles.rankSummaryValue}>
                  {yourResponse ? `${currencySymbol}${yourResponse.price}` : "Not bid yet"}
                </Text>
              </View>
            </View>

            {yourHistory.length > 1 && (
              <View style={styles.historyBlock}>
                <Text style={styles.historyTitle}>Your revision history</Text>
                {yourHistory.map((h) => (
                  <View key={h.revisionNumber} style={styles.historyRow}>
                    <Text style={styles.historyLabel}>Rev {h.revisionNumber}</Text>
                    <Text style={styles.historyPrice}>
                      {currencySymbol}
                      {h.price}
                    </Text>
                    <Text style={styles.historyDate}>{new Date(h.createdAt).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.bidButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.bidButtonText}>{yourResponse ? "Revise Bid" : "Make Bid"}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {!isBuyer && (
        <MakeBidModal
          key={yourResponse?.revisionNumber ?? "new"}
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          bidId={bidId}
          currencySymbol={currencySymbol}
          yourResponse={yourResponse}
          onSubmitted={load}
        />
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
  back: { color: "#128C7E", fontWeight: "600", width: 50 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40 },
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
  sectionDivider: { height: 1, backgroundColor: "#eee", marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  emptyText: { color: "#888" },
  responseCard: { borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 14, marginBottom: 10 },
  responseHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  responseName: { fontSize: 15, fontWeight: "700" },
  responsePrice: { fontSize: 15, fontWeight: "700", color: "#128C7E" },
  responseComment: { fontSize: 13, color: "#555", marginBottom: 6, fontStyle: "italic" },
  responseMeta: { fontSize: 11, color: "#999" },
  historyBlock: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  historyTitle: { fontSize: 12, fontWeight: "700", color: "#888", marginBottom: 6 },
  historyRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  historyLabel: { fontSize: 12, color: "#888", width: 50 },
  historyPrice: { fontSize: 12, fontWeight: "600", flex: 1, textAlign: "center" },
  historyDate: { fontSize: 11, color: "#aaa" },
  rankSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F0FBF9",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  rankSummaryLabel: { fontSize: 12, color: "#888", marginBottom: 2 },
  rankSummaryValue: { fontSize: 18, fontWeight: "700", color: "#128C7E" },
  bidButton: { backgroundColor: "#128C7E", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 12 },
  bidButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
