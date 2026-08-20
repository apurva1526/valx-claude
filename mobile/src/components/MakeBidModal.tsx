import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { submitResponse, YourResponse } from "../api/bidResponses";

const MAX_REVISIONS = 5;

export default function MakeBidModal({
  visible,
  onClose,
  bidId,
  currencySymbol,
  yourResponse,
  onSubmitted,
}: {
  visible: boolean;
  onClose: () => void;
  bidId: string;
  currencySymbol: string;
  yourResponse: YourResponse | null;
  onSubmitted: () => void;
}) {
  const { token, activeProfile } = useAuth();
  const [price, setPrice] = useState(yourResponse ? String(yourResponse.price) : "");
  const [comment, setComment] = useState(yourResponse?.comment ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const revisionsUsed = yourResponse?.revisionNumber ?? 0;
  const atLimit = revisionsUsed >= MAX_REVISIONS;

  const handleSubmit = async () => {
    const parsed = Number(price);
    if (!price.trim() || isNaN(parsed) || parsed <= 0) {
      Alert.alert("Enter a valid price");
      return;
    }
    if (yourResponse && parsed >= yourResponse.price) {
      Alert.alert("Price too high", `Your revised price must be lower than your previous price (${currencySymbol}${yourResponse.price})`);
      return;
    }
    setIsSubmitting(true);
    try {
      await submitResponse(
        { token: token!, profileId: activeProfile!.id },
        bidId,
        { price: parsed, comment: comment.trim() || undefined }
      );
      onSubmitted();
      onClose();
    } catch (err: any) {
      Alert.alert("Couldn't submit bid", err.message ?? "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>{yourResponse ? "Revise Bid" : "Make Bid"}</Text>
          <Text style={styles.revisionCount}>
            {atLimit ? "Revision limit reached — your last price stands" : `Revision ${revisionsUsed + 1} of ${MAX_REVISIONS}`}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.currencySymbol}>{currencySymbol}</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="Your price"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              editable={!atLimit}
              autoFocus
            />
          </View>

          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Private comment to buyer (optional)"
            value={comment}
            onChangeText={setComment}
            multiline
            editable={!atLimit}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, atLimit && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting || atLimit}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>{yourResponse ? "Update" : "Submit"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  revisionCount: { fontSize: 13, color: "#888", marginBottom: 16 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  currencySymbol: { fontSize: 18, fontWeight: "700", color: "#333", marginRight: 6 },
  priceInput: { flex: 1, paddingVertical: 14, fontSize: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 20 },
  multiline: { minHeight: 70, textAlignVertical: "top" },
  buttonRow: { flexDirection: "row", gap: 12 },
  cancelButton: { flex: 1, padding: 14, alignItems: "center", borderRadius: 8, backgroundColor: "#eee" },
  cancelText: { color: "#333", fontWeight: "600" },
  submitButton: { flex: 1, padding: 14, alignItems: "center", borderRadius: 8, backgroundColor: "#128C7E" },
  submitButtonDisabled: { backgroundColor: "#aaa" },
  submitText: { color: "#fff", fontWeight: "600" },
});
