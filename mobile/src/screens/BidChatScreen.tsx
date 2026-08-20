import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { ChatMessage, getChatHistory, openChatSocket, sendChatMessage } from "../api/chat";

export default function BidChatScreen({ route, navigation }: any) {
  const { bidId } = route.params;
  const { token, activeProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const auth = { token: token!, profileId: activeProfile!.id };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      getChatHistory(auth, bidId)
        .then(({ messages }) => setMessages(messages))
        .catch((err) => Alert.alert("Couldn't load chat", err.message ?? "Please try again"))
        .finally(() => setIsLoading(false));

      const ws = openChatSocket(bidId, auth, (message) => {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      });
      wsRef.current = ws;

      return () => {
        ws.close();
        wsRef.current = null;
      };
    }, [token, activeProfile, bidId])
  );

  const handleSend = async () => {
    if (!draft.trim()) return;
    setIsSending(true);
    try {
      const { message } = await sendChatMessage(auth, bidId, draft.trim());
      setDraft("");
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    } catch (err: any) {
      Alert.alert("Couldn't send message", err.message ?? "Please try again");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{"‹ Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bid Chat</Text>
        <View style={{ width: 50 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          contentInsetAdjustmentBehavior="never"
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) =>
            item.type === "system" ? (
              <View style={styles.systemBubble}>
                <Text style={styles.systemText}>{item.text}</Text>
              </View>
            ) : (
              <View style={[styles.bubbleRow, item.isYou ? styles.bubbleRowYou : styles.bubbleRowOther]}>
                <View style={[styles.bubble, item.isYou ? styles.bubbleYou : styles.bubbleOther]}>
                  {!item.isYou && <Text style={styles.senderLabel}>{item.senderLabel}</Text>}
                  <Text style={styles.messageText}>{item.text}</Text>
                  <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
                </View>
              </View>
            )
          }
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isSending || !draft.trim()}>
          {isSending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.sendButtonText}>Send</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ECE5DD" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  systemBubble: {
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    maxWidth: "90%",
  },
  systemText: { fontSize: 12, color: "#555", textAlign: "center" },
  bubbleRow: { flexDirection: "row", marginVertical: 3 },
  bubbleRowYou: { justifyContent: "flex-end" },
  bubbleRowOther: { justifyContent: "flex-start" },
  bubble: { maxWidth: "78%", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  bubbleYou: { backgroundColor: "#DCF8C6" },
  bubbleOther: { backgroundColor: "#fff" },
  senderLabel: { fontSize: 12, fontWeight: "700", color: "#128C7E", marginBottom: 2 },
  messageText: { fontSize: 15, color: "#222" },
  timestamp: { fontSize: 10, color: "#999", marginTop: 4, alignSelf: "flex-end" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#128C7E",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: "center",
  },
  sendButtonText: { color: "#fff", fontWeight: "600" },
});
