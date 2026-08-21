import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext";
import { createBid, Currency } from "../api/bids";
import BidFormFields from "../components/BidFormFields";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";

export default function CreateBidScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const { token, activeProfile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [currency, setCurrency] = useState<Currency>("INR");
  const [deadline, setDeadline] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
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
      const { bid } = await createBid(
        { token: token!, profileId: activeProfile!.id },
        groupId,
        {
          title: title.trim(),
          description: description.trim(),
          validityDeadline: deadline.toISOString(),
          targetPrice: targetPrice.trim() ? Number(targetPrice.trim()) : undefined,
          targetPriceCurrency: currency,
        }
      );
      navigation.replace("BidDetail", { bidId: bid.id });
    } catch (err: any) {
      Alert.alert("Couldn't create bid", err.message ?? "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingScreen style={styles.outer}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>New Bid</Text>

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

        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Post Bid</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: "#fff" },
  container: { flexGrow: 1, padding: 24, paddingTop: 64 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 24 },
  button: { backgroundColor: "#128C7E", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
