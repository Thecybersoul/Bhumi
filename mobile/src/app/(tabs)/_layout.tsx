import { useCallback, useEffect, useState } from 'react'
import { Tabs, router, useFocusEffect } from 'expo-router'
import { useApi } from '@/lib/api'
import { AppState, Image, Platform, StyleSheet, Text, TouchableOpacity, View, type ColorValue } from 'react-native'
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

/* Search, the assistant, messages and the bell (each with its unread
   count), then the signed-in person. The count
   refreshes whenever a tab gains focus and when the app returns to
   the foreground. */
function Me() {
  const { user } = useSession()
  const api = useApi()
  const [unread, setUnread] = useState(0)
  const [chats, setChats] = useState(0)
  const load = useCallback(() => {
    api
      .get<{ unread: number }>('/api/notifications?limit=40')
      .then((r) => setUnread(r.unread))
      .catch(() => {})
    api
      .get<{ unread: number }>('/api/messages')
      .then((r) => setChats(r.unread))
      .catch(() => {})
  }, [api])
  useFocusEffect(load)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => st === 'active' && load())
    return () => sub.remove()
  }, [load])
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginRight: 14 }}>
      <TouchableOpacity onPress={() => router.push('/search')} hitSlop={8} accessibilityLabel="Search">
        <Ionicons name="search" size={22} color={colors.white} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/assistant')} hitSlop={8} accessibilityLabel="Assistant">
        <Ionicons name="sparkles" size={21} color={colors.goldTint} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/chat')} hitSlop={8} accessibilityLabel="Messages">
        <Ionicons name={chats ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color={colors.white} />
        {chats ? (
          <View style={s.badge}>
            <Text style={s.badgeText}>{chats > 9 ? '9+' : chats}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/notifications')} hitSlop={8} accessibilityLabel="Notifications">
        <Ionicons name={unread ? 'notifications' : 'notifications-outline'} size={23} color={colors.white} />
        {unread ? (
          <View style={s.badge}>
            <Text style={s.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/profile')} hitSlop={8}>
        <View style={s.meRing}>
          <Avatar name={user?.name} size={30} />
        </View>
      </TouchableOpacity>
    </View>
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
          // Web tab links carry 5px of padding the native tabs don't; without
          // the extra room the labels get squeezed and lose their descenders.
          height: 68 + insets.bottom + (Platform.OS === 'web' ? 6 : 0),
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
      <Tabs.Screen name="notes-tasks" options={{ title: 'Tasks', headerTitle: 'Tasks & notes', tabBarIcon: tabIcon('checkmark-circle-outline', 'checkmark-circle') }} />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: tabIcon('person-circle-outline', 'person-circle') }}
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
  badge: { position: 'absolute', top: -5, right: -7, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: colors.navy },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
})
