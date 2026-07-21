import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ProfileType } from "../api/auth";

export default function CompanyProfileFields({
  companyName,
  onCompanyNameChange,
  gstNumber,
  onGstNumberChange,
  profileType,
  onProfileTypeChange,
  autoFocusCompanyName = false,
}: {
  companyName: string;
  onCompanyNameChange: (v: string) => void;
  gstNumber: string;
  onGstNumberChange: (v: string) => void;
  profileType: ProfileType;
  onProfileTypeChange: (t: ProfileType) => void;
  autoFocusCompanyName?: boolean;
}) {
  return (
    <>
      <TextInput
        style={styles.input}
        placeholder="Company name"
        value={companyName}
        onChangeText={onCompanyNameChange}
        autoFocus={autoFocusCompanyName}
      />
      <TextInput
        style={styles.input}
        placeholder="GST number (optional)"
        value={gstNumber}
        onChangeText={onGstNumberChange}
      />

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, profileType === "BUYER" && styles.toggleButtonActive]}
          onPress={() => onProfileTypeChange("BUYER")}
        >
          <Text style={[styles.toggleText, profileType === "BUYER" && styles.toggleTextActive]}>Buyer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, profileType === "SUPPLIER" && styles.toggleButtonActive]}
          onPress={() => onProfileTypeChange("SUPPLIER")}
        >
          <Text style={[styles.toggleText, profileType === "SUPPLIER" && styles.toggleTextActive]}>Supplier</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 },
  toggleRow: { flexDirection: "row", marginBottom: 24, gap: 12 },
  toggleButton: { flex: 1, borderWidth: 1, borderColor: "#128C7E", borderRadius: 8, padding: 12, alignItems: "center" },
  toggleButtonActive: { backgroundColor: "#128C7E" },
  toggleText: { color: "#128C7E", fontWeight: "600" },
  toggleTextActive: { color: "#fff" },
});
