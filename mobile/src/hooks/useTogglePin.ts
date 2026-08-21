import { Alert } from "react-native";

export function makeTogglePin<T extends { id: string; isPinned?: boolean }>(
  setItems: (updater: (prev: T[]) => T[]) => void,
  pin: (id: string) => Promise<unknown>,
  unpin: (id: string) => Promise<unknown>,
  reload: () => void
) {
  return async (item: T) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isPinned: !i.isPinned } : i)));
    try {
      if (item.isPinned) {
        await unpin(item.id);
      } else {
        await pin(item.id);
      }
      reload();
    } catch (err: any) {
      Alert.alert("Couldn't update pin", err.message ?? "Please try again");
      reload();
    }
  };
}
