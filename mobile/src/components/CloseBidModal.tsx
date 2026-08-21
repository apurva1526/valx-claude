import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { closeBid } from "../api/awards";
import { BuyerResponseRow } from "../api/bidResponses";
import KeyboardAvoidingScreen from "./KeyboardAvoidingScreen";

export default function CloseBidModal({
  visible,
  onClose,
  bidId,
  currencySymbol,
  responses,
  onClosed,
}: {
  visible: boolean;
  onClose: () => void;
  bidId: string;
  currencySymbol: string;
  responses: BuyerResponseRow[];
  onClosed: () => void;
}) {
  const { token, activeProfile } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggle = (supplierProfileId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(supplierProfileId)) next.delete(supplierProfileId);
      else next.add(supplierProfileId);
      return next;
    });
  };

  const handleClose = async () => {
    setIsSubmitting(true);
    try {
      const awards = Array.from(selected).map((supplierProfileId) => ({
        supplierProfileId,
        comment: comments[supplierProfileId]?.trim() || undefined,
      }));
      await closeBid({ token: token!, profileId: activeProfile!.id }, bidId, awards);
      onClosed();
      onClose();
    } catch (err: any) {
      Alert.alert("Couldn't close bid", err.message ?? "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingScreen style={styles.backdrop} keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Close Bid</Text>
          <Text style={styles.subtitle}>Select suppliers to award, or close with no award.</Text>

          <FlatList
            style={styles.list}
            data={responses}
            keyExtractor={(item) => item.supplierProfileId}
            ListEmptyComponent={<Text style={styles.emptyText}>No responses were submitted.</Text>}
            renderItem={({ item }) => {
              const isSelected = selected.has(item.supplierProfileId);
              return (
                <View style={[styles.row, isSelected && styles.rowSelected]}>
                  <TouchableOpacity style={styles.rowTouchable} onPress={() => toggle(item.supplierProfileId)}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowName}>{item.companyName}</Text>
                      <Text style={styles.rowPrice}>
                        {currencySymbol}
                        {item.price}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {isSelected && (
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Optional comment to this supplier"
                      value={comments[item.supplierProfileId] ?? ""}
                      onChangeText={(text) => setComments((prev) => ({ ...prev, [item.supplierProfileId]: text }))}
                      multiline
                    />
                  )}
                </View>
              );
            }}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.closeText}>{selected.size === 0 ? "Close, No Award" : `Award & Close (${selected.size})`}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingScreen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, maxHeight: "80%" },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#888", marginBottom: 16 },
  list: { marginBottom: 16 },
  emptyText: { color: "#888", paddingVertical: 12 },
  row: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    marginBottom: 8,
  },
  rowTouchable: { flexDirection: "row", alignItems: "center" },
  rowSelected: { borderColor: "#128C7E", backgroundColor: "#F0FBF9" },
  commentInput: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    minHeight: 44,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#ccc",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { borderColor: "#128C7E", backgroundColor: "#128C7E" },
  checkmark: { color: "#fff", fontSize: 14, fontWeight: "700" },
  rowName: { fontSize: 15, fontWeight: "600" },
  rowPrice: { fontSize: 13, color: "#128C7E", fontWeight: "600", marginTop: 2 },
  buttonRow: { flexDirection: "row", gap: 12 },
  cancelButton: { flex: 1, padding: 14, alignItems: "center", borderRadius: 8, backgroundColor: "#eee" },
  cancelText: { color: "#333", fontWeight: "600" },
  closeButton: { flex: 1.5, padding: 14, alignItems: "center", borderRadius: 8, backgroundColor: "#128C7E" },
  closeText: { color: "#fff", fontWeight: "600" },
});
