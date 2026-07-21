import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { createGroup } from "../api/groups";

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
      navigation.replace("GroupDetail", { groupId: group.id });
    } catch (err: any) {
      Alert.alert("Couldn't create group", err.message ?? "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Group</Text>
      <TextInput style={styles.input} placeholder="Group name" value={name} onChangeText={setName} autoFocus />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 64, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  button: { backgroundColor: "#128C7E", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
