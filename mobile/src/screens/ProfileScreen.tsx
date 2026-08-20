import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { deactivateProfile, deleteMyAccount, getMyProfiles } from "../api/auth";
import Avatar from "../components/Avatar";

export default function ProfileScreen({ navigation }: any) {
  const { token, activeProfile, setActiveProfile, signOut, userName, userPhoneNumber } = useAuth();
  const isOwner = activeProfile?.access === "OWNER";
  const canManageTeam = isOwner || activeProfile?.access === "MANAGE";
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeactivate = () => {
    const isBuyer = activeProfile?.profileType === "BUYER";
    const consequence = isBuyer
      ? "Any ongoing bids you've posted will be automatically closed."
      : "Your active bids will be withdrawn and you'll be removed from groups (reactivating later restores them).";

    Alert.alert("Deactivate this profile?", `"${activeProfile?.companyName}" will no longer be usable. ${consequence}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate",
        style: "destructive",
        onPress: async () => {
          setIsDeactivating(true);
          try {
            const { bidsClosed, responsesWithdrawn } = await deactivateProfile(
              { token: token!, profileId: activeProfile!.id },
              activeProfile!.id
            );
            const { profiles } = await getMyProfiles(token!);
            if (profiles.length > 0) {
              setActiveProfile(profiles[0]);
            } else {
              await signOut();
            }
            if (bidsClosed > 0) {
              Alert.alert("Profile deactivated", `${bidsClosed} ongoing bid(s) were closed.`);
            } else if (responsesWithdrawn > 0) {
              Alert.alert("Profile deactivated", `${responsesWithdrawn} of your bid(s) were withdrawn.`);
            }
          } catch (err: any) {
            Alert.alert("Couldn't deactivate profile", err.message ?? "Please try again");
          } finally {
            setIsDeactivating(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete your account?",
      "This permanently removes you from every profile you're a team member on and deletes your account. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              await deleteMyAccount(token!);
              await signOut();
            } catch (err: any) {
              Alert.alert("Couldn't delete account", err.message ?? "Please try again");
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.avatarRow}>
          <Avatar label={activeProfile?.companyName ?? "?"} size={64} />
          <View style={styles.avatarText}>
            <Text style={styles.companyName}>{activeProfile?.companyName}</Text>
            <Text style={styles.profileType}>
              {activeProfile?.profileType === "BUYER" ? "Buyer" : "Supplier"}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Your Name</Text>
          <Text style={styles.value}>{userName ?? "Not set"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Phone Number</Text>
          <Text style={styles.value}>{userPhoneNumber}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>GST Number</Text>
          <Text style={styles.value}>{activeProfile?.gstNumber ?? "Not set"}</Text>
        </View>

        <TouchableOpacity style={styles.teamButton} onPress={() => navigation.navigate("SwitchProfile")}>
          <Text style={styles.teamButtonText}>Switch Profile</Text>
        </TouchableOpacity>

        {canManageTeam && (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("TeamMembers")}>
            <Text style={styles.teamButtonText}>Team Members</Text>
          </TouchableOpacity>
        )}

        {canManageTeam && (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("EditProfile")}>
            <Text style={styles.teamButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}

        {isOwner && (
          <TouchableOpacity style={styles.deactivateButton} onPress={handleDeactivate} disabled={isDeactivating}>
            {isDeactivating ? <ActivityIndicator color="#B00020" /> : <Text style={styles.deactivateButtonText}>Deactivate Profile</Text>}
          </TouchableOpacity>
        )}

        {!isOwner && (
          <TouchableOpacity style={styles.deactivateButton} onPress={handleDeleteAccount} disabled={isDeletingAccount}>
            {isDeletingAccount ? (
              <ActivityIndicator color="#B00020" />
            ) : (
              <Text style={styles.deactivateButtonText}>Delete My Account</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
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
  body: { padding: 20 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
  avatarText: { flex: 1 },
  companyName: { fontSize: 18, fontWeight: "700" },
  profileType: { fontSize: 13, color: "#128C7E", fontWeight: "600", marginTop: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  label: { fontSize: 14, color: "#888" },
  value: { fontSize: 14, fontWeight: "600" },
  teamButton: { marginTop: 32, backgroundColor: "#F0FBF9", borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  secondaryButton: { marginTop: 12, backgroundColor: "#F0FBF9", borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  teamButtonText: { color: "#128C7E", fontWeight: "600" },
  deactivateButton: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B00020",
  },
  deactivateButtonText: { color: "#B00020", fontWeight: "600" },
  logoutButton: { marginTop: 12, backgroundColor: "#eee", borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  logoutText: { color: "#333", fontWeight: "600" },
});
