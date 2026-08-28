import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

const icon = (name: IconName) =>
  ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.75)',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: icon('map-outline'),
        }}
      />
      <Tabs.Screen
        name="bda"
        options={{
          title: 'Reportes',
          tabBarIcon: icon('chatbubbles-outline'),
        }}
      />
      <Tabs.Screen
        name="noticias"
        options={{
          title: 'Noticias',
          tabBarIcon: icon('newspaper-outline'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#D95C27',
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    height: 76,
    paddingTop: 8,
    paddingBottom: 12,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
