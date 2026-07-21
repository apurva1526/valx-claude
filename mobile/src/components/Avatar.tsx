import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Avatar({ label, size = 48 }: { label: string; size?: number }) {
  const initials = label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials || "?"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: "#DDEFEC", alignItems: "center", justifyContent: "center" },
  text: { color: "#128C7E", fontWeight: "700" },
});
