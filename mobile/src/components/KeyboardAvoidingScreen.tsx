import React from "react";
import { KeyboardAvoidingView, Platform, StyleProp, ViewStyle } from "react-native";

interface Props {
  style?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
  children: React.ReactNode;
}

// Centralizes the one part of this pattern that's easy to get wrong: Android needs an
// explicit "height" behavior (KeyboardAvoidingView does nothing on Android with `undefined`,
// which this codebase shipped by accident in a few places before this was factored out).
export default function KeyboardAvoidingScreen({ style, keyboardVerticalOffset, children }: Props) {
  return (
    <KeyboardAvoidingView
      style={style}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
