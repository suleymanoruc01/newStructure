import { Linking, Platform, Share } from 'react-native';

function icsUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcs(value: string): string {
  return value.replace(/[\\;,\n]/g, (char) =>
    char === '\n' ? '\\n' : `\\${char}`,
  );
}

function googleUrl(input: {
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string;
}): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates: `${icsUtc(input.startsAt)}/${icsUtc(input.endsAt)}`,
  });
  if (input.location) {
    params.set('location', input.location);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export async function addEventToCalendar(input: {
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string;
}): Promise<void> {
  const beginTime = new Date(input.startsAt).getTime();
  const endTime = new Date(input.endsAt).getTime();
  if (Platform.OS === 'android') {
    const intent =
      'intent://event#Intent;' +
      'action=android.intent.action.INSERT;' +
      'type=vnd.android.cursor.item/event;' +
      `S.title=${encodeURIComponent(input.title)};` +
      `l.beginTime=${beginTime};` +
      `l.endTime=${endTime};` +
      (input.location
        ? `S.eventLocation=${encodeURIComponent(input.location)};`
        : '') +
      'end';
    if (await Linking.canOpenURL(intent)) {
      await Linking.openURL(intent);
      return;
    }
  }
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PartOn//TR',
    'BEGIN:VEVENT',
    `UID:${beginTime}@parton.app`,
    `DTSTAMP:${icsUtc(new Date().toISOString())}`,
    `DTSTART:${icsUtc(input.startsAt)}`,
    `DTEND:${icsUtc(input.endsAt)}`,
    `SUMMARY:${escapeIcs(input.title)}`,
    input.location ? `LOCATION:${escapeIcs(input.location)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter((line): line is string => line != null)
    .join('\r\n');
  try {
    await Share.share({ title: input.title, message: ics });
  } catch {
    await Linking.openURL(googleUrl(input));
  }
}
