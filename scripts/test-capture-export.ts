/* Checks lib/capture.ts parseExport() on WhatsApp's Android and iPhone
   export formats. Run after touching the export parser:

     npx tsx scripts/test-capture-export.ts */
import { parseExport, titleFromFilename } from '../lib/capture'

let failed = 0
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : `\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`}`)
}

const android = `19/11/2026, 10:15 am - Messages and calls are end-to-end encrypted. Only people in this chat can read them.
19/11/2026, 10:15 am - Ravi Kumar: 5 acres Devanahalli
rate 4.5 cr per acre, A khata
19/11/2026, 10:17 pm - Sanjog: Send the RTC please
20/11/2026, 9:02 am - +91 98450 12345: IMG-20261120-WA0003.jpg (file attached)
20/11/2026, 9:03 am - Ravi Kumar: <Media omitted>
20/11/2026, 9:04 am - Ravi Kumar: location: https://maps.google.com/?q=13.24,77.71`
const a = parseExport(android, 'Sanjog')
eq('android count (system line dropped)', a.messages.length, 5)
eq('android multi-line body', a.messages[0].body, '5 acres Devanahalli\nrate 4.5 cr per acre, A khata')
eq('android 10:15 am IST → UTC', a.messages[0].sent_at, '2026-11-19T04:45:00.000Z')
eq('android pm', a.messages[1].sent_at, '2026-11-19T16:47:00.000Z')
eq('android from_me', a.messages[1].from_me, true)
eq('android phone sender', [a.messages[2].sender_phone, a.messages[2].sender_name], ['+91 98450 12345', ''])
eq('android image attached', [a.messages[2].kind, a.messages[2].media_ref], ['image', 'IMG-20261120-WA0003.jpg'])
eq('android media omitted', a.messages[3].kind, 'other')
eq('android location', a.messages[4].kind, 'location')
eq('android not a group (2 senders + phone)', a.is_group, true)

const ios = `[19/11/26, 10:15:32 AM] Plots Group: ‎Messages and calls are end-to-end encrypted.
[19/11/26, 10:16:05 AM] Manju Broker: Need 2 acre land Hoskote budget 3 cr
[19/11/26, 10:20:00 PM] Ravi: ‎image omitted
[19/11/26, 10:21:00 PM] Ravi: <attached: 00000012-PHOTO-2026-11-19-22-21-00.jpg>`
const b = parseExport(ios)
eq('ios count', b.messages.length, 3)
eq('ios time', b.messages[0].sent_at, '2026-11-19T04:46:05.000Z')
eq('ios image omitted', b.messages[1].kind, 'image')
eq('ios attached', [b.messages[2].kind, b.messages[2].media_ref], ['image', '00000012-PHOTO-2026-11-19-22-21-00.jpg'])

eq('title android', titleFromFilename('WhatsApp Chat with Ravi Kumar.txt'), 'Ravi Kumar')
eq('title ios zip', titleFromFilename('WhatsApp Chat - Plots Group.zip'), 'Plots Group')

console.log(failed ? `\n${failed} failed` : '\nAll passed')
process.exit(failed ? 1 : 0)
