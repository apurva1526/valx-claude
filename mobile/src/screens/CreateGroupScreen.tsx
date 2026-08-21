import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext";
import { createGroup } from "../api/groups";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";

export default function CreateGroupScreen({ navigation }: any) {
  const { token, activeProfile } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Group name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const { group } = await createGroup(
        { token: token!, profileId: activeProfile!.id },
        { name: name.trim(), description: description.trim() || undefined }
      );
      navigation.replace("AddSuppliers", { groupId: group.id, fromCreate: true });
    } catch (err: any) {
      Alert.alert("Couldn't create group", err.message ?? "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingScreen style={styles.outer}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>New Group</Text>
        <TextInput style={styles.input} placeholder="Group name" value={name} onChangeText={setName} autoFocus />
        <TextInput
          style={styles.descriptionInput}
          placeholder="Description (optional)"
          placeholderTextColor="#bbb"
          value={description}
          onChangeText={setDescription}
        />
        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: "#fff" },
  container: { flexGrow: 1, padding: 24, paddingTop: 64 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 },
  descriptionInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
    fontSize: 14,
    color: "#555",
    marginBottom: 24,
  },
  button: { backgroundColor: "#128C7E", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
