import { Tabs } from 'expo-router'
import { Image, Platform, StyleSheet, View, type ColorValue } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { colors, text } from '@/lib/theme'

/* Every tab needs an explicit icon. Without one, React Navigation
   falls back to a glyph from an icon font the app doesn't bundle,
   and Android draws it as an empty "tofu" box — which is what the
   first builds shipped with. Outline when idle, filled when active,
   the active one sitting in a soft green pill. */
type IconName = keyof typeof Ionicons.glyphMap

function tabIcon(idle: IconName, active: IconName) {
  function TabIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return (
      <View style={[s.pill, focused && s.pillOn]}>
        <Ionicons name={focused ? active : idle} size={21} color={color as string} />
      </View>
    )
  }
  return TabIcon
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerShadowVisible: false,
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 19 },
        headerLeft: () => (
          <Image
            source={require('../../../assets/monogram.png')}
            style={{ width: 26, height: 26, marginLeft: 16, marginRight: 6 }}
            resizeMode="contain"
          />
        ),
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          height: 70 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          ...Platform.select({ android: { elevation: 12 } }),
        },
        tabBarLabelStyle: { fontSize: text['2xs'], fontWeight: '700', marginTop: 4, lineHeight: 14 },
        tabBarItemStyle: { paddingVertical: 0 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: tabIcon('grid-outline', 'grid') }} />
      <Tabs.Screen name="deals" options={{ title: 'Deals', tabBarIcon: tabIcon('briefcase-outline', 'briefcase') }} />
      <Tabs.Screen name="properties" options={{ title: 'Listings', tabBarIcon: tabIcon('map-outline', 'map') }} />
      <Tabs.Screen
        name="notes-tasks"
        options={{ title: 'Tasks', tabBarIcon: tabIcon('checkmark-circle-outline', 'checkmark-circle') }}
      />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: tabIcon('menu-outline', 'menu') }} />
    </Tabs>
  )
}

const s = StyleSheet.create({
  pill: { width: 52, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: colors.navyTint },
})
