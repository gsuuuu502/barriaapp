import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="otros"
        options={{
          title: 'Otros',
          tabBarIcon: ({ color }) => (
            <View style={[styles.icon, { borderColor: color }]}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <View style={[styles.dot, { backgroundColor: color }]} />
              <View style={[styles.dot, { backgroundColor: color }]} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => (
            <View style={[styles.icon, { borderColor: color }]}>
              <View style={[styles.homeIcon, { backgroundColor: color }]} />
            </View>
          ),
          tabBarLabelStyle: [styles.tabLabel, styles.activeLabel],
        }}
      />
      <Tabs.Screen
        name="noticias"
        options={{
          title: 'Noticias',
          tabBarIcon: ({ color }) => (
            <View style={[styles.icon, { borderColor: color }]}>
              <View style={[styles.newsIcon, { backgroundColor: color }]} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="bda"
        options={{
          title: 'BDA',
          tabBarIcon: ({ color }) => (
            <View style={[styles.icon, { borderColor: color }]}>
              <View style={[styles.flagPole, { backgroundColor: color }]} />
              <View style={[styles.flagTriangle, { borderLeftColor: color }]} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#E44F19',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: 90,
    paddingTop: 10,
    paddingBottom: 30,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeLabel: {
    fontWeight: '700',
  },
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginBottom: 2,
  },
  homeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  newsIcon: {
    width: 18,
    height: 14,
    borderRadius: 2,
  },
  flagPole: {
    width: 3,
    height: 18,
    borderRadius: 1,
    position: 'absolute',
    left: 8,
  },
  flagTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 9,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    position: 'absolute',
    left: 11,
    top: 3,
  },
});
