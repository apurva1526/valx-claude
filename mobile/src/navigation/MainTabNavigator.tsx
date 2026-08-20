import React, { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { getNotifications } from "../api/notifications";

import GroupListScreen from "../screens/GroupListScreen";
import CreateGroupScreen from "../screens/CreateGroupScreen";
import GroupDetailScreen from "../screens/GroupDetailScreen";
import GroupSuppliersScreen from "../screens/GroupSuppliersScreen";
import AddSuppliersScreen from "../screens/AddSuppliersScreen";
import CreateBidScreen from "../screens/CreateBidScreen";
import BidDetailScreen from "../screens/BidDetailScreen";
import EditBidScreen from "../screens/EditBidScreen";
import BidChatScreen from "../screens/BidChatScreen";
import UpdatesScreen from "../screens/UpdatesScreen";
import ProfileScreen from "../screens/ProfileScreen";
import TeamMembersScreen from "../screens/TeamMembersScreen";
import AddTeamMemberScreen from "../screens/AddTeamMemberScreen";
import SwitchProfileScreen from "../screens/SwitchProfileScreen";
import AddProfileScreen from "../screens/AddProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import GroupMembersScreen from "../screens/GroupMembersScreen";
import GroupInfoScreen from "../screens/GroupInfoScreen";
import ValXChatScreen from "../screens/ValXChatScreen";

const ChatsStack = createNativeStackNavigator();
function ChatsStackNavigator() {
  return (
    <ChatsStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatsStack.Screen name="GroupList" component={GroupListScreen} />
      <ChatsStack.Screen name="ValXChat" component={ValXChatScreen} />
      <ChatsStack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <ChatsStack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <ChatsStack.Screen name="GroupInfo" component={GroupInfoScreen} />
      <ChatsStack.Screen name="GroupSuppliers" component={GroupSuppliersScreen} />
      <ChatsStack.Screen name="GroupMembers" component={GroupMembersScreen} />
      <ChatsStack.Screen name="AddSuppliers" component={AddSuppliersScreen} />
      <ChatsStack.Screen name="CreateBid" component={CreateBidScreen} />
      <ChatsStack.Screen name="BidDetail" component={BidDetailScreen} />
      <ChatsStack.Screen name="EditBid" component={EditBidScreen} />
      <ChatsStack.Screen name="BidChat" component={BidChatScreen} />
      <ChatsStack.Screen name="TeamMembers" component={TeamMembersScreen} />
      <ChatsStack.Screen name="AddTeamMember" component={AddTeamMemberScreen} />
    </ChatsStack.Navigator>
  );
}

const UpdatesStack = createNativeStackNavigator();
function UpdatesStackNavigator() {
  return (
    <UpdatesStack.Navigator screenOptions={{ headerShown: false }}>
      <UpdatesStack.Screen name="UpdatesHome" component={UpdatesScreen} />
    </UpdatesStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator();
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="TeamMembers" component={TeamMembersScreen} />
      <ProfileStack.Screen name="AddTeamMember" component={AddTeamMemberScreen} />
      <ProfileStack.Screen name="SwitchProfile" component={SwitchProfileScreen} />
      <ProfileStack.Screen name="AddProfile" component={AddProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    </ProfileStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { token, activeProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(() => {
    if (!token || !activeProfile) return;
    getNotifications({ token, profileId: activeProfile.id })
      .then(({ notifications }) => setUnreadCount(notifications.filter((n) => !n.readAt).length))
      .catch(() => {});
  }, [token, activeProfile]);

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: "#128C7E" }}>
      <Tab.Screen
        name="UpdatesTab"
        component={UpdatesStackNavigator}
        options={{
          title: "Updates",
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "notifications" : "notifications-outline"} size={size} color={color} />
          ),
        }}
        listeners={{ focus: refreshUnreadCount }}
      />
      <Tab.Screen
        name="ChatsTab"
        component={ChatsStackNavigator}
        options={{
          title: "Chats",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
