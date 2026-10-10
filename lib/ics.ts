// Minimal iCalendar (.ics) invite so the consultation lands in the caller's and designer's calendar.
// No prices, and no promise of a site visit: location stays "to be confirmed".

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");

export function buildInvite(a: {
  uid: string;
  startIso: string;
  minutes?: number;
  organizerEmail: string;
  attendees: { name?: string | null; email: string }[];
  callerName?: string | null;
}): string {
  const start = new Date(a.startIso);
  const end = new Date(start.getTime() + (a.minutes ?? 45) * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aangan Studio//Call Agent//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${a.uid}@aangan-call-agent`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc("Aangan Studio design consultation")}`,
    `DESCRIPTION:${esc(`Consultation with an Aangan Studio designer${a.callerName ? ` for ${a.callerName}` : ""}. Your designer will confirm the details and walk you through next steps.`)}`,
    `LOCATION:${esc("To be confirmed by your designer")}`,
    `ORGANIZER:mailto:${a.organizerEmail}`,
    ...a.attendees.map((p) => `ATTENDEE;CN=${esc(p.name ?? p.email)};RSVP=TRUE:mailto:${p.email}`),
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
