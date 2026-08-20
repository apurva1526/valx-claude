import React from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { CUSTOMER_CARE_PHONE, VALX_BUYER_MESSAGES, VALX_SUPPLIER_MESSAGES } from "../content/valxOnboarding";

export default function ValXChatScreen({ navigation }: any) {
  const { activeProfile } = useAuth();
  const messages = activeProfile?.profileType === "SUPPLIER" ? VALX_SUPPLIER_MESSAGES : VALX_BUYER_MESSAGES;

  const handleWhatsApp = () => {
    const text = encodeURIComponent("Hi ValX Support, I need help with...");
    Linking.openURL(`https://wa.me/${CUSTOMER_CARE_PHONE}?text=${text}`).catch(() =>
      Alert.alert("Couldn't open WhatsApp", "Please try again")
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{"‹ Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ValX</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {messages.map((text, index) => (
          <View key={index} style={styles.bubbleRow}>
            <View style={styles.bubble}>
              <Text style={styles.messageText}>{text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          <Text style={styles.whatsappButtonText}>Chat with Customer Care</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ECE5DD" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#fff",
  },
  back: { color: "#128C7E", fontWeight: "600", width: 50 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  list: { flex: 1 },
  listContent: { padding: 12 },
  bubbleRow: { flexDirection: "row", justifyContent: "flex-start", marginVertical: 4 },
  bubble: { maxWidth: "82%", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: "#fff" },
  messageText: { fontSize: 15, color: "#222", lineHeight: 21 },
  footer: {
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#25D366",
    borderRadius: 24,
    paddingVertical: 14,
  },
  whatsappButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
