import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Typography } from '../../src/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused, color }: { name: IoniconName; focused: boolean; color: any }) {
  return <Ionicons name={name} size={24} color={color} />;
}

export default function TabsLayout() {
  const { C } = useTheme();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   C.tabActive,
        tabBarInactiveTintColor: C.tabInactive,
        tabBarStyle: {
          backgroundColor:  C.tabBarBg,
          borderTopColor:   C.border,
          borderTopWidth:   1,
          height:           Platform.OS === 'ios' ? 82 : 64,
          paddingBottom:    Platform.OS === 'ios' ? 24 : 8,
          paddingTop:       8,
        },
        tabBarLabelStyle: {
          fontSize:   Typography.size.xs,
          fontWeight: Typography.weight.semibold,
          marginTop:  2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'lock-closed' : 'lock-closed-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="security"
        options={{
          title: 'Security',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'notifications' : 'notifications-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'person-circle' : 'person-circle-outline'} focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
