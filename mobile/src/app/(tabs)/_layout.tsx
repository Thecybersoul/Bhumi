import { Tabs } from 'expo-router'
import { Image } from 'react-native'
import { colors, text } from '@/lib/theme'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
        headerLeft: () => (
          <Image
            source={require('../../../assets/monogram.png')}
            style={{ width: 26, height: 26, marginLeft: 16, marginRight: 4 }}
            resizeMode="contain"
          />
        ),
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: text['2xs'], fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="deals" options={{ title: 'Deals' }} />
      <Tabs.Screen name="properties" options={{ title: 'Listings' }} />
      <Tabs.Screen name="notes-tasks" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  )
}
