import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../context/AuthContext";
import { createBid, Currency } from "../api/bids";

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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>New Bid</Text>

      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} autoFocus />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Description (include unit, quantity, terms)"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <View style={styles.priceRow}>
        <TextInput
          style={[styles.input, styles.priceInput]}
          placeholder="Target price (optional)"
          value={targetPrice}
          onChangeText={setTargetPrice}
          keyboardType="numeric"
        />
        <View style={styles.currencyToggle}>
          <TouchableOpacity
            style={[styles.currencyOption, currency === "INR" && styles.currencyOptionActive]}
            onPress={() => setCurrency("INR")}
          >
            <Text style={[styles.currencyText, currency === "INR" && styles.currencyTextActive]}>₹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.currencyOption, currency === "USD" && styles.currencyOptionActive]}
            onPress={() => setCurrency("USD")}
          >
            <Text style={[styles.currencyText, currency === "USD" && styles.currencyTextActive]}>$</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.deadlineRow}>
        <Text style={styles.deadlineLabel}>Validity deadline</Text>
        <DateTimePicker
          value={deadline}
          mode="datetime"
          minimumDate={new Date()}
          display="default"
          onChange={(_event, selected) => {
            if (selected) setDeadline(selected);
          }}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Post Bid</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 64, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  priceRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 16 },
  priceInput: { flex: 1, marginBottom: 0 },
  currencyToggle: { flexDirection: "row", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, overflow: "hidden" },
  currencyOption: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff" },
  currencyOptionActive: { backgroundColor: "#128C7E" },
  currencyText: { fontSize: 16, fontWeight: "600", color: "#128C7E" },
  currencyTextActive: { color: "#fff" },
  deadlineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 14,
    marginBottom: 24,
  },
  deadlineLabel: { fontSize: 15, color: "#333" },
  button: { backgroundColor: "#128C7E", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
