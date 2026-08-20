import React, { useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

export default function SwipeableRow({
  isPinned,
  onTogglePin,
  children,
}: {
  isPinned: boolean;
  onTogglePin: () => void;
  children: React.ReactNode;
}) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });
    return (
      <Animated.View style={{ transform: [{ translateX }] }}>
        <TouchableOpacity
          style={[styles.action, isPinned ? styles.unpinAction : styles.pinAction]}
          onPress={() => {
            swipeableRef.current?.close();
            onTogglePin();
          }}
        >
          <Text style={styles.actionText}>{isPinned ? "Unpin" : "Pin"}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  action: { width: 80, height: "100%", alignItems: "center", justifyContent: "center" },
  pinAction: { backgroundColor: "#128C7E" },
  unpinAction: { backgroundColor: "#888" },
  actionText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});
