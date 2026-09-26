import { Tabs, router } from 'expo-router'
import { Image, Platform, StyleSheet, TouchableOpacity, View, type ColorValue } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { colors } from '@/lib/theme'
import { useSession } from '@/lib/auth'
import { Avatar } from '@/components/people'

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
        <Ionicons name={focused ? active : idle} size={20} color={color as string} />
      </View>
    )
  }
  return TabIcon
}

function Monogram() {
  return <Image source={require('../../../assets/monogram.png')} style={s.monogram} resizeMode="contain" />
}

function Logo() {
  return <Image source={require('../../../assets/logo-dark.png')} style={s.logo} resizeMode="contain" />
}

function Me() {
  const { user } = useSession()
  return (
    <TouchableOpacity onPress={() => router.push('/profile')} style={{ marginRight: 16 }} hitSlop={8}>
      <View style={s.meRing}>
        <Avatar name={user?.name} size={30} />
      </View>
    </TouchableOpacity>
  )
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
        headerLeft: () => <Monogram />,
        headerRight: () => <Me />,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          height: 68 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          ...Platform.select({ android: { elevation: 12 } }),
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 4, lineHeight: 13 },
        tabBarItemStyle: { paddingVertical: 0, paddingHorizontal: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: () => <Logo />,
          headerLeft: () => null,
          headerTitleAlign: 'left',
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen name="deals" options={{ title: 'Deals', tabBarIcon: tabIcon('briefcase-outline', 'briefcase') }} />
      <Tabs.Screen name="properties" options={{ title: 'Listings', tabBarIcon: tabIcon('map-outline', 'map') }} />
      <Tabs.Screen name="meetings" options={{ title: 'Meetings', tabBarIcon: tabIcon('people-outline', 'people') }} />
      <Tabs.Screen name="notes-tasks" options={{ title: 'Tasks', tabBarIcon: tabIcon('checkmark-circle-outline', 'checkmark-circle') }} />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', headerRight: () => null, tabBarIcon: tabIcon('person-circle-outline', 'person-circle') }}
      />
    </Tabs>
  )
}

const s = StyleSheet.create({
  pill: { width: 44, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: colors.navyTint },
  monogram: { width: 26, height: 26, marginLeft: 16, marginRight: 6 },
  logo: { width: 150, height: 150 * (260 / 1200) },
  meRing: { borderRadius: 17, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
})
