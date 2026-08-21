import React, { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CommonActions, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getNotifications, markNotificationRead, Notification } from "../api/notifications";

export default function UpdatesScreen({ navigation }: any) {
  const { token, activeProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const auth = { token: token!, profileId: activeProfile!.id };

  const load = useCallback(() => {
    setIsLoading(true);
    getNotifications(auth)
      .then(({ notifications }) => setNotifications(notifications))
      .catch((err) => Alert.alert("Couldn't load updates", err.message ?? "Please try again"))
      .finally(() => setIsLoading(false));
  }, [token, activeProfile]);

  useFocusEffect(load);

  const handlePress = (item: Notification) => {
    if (!item.readAt) {
      markNotificationRead(auth, item.id).catch(() => {});
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)));
    }
    if (item.bidId && item.bid?.groupId) {
      const groupId = item.bid.groupId;
      const chatsRoutes: { name: string; params?: object }[] = [
        { name: "GroupList" },
        { name: "GroupDetail", params: { groupId } },
        { name: "BidDetail", params: { bidId: item.bidId } },
      ];
      if (item.type === "NEW_CHAT_MESSAGE") {
        chatsRoutes.push({ name: "BidChat", params: { bidId: item.bidId } });
      }
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: "UpdatesTab" },
            { name: "ChatsTab", state: { routes: chatsRoutes, index: chatsRoutes.length - 1 } },
            { name: "ProfileTab" },
          ],
        })
      );
    } else if (item.bidId) {
      navigation.navigate("ChatsTab", { screen: "BidDetail", params: { bidId: item.bidId } });
    } else {
      navigation.navigate("ChatsTab", { screen: "GroupList" });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Updates</Text>
      </View>

      <FlatList
        contentInsetAdjustmentBehavior="never"
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        onRefresh={load}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>No updates yet.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => handlePress(item)}>
            {!item.readAt && <View style={styles.unreadDot} />}
            <View style={styles.rowText}>
              <Text style={[styles.message, !item.readAt && styles.messageUnread]}>{item.message}</Text>
              {item.bid?.title && <Text style={styles.bidTitle}>{item.bid.title}</Text>}
              <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  list: { padding: 16 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#888" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 10,
  },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30", marginTop: 6 },
  rowText: { flex: 1 },
  message: { fontSize: 14, color: "#333" },
  messageUnread: { fontWeight: "700", color: "#111" },
  bidTitle: { fontSize: 12, color: "#128C7E", marginTop: 2 },
  timestamp: { fontSize: 11, color: "#999", marginTop: 4 },
});
