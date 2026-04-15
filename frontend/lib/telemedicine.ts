export function isJitsiMeetingUrl(meetingUrl: string): boolean {
  if (!meetingUrl) return false;

  try {
    const host = new URL(meetingUrl).hostname.toLowerCase();
    return host === "meet.jit.si" || host.endsWith(".meet.jit.si") || host.includes("jitsi");
  } catch {
    return false;
  }
}

export function getJitsiRoomName(meetingUrl: string): string {
  if (!meetingUrl) return "";

  try {
    const url = new URL(meetingUrl);
    return url.pathname.replace(/^\/+/, "");
  } catch {
    return "";
  }
}

export function toJitsiEmbedUrl(meetingUrl: string): string {
  if (!isJitsiMeetingUrl(meetingUrl)) return "";
  return meetingUrl;
}
