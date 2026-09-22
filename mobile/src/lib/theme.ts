/* Bridged by hand from app/globals.css in the web repo. Same
   names, same values — someone who knows the web admin should
   recognize this immediately. React Native can't read CSS custom
   properties, so this is the one place the values live for the
   app; when the web tokens change (rare — CLAUDE.md says don't
   rename them), update here too. */

export const colors = {
  navy: '#0E3B2E',
  navy900: '#0A2A20',
  navy800: '#0E3B2E',
  navy700: '#13513C',
  navy600: '#1B6B4F',
  navy500: '#2F8462',
  navyTint: '#E8F0EC',

  gold: '#C2974A',
  goldSoft: '#D9B978',
  goldDeep: '#9E7833',
  goldTint: '#FAF4E8',

  ink: '#10231B',
  ink2: '#3D4A55',
  muted: '#6C7A87',
  line: '#E3E1DA',
  line2: '#EFEDE7',
  cream: '#F7F5F0',
  paper: '#FCFBF8',
  bg: '#F2F0EA',
  white: '#FFFFFF',

  verified: '#1D7A4D',
  verifiedBg: '#E8F5EE',
  progress: '#1B6FA8',
  progressBg: '#E9F2F9',
  flagged: '#C0392B',
  flaggedBg: '#FCEEEC',
  pending: '#9A7B12',
  pendingBg: '#FBF4DF',
} as const

/* rem × 16, rounded — the web's --text-2xs … --text-2xl scale. */
export const text = {
  '2xs': 11,
  xs: 12,
  sm: 13,
  base: 14,
  md: 15,
  lg: 17,
  xl: 21,
  '2xl': 30,
} as const

export const radius = { sm: 8, base: 12, lg: 18, xl: 26 } as const
export const space = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28 } as const

export const statusColor: Record<string, { fg: string; bg: string }> = {
  verified: { fg: colors.verified, bg: colors.verifiedBg },
  live: { fg: colors.verified, bg: colors.verifiedBg },
  progress: { fg: colors.progress, bg: colors.progressBg },
  reserved: { fg: colors.progress, bg: colors.progressBg },
  contacted: { fg: colors.progress, bg: colors.progressBg },
  flagged: { fg: colors.flagged, bg: colors.flaggedBg },
  sold: { fg: colors.flagged, bg: colors.flaggedBg },
  lost: { fg: colors.flagged, bg: colors.flaggedBg },
  pending: { fg: colors.pending, bg: colors.pendingBg },
  new: { fg: colors.pending, bg: colors.pendingBg },
}
