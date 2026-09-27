import { Alert, Platform, type AlertButton } from 'react-native'

/* react-native-web ships Alert.alert as a no-op, so on the iPhone
   home-screen app every "Delete this?" button silently did nothing.
   On web, route it through the browser's own dialogs:
     no / one button  → window.alert, then that button's handler
     OK + Cancel      → window.confirm
     a menu (3+)      → window.prompt with numbered choices
   Native keeps the real Alert. Imported once from the root layout. */

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    const body = [title, message].filter(Boolean).join('\n\n')
    const list = buttons ?? []
    const act = list.filter((b) => b.style !== 'cancel')
    const cancel = list.find((b) => b.style === 'cancel')
    if (list.length <= 1) {
      window.alert(body)
      list[0]?.onPress?.()
      return
    }
    if (act.length === 1) {
      if (window.confirm(`${body}\n\nOK = ${act[0].text ?? 'OK'}`)) act[0].onPress?.()
      else cancel?.onPress?.()
      return
    }
    const choice = window.prompt(`${body}\n\n${act.map((b, i) => `${i + 1}. ${b.text}`).join('\n')}\n\nType a number:`)
    const picked = act[Number(choice) - 1]
    if (picked) picked.onPress?.()
    else cancel?.onPress?.()
  }
}
