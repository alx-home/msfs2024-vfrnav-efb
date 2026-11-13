import { notificationText } from "./content/notifications";
import { resourceUrls } from "./content/support";

const cookieName = "vfrnav-read-news";

export function notificationHash(content: string): string {
  let hash = 2166136261;
  for (let index = 0; index < content.length; index++) {
    hash = Math.imul(hash ^ content.charCodeAt(index), 16777619);
  }
  return `news-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export const notificationIds = {
  survey: notificationHash(JSON.stringify([resourceUrls[5], ...Object.values(notificationText).map((text) => text.survey)])),
  version: notificationHash(JSON.stringify(["#release-1.5.0", ...Object.values(notificationText).map((text) => text.version)]))
};

export function readNotificationIds(cookies: string): string[] {
  const value = cookies.split(";").map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  return value ? value.split(",").filter((id) => /^[a-z0-9.-]+$/.test(id)) : [];
}

export function notificationCookie(ids: readonly string[], pathname: string, secure: boolean): string {
  const path = pathname.slice(0, pathname.lastIndexOf("/") + 1) || "/";
  return `${cookieName}=${ids.join(",")}; Path=${path}; Max-Age=31536000; SameSite=Lax${secure ? "; Secure" : ""}`;
}
