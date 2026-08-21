import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { Bid, getBidDetail } from "../api/bids";
import {
  BuyerResponseRow,
  getBuyerResponses,
  getSupplierResponses,
  revokeResponse,
  RevisionEntry,
  YourResponse,
} from "../api/bidResponses";
import MakeBidModal from "../components/MakeBidModal";
import CloseBidModal from "../components/CloseBidModal";

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
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const isBuyer = activeProfile?.profileType === "BUYER";
  const canEdit = activeProfile?.access === "OWNER" || activeProfile?.access === "MANAGE" || activeProfile?.access === "EDIT";
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

  const handleRevoke = () => {
    Alert.alert("Revoke your bid?", "This uses one of your 5 revisions. You can still submit a new, lower price afterwards.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Revoke",
        style: "destructive",
        onPress: async () => {
          setIsRevoking(true);
          try {
            await revokeResponse(auth, bidId);
            load();
          } catch (err: any) {
            Alert.alert("Couldn't revoke bid", err.message ?? "Please try again");
          } finally {
            setIsRevoking(false);
          }
        },
      },
    ]);
  };

  if (isLoading || !bid) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const currencySymbol = bid.targetPriceCurrency === "USD" ? "$" : "₹";
  const isExpired = bid.status === "ONGOING" && new Date(bid.validityDeadline).getTime() <= Date.now();
  const statusLabel = bid.status !== "ONGOING" ? "Closed" : isExpired ? "Expired" : "Ongoing";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{"‹ Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bid Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.chatLink} onPress={() => navigation.navigate("BidChat", { bidId })}>
            <Text style={styles.editLink}>Chat</Text>
            {bid.hasUnreadChat && <View style={styles.chatUnreadDot} />}
          </TouchableOpacity>
          {isBuyer && (
            <TouchableOpacity onPress={() => navigation.navigate("EditBid", { bid })}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, statusLabel === "Ongoing" ? styles.dotOngoing : styles.dotClosed]} />
          <Text style={styles.statusText}>{statusLabel}</Text>
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
              (() => {
                let rank = 0;
                return buyerResponses.map((r) => {
                  if (!r.revokedAt) rank += 1;
                  return (
                    <View key={r.supplierProfileId} style={[styles.responseCard, r.revokedAt && styles.responseCardRevoked]}>
                      <View style={styles.responseHeader}>
                        <Text style={styles.responseName}>
                          {r.revokedAt ? (
                            <Text style={styles.revokedBadge}>Revoked </Text>
                          ) : (
                            <Text style={styles.responseRank}>#{rank} </Text>
                          )}
                          {r.companyName}
                        </Text>
                        <Text style={styles.responsePrice}>{r.revokedAt ? "—" : `${currencySymbol}${r.price}`}</Text>
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
                            {h.revokedAt ? "Revoked" : `${currencySymbol}${h.price}`}
                          </Text>
                          <Text style={styles.historyDate}>{new Date(h.createdAt).toLocaleString()}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                    </View>
                  );
                });
              })()
            )}

            {bid.status === "CLOSED" ? (
              <View style={styles.awardSummary}>
                <Text style={styles.awardSummaryTitle}>
                  {bid.awardRecord && bid.awardRecord.awardedSupplierIds.length > 0 ? "Awarded" : "Closed, No Award"}
                </Text>
                {bid.awardRecord && bid.awardRecord.awardedSupplierIds.length > 0 && (
                  <Text style={styles.awardSummaryNames}>
                    {bid.awardRecord.awardedSupplierIds
                      .map((id) => buyerResponses.find((r) => r.supplierProfileId === id)?.companyName ?? "Unknown")
                      .join(", ")}
                  </Text>
                )}
              </View>
            ) : (
              canEdit && (
                <TouchableOpacity style={styles.closeBidButton} onPress={() => setCloseModalVisible(true)}>
                  <Text style={styles.closeBidButtonText}>Close Bid</Text>
                </TouchableOpacity>
              )
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

            {yourResponse?.revokedAt && (
              <Text style={styles.revokedNotice}>You revoked this bid. Submit a new, lower price to re-enter.</Text>
            )}

            {yourHistory.length > 1 && (
              <View style={styles.historyBlock}>
                <Text style={styles.historyTitle}>Your revision history</Text>
                {yourHistory.map((h) => (
                  <View key={h.revisionNumber} style={styles.historyRow}>
                    <Text style={styles.historyLabel}>Rev {h.revisionNumber}</Text>
                    <Text style={styles.historyPrice}>
                      {h.revokedAt ? "Revoked" : `${currencySymbol}${h.price}`}
                    </Text>
                    <Text style={styles.historyDate}>{new Date(h.createdAt).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}

            {bid.status === "CLOSED" ? (
              <View style={styles.awardSummary}>
                {bid.awardOutcome?.wasAwarded ? (
                  <View style={styles.awardSummaryRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#128C7E" />
                    <Text style={styles.awardSummaryTitle}>You were awarded this bid!</Text>
                  </View>
                ) : (
                  <Text style={styles.awardSummaryTitle}>This bid has closed</Text>
                )}
                {bid.awardOutcome?.comment && <Text style={styles.awardComment}>{bid.awardOutcome.comment}</Text>}
              </View>
            ) : isExpired ? (
              <Text style={styles.expiredNotice}>This bid's validity has expired — no further bids can be placed.</Text>
            ) : (
              <>
                <TouchableOpacity style={styles.bidButton} onPress={() => setModalVisible(true)}>
                  <Text style={styles.bidButtonText}>{yourResponse ? "Revise Bid" : "Make Bid"}</Text>
                </TouchableOpacity>
                {yourResponse && !yourResponse.revokedAt && yourResponse.revisionNumber < 5 && (
                  <TouchableOpacity style={styles.revokeButton} onPress={handleRevoke} disabled={isRevoking}>
                    {isRevoking ? <ActivityIndicator /> : <Text style={styles.revokeButtonText}>Revoke Bid</Text>}
                  </TouchableOpacity>
                )}
              </>
            )}
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

      {isBuyer && (
        <CloseBidModal
          visible={closeModalVisible}
          onClose={() => setCloseModalVisible(false)}
          bidId={bidId}
          currencySymbol={currencySymbol}
          responses={buyerResponses.filter((r) => !r.revokedAt)}
          onClosed={load}
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
  headerActions: { flexDirection: "row", gap: 14 },
  editLink: { color: "#128C7E", fontWeight: "600" },
  chatLink: { flexDirection: "row", alignItems: "flex-start" },
  chatUnreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30", marginLeft: 4 },
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
  responseCardRevoked: { backgroundColor: "#f7f7f7", opacity: 0.7 },
  responseHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  responseName: { flex: 1, marginRight: 8, fontSize: 15, fontWeight: "700" },
  responseRank: { color: "#128C7E" },
  revokedBadge: { color: "#B00020", fontWeight: "700" },
  responsePrice: { flexShrink: 0, fontSize: 15, fontWeight: "700", color: "#128C7E" },
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
  revokeButton: { borderRadius: 8, padding: 14, alignItems: "center", marginTop: 10, borderWidth: 1, borderColor: "#B00020" },
  revokeButtonText: { color: "#B00020", fontSize: 14, fontWeight: "600" },
  revokedNotice: { color: "#B00020", fontSize: 13, marginBottom: 12, fontStyle: "italic" },
  expiredNotice: { color: "#999", fontSize: 13, textAlign: "center", marginTop: 12, fontStyle: "italic" },
  closeBidButton: { backgroundColor: "#B00020", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 16 },
  closeBidButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  awardSummary: { backgroundColor: "#F0FBF9", borderRadius: 10, padding: 16, marginTop: 16, alignItems: "center" },
  awardSummaryRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  awardSummaryTitle: { fontSize: 15, fontWeight: "700", color: "#128C7E" },
  awardSummaryNames: { fontSize: 13, color: "#555", marginTop: 4, textAlign: "center" },
  awardComment: { fontSize: 13, color: "#555", marginTop: 6, textAlign: "center", fontStyle: "italic" },
});
