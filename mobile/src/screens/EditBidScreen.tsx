import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext";
import { Currency, updateBid } from "../api/bids";
import BidFormFields from "../components/BidFormFields";

export default function EditBidScreen({ route, navigation }: any) {
  const { bid } = route.params;
  const { token, activeProfile } = useAuth();
  const [title, setTitle] = useState(bid.title);
  const [description, setDescription] = useState(bid.description);
  const [targetPrice, setTargetPrice] = useState(bid.targetPrice != null ? String(bid.targetPrice) : "");
  const [currency, setCurrency] = useState<Currency>(bid.targetPriceCurrency);
  const [deadline, setDeadline] = useState<Date>(new Date(bid.validityDeadline));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Title and description are required");
      return;
    }
    if (deadline.getTime() <= Date.now()) {
      Alert.alert("Deadline must be in the future");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateBid({ token: token!, profileId: activeProfile!.id }, bid.id, {
        title: title.trim(),
        description: description.trim(),
        validityDeadline: deadline.toISOString(),
        targetPrice: targetPrice.trim() ? Number(targetPrice.trim()) : undefined,
        targetPriceCurrency: currency,
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Couldn't save changes", err.message ?? "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.outer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Edit Bid</Text>
        <Text style={styles.notice}>Every supplier on this bid will be notified of the change.</Text>

        <BidFormFields
          title={title}
          onTitleChange={setTitle}
          description={description}
          onDescriptionChange={setDescription}
          targetPrice={targetPrice}
          onTargetPriceChange={setTargetPrice}
          currency={currency}
          onCurrencyChange={setCurrency}
          deadline={deadline}
          onDeadlineChange={setDeadline}
        />

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: "#fff" },
  container: { flexGrow: 1, padding: 24, paddingTop: 64 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  notice: { fontSize: 13, color: "#888", marginBottom: 20 },
  button: { backgroundColor: "#128C7E", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
