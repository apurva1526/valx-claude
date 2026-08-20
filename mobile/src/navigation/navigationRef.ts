import { CommonActions, createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

export function navigateToBidFromNotification(data: {
  bidId?: string;
  groupId?: string;
  type?: string;
}): void {
  if (!navigationRef.isReady()) return;

  const { bidId, groupId, type } = data;

  if (bidId && groupId) {
    const chatsRoutes: { name: string; params?: object }[] = [
      { name: "GroupList" },
      { name: "GroupDetail", params: { groupId } },
      { name: "BidDetail", params: { bidId } },
    ];
    if (type === "NEW_CHAT_MESSAGE") {
      chatsRoutes.push({ name: "BidChat", params: { bidId } });
    }
    navigationRef.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: "UpdatesTab" },
          { name: "ChatsTab", state: { routes: chatsRoutes, index: chatsRoutes.length - 1 } },
          { name: "ProfileTab" },
        ],
      })
    );
  } else if (bidId) {
    (navigationRef.navigate as any)("ChatsTab", { screen: "BidDetail", params: { bidId } });
  } else {
    (navigationRef.navigate as any)("ChatsTab", { screen: "GroupList" });
  }
}
