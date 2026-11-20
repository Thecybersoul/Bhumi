import { useCallback, useEffect, useState } from 'react'
import { Tabs, router, useFocusEffect } from 'expo-router'
import { useApi } from '@/lib/api'
import { AppState, Image, Platform, StyleSheet, Text, TouchableOpacity, View, type ColorValue } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { colors } from '@/lib/theme'

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

function Logo() {
  return <Image source={require('../../../assets/logo-dark.png')} style={s.logo} resizeMode="contain" />
}

/* Search, the assistant, messages and the bell (each with its unread
   count). The signed-in person is the Profile tab, so not repeated here. The count
   refreshes whenever a tab gains focus and when the app returns to
   the foreground. */
function Me() {
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
    <View style={s.actions}>
      <TouchableOpacity onPress={() => router.push('/search')} hitSlop={8} accessibilityLabel="Search">
        <Ionicons name="search" size={20} color={colors.white} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/assistant')} hitSlop={8} accessibilityLabel="Assistant">
        <Ionicons name="sparkles" size={19} color={colors.goldTint} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/chat')} hitSlop={8} accessibilityLabel="Messages">
        <Ionicons name={chats ? 'chatbubbles' : 'chatbubbles-outline'} size={20} color={colors.white} />
        {chats ? (
          <View style={s.badge}>
            <Text style={s.badgeText}>{chats > 9 ? '9+' : chats}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/notifications')} hitSlop={8} accessibilityLabel="Notifications">
        <Ionicons name={unread ? 'notifications' : 'notifications-outline'} size={20} color={colors.white} />
        {unread ? (
          <View style={s.badge}>
            <Text style={s.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        ) : null}
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
        // A quiet, compact bar: the page name on the left, four actions on the right.
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        headerTitleAlign: 'left',
        headerLeft: () => null,
        headerTitleContainerStyle: { marginLeft: 16 },
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
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen name="sales" options={{ title: 'Sales', headerTitle: 'Sales funnel', tabBarIcon: tabIcon('funnel-outline', 'funnel') }} />
      <Tabs.Screen name="deals" options={{ href: null }} />
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
  logo: { width: 112, height: 112 * (260 / 1200) },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 20, marginRight: 18 },
  badge: { position: 'absolute', top: -5, right: -7, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: colors.navy },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
})
