import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Currency } from "../api/bids";

export default function BidFormFields({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  targetPrice,
  onTargetPriceChange,
  currency,
  onCurrencyChange,
  deadline,
  onDeadlineChange,
}: {
  title: string;
  onTitleChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  targetPrice: string;
  onTargetPriceChange: (v: string) => void;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  deadline: Date;
  onDeadlineChange: (d: Date) => void;
}) {
  return (
    <>
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={onTitleChange} autoFocus />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Description (include unit, quantity, terms)"
        value={description}
        onChangeText={onDescriptionChange}
        multiline
      />
      <View style={styles.priceRow}>
        <TextInput
          style={[styles.input, styles.priceInput]}
          placeholder="Target price (optional)"
          value={targetPrice}
          onChangeText={onTargetPriceChange}
          keyboardType="numeric"
        />
        <View style={styles.currencyToggle}>
          <TouchableOpacity
            style={[styles.currencyOption, currency === "INR" && styles.currencyOptionActive]}
            onPress={() => onCurrencyChange("INR")}
          >
            <Text style={[styles.currencyText, currency === "INR" && styles.currencyTextActive]}>₹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.currencyOption, currency === "USD" && styles.currencyOptionActive]}
            onPress={() => onCurrencyChange("USD")}
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
            if (selected) onDeadlineChange(selected);
          }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
});
